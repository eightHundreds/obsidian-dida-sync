import { MarkdownView, Notice, Plugin } from "obsidian";
import "@total-typescript/ts-reset";
import path from "path";
import { TodoAppClientFacade } from "./core/dida";
// @ts-expect-error
import * as yamlFront from "yaml-front-matter";
import debug from "debug";
import {
	DiDaSyncPluginSettings,
	DidaConfig,
	DidaFrontMatter,
	ServeType,
	TaskStatus,
} from "./types";
import { isFulfilled } from "./utils";
import { t } from "i18next";
import DidaSettingTab from "./settings";
import { settingAtom, settingAtomFamily, store } from "./store";
import { PLUGIN_ID } from "./constants";
import MarkdownGenerator from "./core/markdownGenerator";
import "./locale";

const defaultSettings: DiDaSyncPluginSettings = {
	didaPassword: "",
	didaUserName: "",
	debug: false,
	disablePageHeaderAction: false,
};

export default class DiDaSyncPlugin extends Plugin {
	didaClient: TodoAppClientFacade;
	log: (...args: any[]) => any;
	async onload() {
		await this.loadSettings();
		this.didaClient = new TodoAppClientFacade({
			username: this.settings.didaUserName,
			password: this.settings.didaPassword,
		});
		this.log = debug("dida365:plugin");

		if (this.settings.debug) {
			debug.enable("dida365:*");
		}

		this.registerCommends();
		this.registerPageHeaderAction();
		this.registerSettingChange();
		this.addSettingTab(new DidaSettingTab(this.app, this));
	}

	public get settings() {
		return store.get(settingAtom);
	}

	public updateSetting<T extends keyof DiDaSyncPluginSettings>(
		key: T,
		val: DiDaSyncPluginSettings[T],
	) {
		store.set(settingAtomFamily(key), val);
		void this.saveSettings();
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerCommends() {
		this.addCommand({
			id: "sync-current-file",
			name: t("syncToDoList"),
			editorCheckCallback: (checking, editor, ctx) => {
				this.log(`命令${checking ? "检测中" : "执行中"}`);
				const frontmatter = yamlFront.loadFront(
					editor.getValue(),
				) as any;
				const didaFrontMatter = (frontmatter?.dida ||
					frontmatter?.ticktick) as DidaFrontMatter;

				if (checking) {
					this.log("editor check callback", didaFrontMatter);
					if (!didaFrontMatter) {
						return false;
					}

					return true;
				}

				if (!checking && !didaFrontMatter) {
					new Notice(t("configNotFound"));
					return;
				}

				const getDidaConfigFromFrontmatter = (frontmatter: any) => {
					const didaConfig = this.transformFrontMatter(frontmatter);

					const tags = Array.isArray(didaConfig.tags)
						? didaConfig.tags
						: [didaConfig.tags].filter((v: any): v is string =>
								Boolean(v),
						  );
					const { startDate } = didaConfig;
					const { status } = didaConfig;
					let finalStatus: TaskStatus | undefined;
					if (status === "completed") {
						finalStatus = TaskStatus.Completed;
					} else if (status === "uncompleted") {
						finalStatus = TaskStatus.UnCompleted;
					}

					return {
						...didaConfig,
						tags,
						startDate,
						status: finalStatus,
					} as unknown as DidaConfig;
				};

				const didaConfig = getDidaConfigFromFrontmatter(frontmatter);
				const { startDate, tags } = didaConfig;

				new Notice(t("beginSync"));
				void this.didaClient
					.getItems({
						startDate,
						tags,
						excludeTags: didaConfig.excludeTags,
						projectId: didaConfig.projectId,
						type: didaConfig.type,
						taskId: didaConfig.taskId,
						status: didaConfig.status,
					})
					.then(async (tasks) => {
						const generator = new MarkdownGenerator(this);
						const mdSegments = await Promise.allSettled(
							tasks.map(async (item) => {
								const downloadResult =
									await this.didaClient.downloadAttachment(
										item,
										didaFrontMatter.type,
									);
								const files = downloadResult
									.filter(isFulfilled)
									.map((res) => res.value);

								// 下载附件
								const savedFiles = await Promise.allSettled(
									files.map(async (file) => {
										const fileExist = this.app.vault
											.getFiles()
											.find((_file) =>
												_file.path.includes(file.id),
											);
										if (fileExist) {
											return fileExist;
										}

										const obFile =
											await this.app.vault.createBinary(
												// @ts-expect-error
												(await this.app.vault.getAvailablePathForAttachments(
													`${file.id}`,
													path
														.extname(file.path)
														.replace(".", ""),
													ctx.file,
												)) as string,
												file.arrayBuffer,
											);
										return obFile;
									}),
								);

								return generator.taskToMarkdown(
									item,
									savedFiles
										.filter(isFulfilled)
										.map((a) => a.value),
								);
							}),
						);
						const mdText = mdSegments
							.filter(isFulfilled)
							.map((v) => v.value)
							.join("\n");

						const currentText = editor.getValue();
						// 获得frontmatter的位置
						const startOfFrontmatter = currentText.indexOf("---");
						const endOfFrontmatter = currentText.indexOf(
							"---",
							startOfFrontmatter + 3,
						);
						const lineOfFrontmatter = currentText
							.substring(startOfFrontmatter, endOfFrontmatter)
							.split("\n").length;

						editor.replaceRange(
							mdText,
							{ line: lineOfFrontmatter, ch: 0 },
							{
								line: editor.lastLine() + 1,
								ch: 0,
							},
						);
						new Notice(t("syncSuccess"));
					})
					.catch((err) => {
						new Notice(`${t("syncFailed")} ${err.message}`);
						this.log(err);
					});

				return true;
			},
		});
	}

	private transformFrontMatter(frontmatter: Record<string, any>) {
		let config = frontmatter?.dida || frontmatter?.ticktick;
		if (config) {
			if (typeof config === "boolean") {
				// @ts-expect-error
				config = {};
			}

			if (frontmatter?.dida) {
				config.type = ServeType.Dida;
			}

			if (frontmatter?.ticktick) {
				config.type = ServeType.TickTick;
			}

			return config as DidaFrontMatter;
		}

		// 判断是否存在类似dida.xxx的配置, 将他们转换为dida的配置
		const didaConfig: Partial<DidaFrontMatter> = {};
		Object.keys(frontmatter).forEach((key) => {
			if (key.startsWith("dida.")) {
				didaConfig.type = ServeType.Dida;
				// @ts-expect-error
				didaConfig[key.replace("dida.", "")] = frontmatter[key];
			} else if (key.startsWith("ticktick.")) {
				didaConfig.type = ServeType.TickTick;
				// @ts-expect-error
				didaConfig[key.replace("ticktick.", "")] = frontmatter[key];
			}
		});

		return didaConfig;
	}

	private registerPageHeaderAction() {
		this.app.workspace.on("layout-change", () => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				const { view } = leaf;
				if (!(view instanceof MarkdownView)) {
					return;
				}

				const syncBtn = view.actionsEl.querySelector(
					`a[aria-label="${t("beginSync")}"]`,
				);

				if (this.settings.disablePageHeaderAction) {
					if (syncBtn) {
						syncBtn.remove();
					}

					return;
				}

				const frontmatter = yamlFront.loadFront(
					view.editor.getValue(),
				) as any;
				const hasDidaFlag = frontmatter?.dida || frontmatter?.ticktick;

				if (hasDidaFlag && !syncBtn) {
					view.addAction("check-circle", t("beginSync"), async () => {
						this.app.commands.executeCommandById(
							`${PLUGIN_ID}:sync-current-file`,
						);
					});
				} else if (!hasDidaFlag && syncBtn) {
					syncBtn.remove();
				}
			});
		});

		// 销毁时把action的按钮移除
		this.register(() => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				const { view } = leaf;
				if (!(view instanceof MarkdownView)) {
					return;
				}

				const syncBtn = view.actionsEl.querySelector(
					`a[aria-label="${t("beginSync")}"]`,
				);
				syncBtn?.remove();
			});
		});
	}

	private registerSettingChange() {
		this.register(
			store.sub(settingAtomFamily("didaUserName"), () => {
				this.didaClient = new TodoAppClientFacade({
					username: this.settings.didaUserName,
					password: this.settings.didaPassword,
				});
			}),
		);

		this.register(
			store.sub(settingAtomFamily("didaPassword"), () => {
				this.didaClient = new TodoAppClientFacade({
					username: this.settings.didaUserName,
					password: this.settings.didaPassword,
				});
			}),
		);

		this.register(
			store.sub(settingAtomFamily("debug"), () => {
				if (this.settings.debug) {
					debug.enable("dida365:*");
				} else {
					debug.disable();
				}
			}),
		);
	}

	private async loadSettings() {
		store.set(settingAtom, {
			...defaultSettings,
			...(await this.loadData()),
		});
	}
}

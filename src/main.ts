import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian';
import {DiDa365API} from './dida';
import debug from 'debug';
import {DidaFrontMatter} from './types';
import {taskToMarkdown} from './utils';

type DiDaSyncPluginSettings = {
	didaPassword: string;
	didaUserName: string;
	debug: boolean;
};

const defaultSettings: DiDaSyncPluginSettings = {
	didaPassword: '',
	didaUserName: '',
	debug: false,
};

export default class DiDaSyncPlugin extends Plugin {
	settings: DiDaSyncPluginSettings;
	didaClient: DiDa365API;
	log: (...args: any[]) => any;
	async onload() {
		await this.loadSettings();
		this.didaClient = new DiDa365API({
			username: this.settings.didaUserName,
			password: this.settings.didaPassword,
		});
		this.log = debug('dida365:plugin');
		if (this.settings.debug) {
			debug.enable('dida365:*');
		}

		this.registerCommends();
		this.addSettingTab(new DidaSettingTab(this.app, this));
		this.log('init done');
	}

	registerCommends() {
		this.addCommand({
			id: 'sync-current-file',
			name: '同步当前笔记',
			editorCheckCallback: (checking, editor, ctx) => {
				const {file} = ctx as MarkdownView;
				const fileCache = this.app.metadataCache.getFileCache(file);
				const didaConfig = fileCache?.frontmatter?.dida as DidaFrontMatter;
				if (file?.extension === 'md' && didaConfig && fileCache) {
					if (!checking) {
						new Notice('未在当前笔记发现滴答清单相关配置');
					}

					return false;
				}

				const tags = Array.isArray(didaConfig.tags) ? didaConfig.tags : [didaConfig.tags].filter((v: any): v is string => Boolean(v));
				const {startDate} = didaConfig;
				void this.didaClient.getItems({
					startDate,
					tags,
					projectId: didaConfig.projectId,
				}).then(tasks => {
					const mdText = taskToMarkdown(tasks);
					const currentText = editor.getValue();
					// 获得frontmatter的位置
					const startOfFrontmatter = currentText.indexOf('---');
					const endOfFrontmatter = currentText.indexOf('---', startOfFrontmatter + 3);
					const lineOfFrontmatter = currentText.substring(startOfFrontmatter, endOfFrontmatter).split('\n').length;

					editor.replaceRange(mdText, {line: lineOfFrontmatter, ch: 0}, {
						line: editor.lastLine() + 1,
						ch: 0,
					});
					new Notice('同步成功');
				});

				return true;
			},
		});
	}

	async loadSettings() {
		this.settings = {
			...defaultSettings,
			...await this.loadData(),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.didaClient = new DiDa365API({
			username: this.settings.didaUserName,
			password: this.settings.didaPassword,
		});
	}
}

class DidaSettingTab extends PluginSettingTab {
	plugin: DiDaSyncPlugin;

	constructor(app: App, plugin: DiDaSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl).setName('用户名').addText(text =>
			text
				.setPlaceholder('请输入你的用户名')
				.setValue(this.plugin.settings.didaUserName)
				.onChange(async value => {
					this.plugin.settings.didaUserName = value;
					await this.plugin.saveSettings();
				}),
		);

		new Setting(containerEl).setName('密码').addText(text =>
			text
				.setPlaceholder('请输入你的密码')
				.setValue(this.plugin.settings.didaPassword)
				.onChange(async value => {
					this.plugin.settings.didaPassword = value;
					await this.plugin.saveSettings();
				}),
		);

		new Setting(containerEl).setName('调试模式').addToggle(toggle =>
			toggle
				.setValue(this.plugin.settings.debug)
				.onChange(async value => {
					this.plugin.settings.debug = value;
					await this.plugin.saveSettings();
				},
				),
		);
	}
}

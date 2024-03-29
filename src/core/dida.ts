import dayjs from "dayjs";
import path from "path";
import { Tasks, requestUrl } from "obsidian";
import qs from "querystring";
import { DidaConfig, DidaFrontMatter, ServeType, TaskStatus } from "../types";
import debug from "debug";

type DiDa365APIOptions = {
	username: string;
	password: string;
	apiHost?: string;
	host?: string;
};

export type Item = {
	id: string;
	projectId: string;
	sortOrder: number;
	title: string;
	exDate: any[];
	repeatTaskId: any;
	content: string;
	repeatFrom: any;
	desc: string;
	timeZone: string;
	isFloating: boolean;
	isAllDay: boolean;
	reminder: string;
	reminders: any[];
	priority: number;
	status: number;
	items: any[];
	progress: number;
	attachments: Array<{
		createdTime: string;
		fileName: string;
		fileType: string;
		id: string;
		path: string;
		size: number;
	}>;
	dueDate?: string;
	modifiedTime: string;
	etag: string;
	deleted: number;
	createdTime: string;
	creator: number;
	focusSummaries: any[];
	commentCount: number;
	columnId: string;
	kind: string;
	deletedTime: number;
	tags: string[];
};
type IDiDa365API = {
	getItems(filterOptions?: DidaConfig): Promise<Item[]>;
};
export class DiDa365API implements IDiDa365API {
	private cookies: string[] = [];
	private cookieHeader: string;
	private expTime: number;
	private readonly options: Required<DiDa365APIOptions>;
	private readonly log: (...args: any[]) => any;
	constructor(options: DiDa365APIOptions) {
		this.options = {
			apiHost: "https://api.dida365.com",
			host: "https://dida365.com",
			...options,
		};
		this.log = debug("dida365:api");
	}

	public async getItems(filterOptions: DidaConfig) {
		this.log("getItem filterOptions", filterOptions);
		await this.checkLogin();

		const startDateTimestamp = filterOptions?.startDate
			? dayjs(filterOptions.startDate).valueOf()
			: dayjs().subtract(180, "day").valueOf();
		// 创建时间或截止时间在startDate之前的
		const uncompleted = (await this.getAllUnCompleted()).filter((item) => {
			if (
				item.createdTime &&
				dayjs(item.createdTime).valueOf() > startDateTimestamp
			) {
				return true;
			}

			if (
				item.dueDate &&
				dayjs(item.dueDate).valueOf() > startDateTimestamp
			) {
				return true;
			}

			return false;
		});

		const completed = await this.getAllCompleted(startDateTimestamp);

		const noAbandoned = (item: Item) =>
			item.status !== TaskStatus.Abandoned;

		const filterProjectId = (item: Item) => {
			if (!filterOptions?.projectId) {
				return true;
			}

			return item.projectId === filterOptions.projectId;
		};

		const filterTags = (item: Item) => {
			// ExcludeTag优先级更高,只要命中则把这个task去掉
			if (filterOptions.excludeTags?.length && item.tags?.length) {
				const _tags = Array.isArray(filterOptions.excludeTags)
					? filterOptions.excludeTags
					: [filterOptions.excludeTags];

				if (_tags?.some((t) => item.tags.includes(t))) {
					return false;
				}
			}

			if (filterOptions.tags?.length) {
				if (!item.tags?.length) {
					return false;
				}

				const _tags = Array.isArray(filterOptions.tags)
					? filterOptions.tags
					: [filterOptions.tags];
				return _tags?.some((t) => item.tags.includes(t));
			}

			return true;
		};

		const filterStatus = (item: Item) => {
			if (typeof filterOptions?.status !== "number") {
				return true;
			}

			return item.status === filterOptions.status;
		};

		const filterTaskId = (item: Item) => {
			if (!filterOptions?.taskId) {
				return true;
			}

			return item.id === filterOptions.taskId;
		};

		this.log("uncompleted", uncompleted);
		this.log("completed", completed);
		let allTask = [...uncompleted, ...completed];
		allTask = allTask.filter(noAbandoned);
		this.log("allTask(after noAbandoned)", allTask);

		allTask = allTask.filter(filterProjectId);
		this.log("allTask(after filterProjectId)", allTask);

		allTask = allTask.filter(filterStatus);
		this.log("allTask(after filterStatus)", allTask);

		allTask = allTask.filter(filterTags);
		this.log("allTask(after filterTags)", allTask);

		allTask = allTask.filter(filterTaskId);
		this.log("allTask(after filterTaskId)", allTask);

		allTask = allTask.sort(
			(a, b) =>
				dayjs(b.createdTime).valueOf() - dayjs(a.createdTime).valueOf(),
		);
		this.log("allTask(after sort)", allTask);

		return allTask;
	}

	public async downloadAttachment(item: Item) {
		const result = item.attachments.map(async (attachment) => {
			const url = `${this.options.apiHost}/api/v1/attachment/${
				item.projectId
			}/${item.id}/${attachment.id}${path.extname(attachment.path)}`;
			return requestUrl({
				url,
				headers: {
					Cookie: this.cookieHeader,
				},
				method: "GET",
			}).then((res) => ({
				...attachment,
				arrayBuffer: res.arrayBuffer,
			}));
		});
		return Promise.allSettled(result);
	}

	private async getAllUnCompleted() {
		const url = `${this.options.apiHost}/api/v2/batch/check/0`;
		const result = await requestUrl({
			url,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: "GET",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		}).then((r) => r.json);

		return result.syncTaskBean.update as Item[];
	}

	private async getAllCompleted(startData: number) {
		const url = `${this.options.apiHost}/api/v2/project/all/completed`;
		const params = {
			from: dayjs(startData).format("YYYY-MM-DD%20HH:mm:ss"),
			to: dayjs().format("YYYY-MM-DD%20HH:mm:ss"),
			limit: 999,
		};
		this.log(
			"getAllCompleted params:",
			params,
			`${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
		);
		const result = await requestUrl({
			url: `${url}?${qs.stringify(params, undefined, undefined, {
				encodeURIComponent(str) {
					return str;
				},
			})}`,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: "GET",
		}).then((r) => r.json as Item[]);
		return result;
	}

	/**
	 * Login to dida365, necessary to make any other request
	 */
	private async checkLogin() {
		if (this.expTime && this.expTime > Date.now()) {
			return;
		}

		const url = `${this.options.apiHost}/api/v2/user/signon?wc=true&remember=true`;

		const options = {
			username: this.options.username,
			password: this.options.password,
		};

		const result = requestUrl({
			url,
			body: JSON.stringify(options),
			headers: {
				"Content-Type": "application/json",
				"x-device":
					'{"platform":"web","os":"macOS 10.15.7","device":"Chrome 114.0.0.0","name":"","version":4562,"id":"64217d45c3630d2326189adc","channel":"website","campaign":"","websocket":""}',
			},
			method: "POST",
		})
			.then((result) => {
				this.cookies =
					(result.headers["set-cookie"] as unknown as string[]) ?? [];
				this.cookieHeader = this.cookies.join("; ") + ";";
				// 1 days
				this.expTime = Date.now() + 1000 * 60 * 60 * 24;
			})
			.catch((e) => {
				console.log(e);
			});

		return result;
	}
}

export class TodoAppClientFacade {
	private readonly didaClient: DiDa365API;
	private readonly ttClient: DiDa365API;
	constructor(private readonly options: DiDa365APIOptions) {
		this.didaClient = new DiDa365API({
			...options,
		});
		this.ttClient = new DiDa365API({
			...options,
			apiHost: "https://api.ticktick.com",
			host: "https://ticktick.com",
		});
	}

	async getItems(filterOptions: DidaConfig): Promise<Item[]> {
		if (filterOptions.type === ServeType.Dida) {
			return this.didaClient.getItems(filterOptions);
		}

		return this.ttClient.getItems(filterOptions);
	}

	async downloadAttachment(item: Item, type: ServeType) {
		if (type === ServeType.Dida) {
			return this.didaClient.downloadAttachment(item);
		}

		return this.ttClient.downloadAttachment(item);
	}
}

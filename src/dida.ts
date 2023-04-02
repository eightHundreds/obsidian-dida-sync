/* eslint-disable @typescript-eslint/naming-convention */
import dayjs from 'dayjs';
import {requestUrl} from 'obsidian';
import qs from 'querystring';
import {DidaFrontMatter} from './types';
import {TaskStatus} from './constants';

type DiDa365APIOptions = {
	username: string;
	password: string;
	host?: string;
	loginHost?: string;
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
	attachments: any[];
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

export class DiDa365API {
	private cookies: string[] = [];
	private cookieHeader: string;
	private expTime: number;
	private readonly options: Required<DiDa365APIOptions>;
	constructor(options: DiDa365APIOptions) {
		this.options = {
			host: 'https://api.dida365.com',
			loginHost: 'https://www.dida365.com',
			...options,
		};
	}

	public async getItems(filterOptions?: DidaFrontMatter) {
		await this.checkLogin();

		const startDateTimestamp = filterOptions?.startDate ? dayjs(filterOptions.startDate).valueOf() : dayjs().subtract(180, 'day').valueOf();
		// 创建时间或截止时间在startDate之前的
		const uncompleted = (await this.getAllUnCompleted()).filter(item => {
			if (item.createdTime && dayjs(item.createdTime).valueOf() > startDateTimestamp) {
				return true;
			}

			if (item.dueDate && dayjs(item.dueDate).valueOf() > startDateTimestamp) {
				return true;
			}

			return false;
		});
		const completed = (await this.getAllCompleted(startDateTimestamp));
		const noAbandoned = (item: Item) => item.status !== TaskStatus.Abandoned;
		const filterProjectId = (item: Item) => {
			if (!filterOptions?.projectId) {
				return true;
			}

			return item.projectId === filterOptions.projectId;
		};

		const filterTags = (item: Item) => {
			if (filterOptions?.tags?.length) {
				if (!item.tags?.length) {
					return false;
				}

				const _tags = Array.isArray(filterOptions.tags) ? filterOptions.tags : [filterOptions.tags];
				return _tags?.some(t => item.tags.includes(t));
			}

			return true;
		};

		const allTask = [...uncompleted, ...completed].filter(noAbandoned).filter(filterProjectId).filter(filterTags).sort((a, b) => dayjs(b.createdTime).valueOf() - dayjs(a.createdTime).valueOf());
		return allTask;
	}

	private async getAllUnCompleted() {
		const url = `${this.options.host}/api/v2/batch/check/0`;
		const result = await requestUrl({
			url,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: 'GET',
		}).then(r => r.json);

		return result.syncTaskBean.update as Item[];
	}

	private async getAllCompleted(startData: number) {
		const url = `${this.options.host}/api/v2/project/all/completed`;

		const result = await requestUrl({
			url: `${url}?${qs.stringify({
				from: dayjs(startData).format('YYYY-MM-DD HH:mm:ss'),
				to: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			})}`,
			headers: {
				Cookie: this.cookieHeader,
			},
			method: 'GET',
		}).then(r => r.json as Item[]);
		return result;
	}

	/**
	 * Login to dida365, necessary to make any other request
	 */
	private async checkLogin() {
		if (this.expTime && this.expTime > Date.now()) {
			return;
		}

		const url = `${this.options.loginHost}/api/v2/user/signon?wc=true&remember=true`;

		const options = {
			username: this.options.username,
			password: this.options.password,
		};

		const result = requestUrl({
			url,
			body: JSON.stringify(options),
			headers: {'Content-Type': 'application/json'},
			method: 'POST',
		}).then(result => {
			this.cookies = (result.headers['set-cookie'] as unknown as string[]) ?? [];
			this.cookieHeader = this.cookies.join('; ') + ';';
			// 1 days
			this.expTime = Date.now() + (1000 * 60 * 60 * 24);
		});

		return result;
	}
}

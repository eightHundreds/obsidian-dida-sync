export enum ServeType {
	Dida = "dida",
	TickTick = "ticktick",
}

export enum TaskStatus {
	UnCompleted = 0,
	Abandoned = -1,
	Completed = 2,
}
export type DiDaSyncPluginSettings = {
	didaPassword: string;
	didaUserName: string;
	disablePageHeaderAction: boolean;
	debug: boolean;
};

export type DidaConfig = {
	/**
	 * 标签
	 */
	tags?: string[] | string;
	/**
	 * 排除的标签
	 */
	excludeTags?: string[] | string;
	/**
	 * 任务
	 */
	taskId?: string;
	/**
	 * 项目Id
	 */
	projectId?: string;
	/**
	 * 要同步数据的截止时间
	 */
	startDate?: string;
	/**
	 * 任务状态
	 */
	status?: TaskStatus;
	/**
	 * 服务
	 */
	type: ServeType;
};

export type DidaFrontMatter = Omit<DidaConfig, "status"> & {
	status: "completed" | "uncompleted";
};

export type ValueOf<T> = T[keyof T];

declare module "obsidian" {
	interface App {
		commands: {
			commands: Record<string, Command>;
			executeCommandById: (id: string) => void;
		};
		plugins: {
			manifests: Record<string, PluginManifest>;
		};
		statusBar: {
			containerEl: HTMLElement;
		};
		appId: string;
		isMobile: boolean;
		setting: {
			closeActiveTab: () => void;
			openTabById: (id: string) => void;
			activeTab: {
				containerEl: HTMLElement;
			};
		};
	}

	interface Vault {
		getConfig: (key: string) => any;
	}

	interface ItemView {
		actionsEl: HTMLDivElement;
	}
}

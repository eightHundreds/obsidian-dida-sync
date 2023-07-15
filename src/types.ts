export enum ServeType {
  Dida = 'dida',
  TickTick = 'ticktick',
}
export type DidaFrontMatter = {
  /**
	 * 标签
	 */
  tags?: string[] | string;
  /**
	 * 项目Id
	 */
  projectId?: string;
  /**
	 * 要同步数据的截止时间
	 */
  startDate?: string;
  /**
	 * 服务
	 */
  type: ServeType;
};

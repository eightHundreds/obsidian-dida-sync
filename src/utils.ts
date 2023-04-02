import dayjs from 'dayjs';
import {TaskStatus} from './constants';
import {Item} from './dida';

export function taskToMarkdown(items: Item[]) {
	const format = (v: string) => {
		if (!v) {
			return '';
		}

		return dayjs(v).format('YYYY-MM-DD HH:mm:ss');
	};

	return items.map(item => `# ${item.title}
^dida-${item.id}

> - createdTime: ${format(item.createdTime)}${item.dueDate ? `
> - dueDate: ${format(item.dueDate)}` : ''}
> - status: ${TaskStatus[item.status].toString()}

${item.content}
`).join('\n');
}

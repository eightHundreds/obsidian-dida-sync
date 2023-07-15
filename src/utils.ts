import dayjs from 'dayjs';
import {TaskStatus} from './constants';
import {remark} from 'remark';
import {Item} from './dida';

export function addHeadingLevel(markdown: string) {
  const res = remark()
    .use(() => tree => {
      tree.children.forEach(node => {
        if (node.type === 'heading') {
          node.depth += 1;
        }
      });
    })
    .processSync(markdown)
    .toString();
  return res;
}

export function taskToMarkdown(items: Item[]) {
  const format = (v: string) => {
    if (!v) {
      return '';
    }

    return dayjs(v).format('YYYY-MM-DD HH:mm:ss');
  };

  return items.map(item => `# ${item.title}
^dida-${item.id}

> [!meta]-
> - createdTime: ${format(item.createdTime)}${item.dueDate ? `
> - dueDate: ${format(item.dueDate)}` : ''}
> - status: ${TaskStatus[item.status].toString()}

${addHeadingLevel(item.content)}
${item.items.map(i => `- [${i.status === TaskStatus.Completed ? 'X' : ' '}] ${i.title}`).join('\n')}

`).join('\n');
}

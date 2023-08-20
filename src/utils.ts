import dayjs from 'dayjs';
import {TaskStatus} from './types';
import {remark} from 'remark';
import {Item} from './core/dida';

export function addHeadingLevel(markdown: string) {
  const res = remark()
    .use(() => tree => {
      tree.children.forEach(node => {
        if (node.type === 'heading') {
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          node.depth += 1;
        }
      });
    })
    .processSync(markdown)
    .toString();
  return res;
}

const format = (v: string) => {
  if (!v) {
    return '';
  }

  return dayjs(v).format('YYYY-MM-DD HH:mm:ss');
};

export function tasksToMarkdown(items: Item[]) {
  return items.map(taskToMarkdown).join('\n');
}

function taskToMarkdown(item: Item) {
  return `# ${item.title}
^dida-${item.id}

> [!meta]-
> - createdTime: ${format(item.createdTime)}${
  item.dueDate
    ? `
> - dueDate: ${format(item.dueDate)}`
    : ''
}
> - status: ${TaskStatus[item.status].toString()}

${addHeadingLevel(item.content)}
${item.items
    .map(
      i => `- [${i.status === TaskStatus.Completed ? 'X' : ' '}] ${i.title}`,
    )
    .join('\n')}
`;
}

export const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> =>
  input.status === 'fulfilled';

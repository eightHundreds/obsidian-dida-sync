import dayjs from 'dayjs';
import {remark} from 'remark';
import type DiDaSyncPlugin from '../main';
import {Item} from './dida';
import {TaskStatus} from '../constants';
import {TFile} from 'obsidian';

class MarkdownGenerator {
  constructor(private readonly plugin: DiDaSyncPlugin) {
  }

  public taskToMarkdown(item: Item, attachments: TFile[]) {
    const format = (v: string) => {
      if (!v) {
        return '';
      }

      return dayjs(v).format('YYYY-MM-DD HH:mm:ss');
    };

    const remarker = remark().use(() => tree => {
      // Heading 添加一级
      tree.children.forEach(node => {
        if (node.type === 'heading') {
          node.depth += 1;
        }
      });
    }).use(() => tree => {
      tree.children.forEach(node => {
        if (node.type !== 'paragraph') {
          return;
        }

        node.children.forEach(child => {
          if (child.type === 'image') {
            const idInUrl = child.url.split('/')[0];
            const attachment = attachments.find(a => a.basename === idInUrl);
            if (!attachment) {
              return;
            }

            child.url = attachment.path;

            if (child.alt === 'file') {
              // @ts-expect-error
              child.type = 'link';
              // @ts-expect-error
              child.children = [{
                type: 'text',
                value: attachment.name,
              }];
            }
          }
        });
      });
      return tree;
    });

    return `# ${item.title}
^dida-${item.id}
    
> [!meta]-
> - createdTime: ${format(item.createdTime)}${
  item.dueDate
    ? `> - dueDate: ${format(item.dueDate)}`
    : ''
}
> - status: ${TaskStatus[item.status].toString()}
    
${remarker.processSync(item.content).toString()}
${item.items
    .map(
      i => `- [${i.status === TaskStatus.Completed ? 'X' : ' '}] ${i.title}`,
    )
    .join('\n')}
`;
  }
}
export default MarkdownGenerator;
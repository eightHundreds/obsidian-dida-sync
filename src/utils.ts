import dayjs from 'dayjs';
import {TaskStatus} from './constants';
import {remark} from 'remark';
import {Item} from './core/dida';

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

/*
Export async function saveImageToVaultAndPaste(editor: Editor, app: App, renderer: Renderer, source: TFile, settings: ChartPluginSettings) {
    const image = await renderer.imageRenderer(editor.getSelection(), settings.imageSettings);
    console.log("image converted")
    const file = await app.vault.createBinary(
        //@ts-ignore
        await app.vault.getAvailablePathForAttachments(`Chart ${new Date().toDateString()}`, settings.imageSettings.format.split('/').last(), source),
        base64ToArrayBuffer(image)
    );
    console.log("Image saved")

    editor.replaceSelection(app.fileManager.generateMarkdownLink(file, source.path));
}
*/

import {
  App,
  ItemView,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TextComponent,
} from 'obsidian';
import {TodoAppClientFacade} from './dida';
// @ts-expect-error
import * as yamlFront from 'yaml-front-matter';
import debug from 'debug';
import {DiDaSyncPluginSettings, DidaFrontMatter, ServeType} from './types';
import {taskToMarkdown} from './utils';
import {t} from 'i18next';
import DidaSettingTab from './settings';
import './locale';
import {settingAtom, settingAtomFamily, store} from './store';
import {PLUGIN_ID} from './constants';

const defaultSettings: DiDaSyncPluginSettings = {
  didaPassword: '',
  didaUserName: '',
  debug: false,
};

export default class DiDaSyncPlugin extends Plugin {
  didaClient: TodoAppClientFacade;
  log: (...args: any[]) => any;
  async onload() {
    await this.loadSettings();
    this.didaClient = new TodoAppClientFacade({
      username: this.settings.didaUserName,
      password: this.settings.didaPassword,
    });
    this.log = debug('dida365:plugin');

    if (this.settings.debug) {
      debug.enable('dida365:*');
    }

    this.registerCommends();
    this.registerPageHeaderAction();
    this.registerSettingChange();
    this.addSettingTab(new DidaSettingTab(this.app, this));
  }

  public get settings() {
    return store.get(settingAtom);
  }

  public updateSetting<T extends keyof DiDaSyncPluginSettings>(
    key: T,
    val: DiDaSyncPluginSettings[T],
  ) {
    store.set(settingAtomFamily(key), val);
    void this.saveSettings();
  }

  public async saveSettings() {
    await this.saveData(this.settings);
  }

  private registerCommends() {
    this.addCommand({
      id: 'sync-current-file',
      name: t('syncToDoList'),
      editorCheckCallback: (checking, editor, ctx) => {
        const frontmatter = yamlFront.loadFront(
          editor.getValue(),
        ) as any;
        let didaConfig = (frontmatter?.dida
					|| frontmatter?.ticktick) as DidaFrontMatter;
        if (checking) {
          if (!didaConfig) {
            return false;
          }

          return true;
        }

        if (!checking && !didaConfig) {
          new Notice(t('configNotFound'));
          return;
        }

        if (typeof didaConfig === 'boolean') {
          didaConfig = {};
        }

        if (frontmatter?.dida) {
          didaConfig.type = ServeType.Dida;
        }

        if (frontmatter?.ticktick) {
          didaConfig.type = ServeType.TickTick;
        }

        const tags = Array.isArray(didaConfig.tags)
          ? didaConfig.tags
          : [didaConfig.tags].filter((v: any): v is string =>
            Boolean(v),
					  );
        const {startDate} = didaConfig;
        new Notice(t('beginSync'));
        void this.didaClient
          .getItems({
            startDate,
            tags,
            projectId: didaConfig.projectId,
            type: didaConfig.type,
            taskId: didaConfig.taskId,
          })
          .then(tasks => {
            const mdText = taskToMarkdown(tasks);
            const currentText = editor.getValue();
            // 获得frontmatter的位置
            const startOfFrontmatter = currentText.indexOf('---');
            const endOfFrontmatter = currentText.indexOf(
              '---',
              startOfFrontmatter + 3,
            );
            const lineOfFrontmatter = currentText
              .substring(startOfFrontmatter, endOfFrontmatter)
              .split('\n').length;

            editor.replaceRange(
              mdText,
              {line: lineOfFrontmatter, ch: 0},
              {
                line: editor.lastLine() + 1,
                ch: 0,
              },
            );
            new Notice(t('syncSuccess'));
          });

        return true;
      },
    });
  }

  private registerPageHeaderAction() {
    this.app.workspace.on('layout-change', () => {
      this.app.workspace.iterateAllLeaves(leaf => {
        const {view} = leaf;
        if (!(view instanceof MarkdownView)) {
          return;
        }

        const syncBtn = view.actionsEl.querySelector(
          `a[aria-label="${t('beginSync')}"]`,
        );

        if (this.settings.disablePageHeaderAction) {
          if (syncBtn) {
            syncBtn.remove();
          }

          return;
        }

        const frontmatter = yamlFront.loadFront(
          view.editor.getValue(),
        ) as any;
        const hasDidaFlag = frontmatter?.dida || frontmatter?.ticktick;

        if (hasDidaFlag && !syncBtn) {
          view.addAction('check-circle', t('beginSync'), async () => {
            this.app.commands.executeCommandById(
              `${PLUGIN_ID}:sync-current-file`,
            );
          });
        } else if (!hasDidaFlag && syncBtn) {
          syncBtn.remove();
        }
      });
    });

    // 销毁时把action的按钮移除
    this.register(() => {
      this.app.workspace.iterateAllLeaves(leaf => {
        const {view} = leaf;
        if (!(view instanceof MarkdownView)) {
          return;
        }

        const syncBtn = view.actionsEl.querySelector(
          `a[aria-label="${t('beginSync')}"]`,
        );
        syncBtn?.remove();
      });
    });
  }

  private registerSettingChange() {
    this.register(
      store.sub(settingAtomFamily('didaUserName'), () => {
        this.didaClient = new TodoAppClientFacade({
          username: this.settings.didaUserName,
          password: this.settings.didaPassword,
        });
      }),
    );

    this.register(
      store.sub(settingAtomFamily('didaPassword'), () => {
        this.didaClient = new TodoAppClientFacade({
          username: this.settings.didaUserName,
          password: this.settings.didaPassword,
        });
      }),
    );

    this.register(
      store.sub(settingAtomFamily('debug'), () => {
        if (this.settings.debug) {
          debug.enable('dida365:*');
        } else {
          debug.disable();
        }
      }),
    );
  }

  private async loadSettings() {
    store.set(settingAtom, {
      ...defaultSettings,
      ...(await this.loadData()),
    });
  }
}

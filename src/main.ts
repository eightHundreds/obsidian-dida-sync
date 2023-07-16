import {
  App,
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
import {DidaFrontMatter, ServeType} from './types';
import {taskToMarkdown} from './utils';
import {t} from 'i18next';
import './locale';

type DiDaSyncPluginSettings = {
  didaPassword: string;
  didaUserName: string;
  debug: boolean;
};

const defaultSettings: DiDaSyncPluginSettings = {
  didaPassword: '',
  didaUserName: '',
  debug: false,
};

export default class DiDaSyncPlugin extends Plugin {
  settings: DiDaSyncPluginSettings;
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
    this.addSettingTab(new DidaSettingTab(this.app, this));
    this.log('init done 666');
  }

  registerCommends() {
    this.addCommand({
      id: 'sync-current-file',
      name: t('syncToDoList'),
      editorCheckCallback: (checking, editor, ctx) => {
        const frontmatter = yamlFront.loadFront(editor.getValue()) as any;
        let didaConfig = (frontmatter?.dida || frontmatter?.ticktick) as DidaFrontMatter;
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
            Boolean(v));
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

  async loadSettings() {
    this.settings = {
      ...defaultSettings,
      ...(await this.loadData()),
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.didaClient = new TodoAppClientFacade({
      username: this.settings.didaUserName,
      password: this.settings.didaPassword,
    });
  }
}

class DidaSettingTab extends PluginSettingTab {
  plugin: DiDaSyncPlugin;

  constructor(app: App, plugin: DiDaSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl).setName(t('userName')).addText(text => {
      text
        .setPlaceholder(t('inputUserName'))
        .setValue(this.plugin.settings.didaUserName)
        .onChange(async value => {
          this.plugin.settings.didaUserName = value;
          await this.plugin.saveSettings();
        }).inputEl.setCssStyles({
          width: '300px',
        });
    },
    );

    let inputEl: TextComponent;
    const el = new Setting(containerEl).setName(t('password')).addText(text => {
      const psw = text
        .setPlaceholder(t('inputPassword'))
        .setValue(this.plugin.settings.didaPassword)
        .onChange(async value => {
          this.plugin.settings.didaPassword = value;
          await this.plugin.saveSettings();
        }).then(i => {
          inputEl = i;
        });
      psw.inputEl.setAttribute('type', 'password');
      psw.inputEl.setCssStyles({
        width: '250px',
      });
    });
    el.addToggle(v =>
      v.onChange(value => {
        if (value) {
          inputEl.inputEl.setAttribute('type', 'text');
        } else {
          inputEl.inputEl.setAttribute('type', 'password');
        }
      }),
    );

    new Setting(containerEl).setName(t('debugMode')).addToggle(toggle =>
      toggle
        .setValue(this.plugin.settings.debug)
        .onChange(async value => {
          this.plugin.settings.debug = value;
          await this.plugin.saveSettings();
        }),
    );
  }
}

import debug from 'debug';
import {t} from 'i18next';
import {App, PluginSettingTab, Setting, TextComponent} from 'obsidian';
import type DiDaSyncPlugin from './main';

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
          this.plugin.updateSetting('didaUserName', value);
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
          this.plugin.updateSetting('didaPassword', value);
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
          this.plugin.updateSetting('debug', value);

          if (value) {
            debug.enable('dida365:*');
          } else {
            debug.disable();
          }
        }),
    );
  }
}

export default DidaSettingTab;

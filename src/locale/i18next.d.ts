import 'i18next';
import en from './en.json';
import zhCN from './zh-CN.json';

declare module 'i18next' {
  // Extend CustomTypeOptions
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CustomTypeOptions {
    // Custom namespace type, if you changed it
    // Custom resources type
    resources: {
      en: typeof en;
      zhCN: typeof zhCN;
    };
    // Other
  }
}

import i18next from "i18next";
import zh from "./zh-CN.json";
import en from "./en.json";
import { moment } from "obsidian";

void i18next.init({
	lng: moment.locale(),
	resources: {
		"zh-CN": zh,
		en,
	},
});

const { t } = i18next;

export { t };

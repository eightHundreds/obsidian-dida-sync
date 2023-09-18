import { Atom, WritableAtom, atom, createStore } from "jotai/vanilla";
import { atomFamily } from "jotai/vanilla/utils";
import { DiDaSyncPluginSettings, ValueOf } from "./types";

const store = createStore();
const settingAtom = atom<DiDaSyncPluginSettings>({
	didaPassword: "",
	didaUserName: "",
	disablePageHeaderAction: false,
	debug: false,
});

const settingAtomFamilyInternal = atomFamily<
	keyof DiDaSyncPluginSettings,
	WritableAtom<
		ValueOf<DiDaSyncPluginSettings>,
		[ValueOf<DiDaSyncPluginSettings>],
		void
	>
>(
	(key) =>
		atom(
			(get) => get(settingAtom)[key],
			(get, set, arg) => {
				set(settingAtom, {
					...get(settingAtom),
					[key]: arg,
				});
			},
		),
	(a, b) => a === b,
);

const settingAtomFamily = <T extends keyof DiDaSyncPluginSettings>(key: T) =>
	settingAtomFamilyInternal(key);

export { settingAtom, settingAtomFamily, store };

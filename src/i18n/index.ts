import resources from "virtual:i18next-loader";
import i18n from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";

// The repository is the translation source of truth; en-US defines the keys.
// Crowdin is synced manually.
type TranslationResource = typeof import("./locales/en-US/translation.json");

declare module "i18next" {
	interface CustomTypeOptions {
		resources: {
			translation: TranslationResource;
		};
		defaultNS: "translation";
		returnNull: false;
		allowedKeys: keyof TranslationResource;
	}
}

i18n
	.use(initReactI18next)
	.use(ICU)
	.init({
		resources,
		debug: import.meta.env.DEV,
		fallbackLng: "en-US",
		interpolation: {
			escapeValue: false,
		},
		returnNull: false,
	})
	.then(() =>
		i18n.changeLanguage(localStorage.getItem("language") || navigator.language),
	);

export default i18n;

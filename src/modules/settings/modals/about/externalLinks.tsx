import { open } from "@tauri-apps/plugin-shell";
export const CONTRIBUTORS_URL =
	"https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/graphs/contributors";
export const openExternal = async (url: string) => {
	if (import.meta.env.TAURI_ENV_PLATFORM) {
		await open(url);
	} else {
		window.open(url, "_blank");
	}
};

import { DEFAULT_GLASS_BLUR } from "$/modules/settings/logic/glass-blur";
import type { AppearanceSettings } from "./useAppearanceSettings";

export const DEFAULT_LAYOUT_ORDER = [
	"titlebar",
	"ribbonbar",
	"editor",
	"audio-controls",
];

export type AdvancedOverrideSetters = Pick<
	AppearanceSettings,
	| "setLegacyDarkTheme"
	| "setLegacySpaceLabels"
	| "setAdvWaveformColor"
	| "setAdvWaveformProgress"
	| "setAdvPrimaryText"
	| "setAdvSecondaryText"
	| "setVTitlebarBg"
	| "setVSidebarBg"
	| "setVSidebarActive"
	| "setVMenuHover"
	| "setVEditorBg"
	| "setVActiveLine"
	| "setVLineHover"
	| "setVChipRadius"
	| "setVChipGap"
	| "setVChipPaddingV"
	| "setVChipPaddingH"
	| "setVRomanColor"
	| "setVTransColor"
	| "setVGeniusHeaderColor"
	| "setVAudioBarBg"
	| "setVAudioBarText"
	| "setVScrollbar"
	| "setVDialogBg"
	| "setVDialogBorder"
	| "setVGlobalRadius"
	| "setVGlobalBorderWidth"
	| "setVShadow"
	| "setVSelection"
	| "setLayoutOrder"
	| "setGlassBlur"
>;

/**
 * Resets every advanced override to its default. Shared by the theme reset and
 * the advanced master reset so a new override cannot be missed by one of them.
 */
export function resetAdvancedOverrides(s: AdvancedOverrideSetters) {
	s.setAdvWaveformColor("");
	s.setAdvWaveformProgress("");
	s.setAdvPrimaryText("");
	s.setAdvSecondaryText("");
	s.setVTitlebarBg("");
	s.setVSidebarBg("");
	s.setVSidebarActive("");
	s.setVMenuHover("");
	s.setVEditorBg("");
	s.setVActiveLine("");
	s.setVLineHover("");
	s.setVSelection("");
	s.setVChipRadius(8);
	s.setVChipGap(8);
	s.setVChipPaddingV(4);
	s.setVChipPaddingH(12);
	s.setVRomanColor("");
	s.setVTransColor("");
	s.setVGeniusHeaderColor("");
	s.setVAudioBarBg("");
	s.setVAudioBarText("");
	s.setVScrollbar("");
	s.setVDialogBg("");
	s.setVDialogBorder("");
	s.setVGlobalRadius(12);
	s.setVGlobalBorderWidth(1);
	s.setVShadow(1);
	s.setGlassBlur(DEFAULT_GLASS_BLUR);
	s.setLegacyDarkTheme(false);
	s.setLegacySpaceLabels(false);
	s.setLayoutOrder(DEFAULT_LAYOUT_ORDER);
}

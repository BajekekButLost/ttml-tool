import type { createPresetActions } from "./presetActions";
import type { AppearanceSettings } from "./useAppearanceSettings";
export type AppearanceSectionState = AppearanceSettings &
	ReturnType<typeof createPresetActions>;

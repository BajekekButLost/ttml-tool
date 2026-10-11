import resources from "virtual:i18next-loader";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { playbackRateAtom, volumeAtom } from "$/modules/audio/states";
import {
	allowConsecutiveBackgroundLinesAtom,
	autosaveEnabledAtom,
	autosaveIntervalAtom,
	autosaveLimitAtom,
	compactBGInSyncAtom,
	folderProjectsAutosaveAtom,
	folderProjectsEnabledAtom,
	layoutModeAtom,
	normalizeApostrophesOnImportAtom,
	normalizeCyrillicEsOnImportAtom,
	smartFirstWordAtom,
	smartLastWordAtom,
	syncJudgeModeAtom,
} from "$/modules/settings/states";
import {
	editAutoScrollAtom,
	editTabPositionAtom,
	enableUpcomingWordHighlightAtom,
	syncAutoScrollAtom,
	syncFocusMainLineAtom,
	syncTabPositionAtom,
	syncWordWrapAtom,
	upcomingWordHighlightColorAtom,
	upcomingWordHighlightThresholdAtom,
} from "$/modules/settings/states/sync";
import { ToolMode, toolModeAtom } from "$/states/main";
import { keyBindingTriggerModeAtom } from "$/utils/keybindings";
export function useCommonSettings() {
	const languageOptions: readonly string[] = Object.keys(resources);
	const [layoutMode, setLayoutMode] = useAtom(layoutModeAtom);
	const [syncJudgeMode, setSyncJudgeMode] = useAtom(syncJudgeModeAtom);
	const [keyBindingTriggerMode, setKeyBindingTriggerMode] = useAtom(
		keyBindingTriggerModeAtom,
	);
	const [smartFirstWord, setSmartFirstWord] = useAtom(smartFirstWordAtom);
	const [smartLastWord, setSmartLastWord] = useAtom(smartLastWordAtom);
	const [volume, setVolume] = useAtom(volumeAtom);
	const [playbackRate, setPlaybackRate] = useAtom(playbackRateAtom);
	const [autosaveEnabled, setAutosaveEnabled] = useAtom(autosaveEnabledAtom);
	const [autosaveInterval, setAutosaveInterval] = useAtom(autosaveIntervalAtom);
	const [autosaveLimit, setAutosaveLimit] = useAtom(autosaveLimitAtom);
	const [folderProjectsAutosave, setFolderProjectsAutosave] = useAtom(
		folderProjectsAutosaveAtom,
	);
	const [folderProjectsEnabled, setFolderProjectsEnabled] = useAtom(
		folderProjectsEnabledAtom,
	);
	const [enableUpcomingWordHighlight, setEnableUpcomingWordHighlight] = useAtom(
		enableUpcomingWordHighlightAtom,
	);
	const [upcomingWordHighlightThreshold, setUpcomingWordHighlightThreshold] =
		useAtom(upcomingWordHighlightThresholdAtom);
	const [upcomingWordHighlightColor, setUpcomingWordHighlightColor] = useAtom(
		upcomingWordHighlightColorAtom,
	);
	const [compactBGInSync, setCompactBGInSync] = useAtom(compactBGInSyncAtom);
	const [normalizeApostrophesOnImport, setNormalizeApostrophesOnImport] =
		useAtom(normalizeApostrophesOnImportAtom);
	const [normalizeCyrillicEsOnImport, setNormalizeCyrillicEsOnImport] = useAtom(
		normalizeCyrillicEsOnImportAtom,
	);
	const [allowConsecutiveBackgroundLines, setAllowConsecutiveBackgroundLines] =
		useAtom(allowConsecutiveBackgroundLinesAtom);
	const [syncWordWrap, setSyncWordWrap] = useAtom(syncWordWrapAtom);
	const [syncFocusMainLine, setSyncFocusMainLine] = useAtom(
		syncFocusMainLineAtom,
	);
	const toolMode = useAtomValue(toolModeAtom);
	const [playbackSettingsMode, setPlaybackSettingsMode] = useState(
		toolMode === ToolMode.Edit ? ToolMode.Edit : ToolMode.Sync,
	);
	const syncAutoScroll = useAtomValue(
		playbackSettingsMode === ToolMode.Edit
			? editAutoScrollAtom
			: syncAutoScrollAtom,
	);
	const [syncTabPosition, setSyncTabPosition] = useAtom(
		playbackSettingsMode === ToolMode.Edit
			? editTabPositionAtom
			: syncTabPositionAtom,
	);
	const { t, i18n } = useTranslation();
	const currentLanguage = i18n.resolvedLanguage || i18n.language;
	return {
		languageOptions,
		layoutMode,
		setLayoutMode,
		syncJudgeMode,
		setSyncJudgeMode,
		keyBindingTriggerMode,
		setKeyBindingTriggerMode,
		smartFirstWord,
		setSmartFirstWord,
		smartLastWord,
		setSmartLastWord,
		volume,
		setVolume,
		playbackRate,
		setPlaybackRate,
		autosaveEnabled,
		setAutosaveEnabled,
		autosaveInterval,
		setAutosaveInterval,
		autosaveLimit,
		setAutosaveLimit,
		folderProjectsAutosave,
		setFolderProjectsAutosave,
		folderProjectsEnabled,
		setFolderProjectsEnabled,
		enableUpcomingWordHighlight,
		setEnableUpcomingWordHighlight,
		upcomingWordHighlightThreshold,
		setUpcomingWordHighlightThreshold,
		upcomingWordHighlightColor,
		setUpcomingWordHighlightColor,
		compactBGInSync,
		setCompactBGInSync,
		normalizeApostrophesOnImport,
		setNormalizeApostrophesOnImport,
		normalizeCyrillicEsOnImport,
		setNormalizeCyrillicEsOnImport,
		allowConsecutiveBackgroundLines,
		setAllowConsecutiveBackgroundLines,
		syncWordWrap,
		setSyncWordWrap,
		syncFocusMainLine,
		setSyncFocusMainLine,
		toolMode,
		playbackSettingsMode,
		setPlaybackSettingsMode,
		syncAutoScroll,
		syncTabPosition,
		setSyncTabPosition,
		t,
		i18n,
		currentLanguage,
	};
}
export type CommonSettings = ReturnType<typeof useCommonSettings>;

import {
	ArrowAutofitWidth24Regular,
	ArrowSortDownLines24Regular,
	Blur24Regular,
	Clock24Regular,
	DataLine24Regular,
	ErrorCircle24Regular,
	Eye24Regular,
	EyeOff24Regular,
	Flash24Regular,
	Highlight24Regular,
	Image24Regular,
	NumberSymbol24Regular,
	Options24Regular,
	PanelRight24Regular,
	Rename24Regular,
	Sparkle24Regular,
	TapSingle24Regular,
	TextCaseTitle24Regular,
	TextDescription24Regular,
	TextEditStyle24Regular,
	TextLineSpacing24Regular,
	Timeline24Regular,
	TopSpeed24Regular,
	Translate24Regular,
} from "@fluentui/react-icons";
import { Box, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useAtom, type WritableAtom } from "jotai";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { advancedRibbonControlsAtom } from "$/modules/onboarding/states";
import { showPreviewPanelAtom } from "$/states/main";
import {
	PreviewModeControl,
	SettingToggle,
	SpicyBackgroundControl,
	SyncLevelControl,
} from "../components/WorkflowControls";
import {
	displayRomanizationInSyncAtom,
	enableManualTimestampEditAtom,
	enableSyncGlowAnimationAtom,
	highlightActiveWordAtom,
	highlightErrorsAtom,
	showLineRomanizationAtom,
	showLineTranslationAtom,
	showTimestampsAtom,
	showWordRomanizationInputAtom,
} from "../states";
import { backgroundSyncSettingAtom } from "../states/background-sync";
import {
	instantHighlightFadeAtom,
	lyricWordFadeWidthAtom,
	showFpsCounterAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
	spicyForceLineSyncedAtom,
	spicySimpleLyricsModeAtom,
	vsyncAtom,
} from "../states/preview";
import {
	enableTimeModeDoubleClickEditAtom,
	showTouchSyncPanelAtom,
	timingOverviewAutoScrollAtom,
	visualizeTimestampUpdateAtom,
} from "../states/sync";

type BooleanSetting = WritableAtom<boolean, [boolean], unknown>;

/** Title key, fallback, description key, fallback, icon, then the setting. */
type ToggleRow = readonly [
	string,
	string,
	string,
	string,
	ReactNode,
	BooleanSetting,
];

const editModeToggles: readonly ToggleRow[] = [
	[
		"settings.common.advancedRibbonControls",
		"Show advanced ribbon controls",
		"settings.workflow.advancedRibbonControlsDesc",
		"Show more controls in the ribbon toolbar.",
		<Options24Regular key="icon" />,
		advancedRibbonControlsAtom,
	],
	[
		"ribbonBar.editMode.showTranslation",
		"Show Translation Line",
		"settings.workflow.showTranslationDesc",
		"Show a translation field under each lyric line.",
		<Translate24Regular key="icon" />,
		showLineTranslationAtom,
	],
	[
		"ribbonBar.editMode.showRomanization",
		"Show Romanization Line",
		"settings.workflow.showRomanizationDesc",
		"Show a romanization field under each lyric line.",
		<TextCaseTitle24Regular key="icon" />,
		showLineRomanizationAtom,
	],
	[
		"ribbonBar.editMode.showWordRomanizationInput",
		"Show Per-Word Romanization",
		"settings.workflow.showWordRomanizationInputDesc",
		"Show a romanization field on each word.",
		<TextEditStyle24Regular key="icon" />,
		showWordRomanizationInputAtom,
	],
];

const timeModeDisplayToggles: readonly ToggleRow[] = [
	[
		"ribbonBar.syncMode.showTimestamps",
		"Show Timestamps",
		"settings.workflow.showTimestampsDesc",
		"Show start and end times on each word.",
		<Clock24Regular key="icon" />,
		showTimestampsAtom,
	],
	[
		"ribbonBar.syncMode.highlightActiveWord",
		"Highlight Active Word",
		"settings.workflow.highlightActiveWordDesc",
		"Highlight the word that is playing right now.",
		<Highlight24Regular key="icon" />,
		highlightActiveWordAtom,
	],
	[
		"ribbonBar.syncMode.enableGlowAnimation",
		"Enable Glow Animation",
		"settings.workflow.enableGlowAnimationDesc",
		"Fill each word with a glow as it plays.",
		<Sparkle24Regular key="icon" />,
		enableSyncGlowAnimationAtom,
	],
	[
		"settings.assistant.highlightErrors",
		"Highlight Timing Errors",
		"settings.assistant.highlightErrorsDesc",
		"Visually mark words where start time is greater than end time.",
		<ErrorCircle24Regular key="icon" />,
		highlightErrorsAtom,
	],
	[
		"settings.assistant.visualizeTimestampUpdate",
		"Visualize Timestamp Updates",
		"settings.assistant.visualizeTimestampUpdateDesc",
		"Show a brief flash on timestamps when they are updated via shortcuts.",
		<Flash24Regular key="icon" />,
		visualizeTimestampUpdateAtom,
	],
	[
		"ribbonBar.syncMode.showPerWordRomanization",
		"Show Per-Word Romanization",
		"settings.workflow.showPerWordRomanizationDesc",
		"Show each word's romanization under it.",
		<TextCaseTitle24Regular key="icon" />,
		displayRomanizationInSyncAtom,
	],
	[
		"ribbonBar.editMode.previewPanel",
		"Preview Panel",
		"settings.workflow.previewPanelDesc",
		"Show a live lyric preview next to the word list.",
		<PanelRight24Regular key="icon" />,
		showPreviewPanelAtom,
	],
];

const syncAidToggles: readonly ToggleRow[] = [
	[
		"ribbonBar.syncMode.bgLyricIgnoreSync",
		"Ignore Background Vocals",
		"settings.workflow.bgLyricIgnoreSyncDesc",
		"Skip background lines while syncing with the keyboard. Applies to the background lines you already have, too.",
		<EyeOff24Regular key="icon" />,
		backgroundSyncSettingAtom,
	],
	[
		"settings.assistant.manualTimestampEdit",
		"Manual Timestamp Editing",
		"settings.assistant.manualTimestampEditDesc",
		"Allow clicking on timestamps in Sync mode to manually type values.",
		<NumberSymbol24Regular key="icon" />,
		enableManualTimestampEditAtom,
	],
	[
		"ribbonBar.syncMode.doubleClickEdit",
		"Double-Click Word Editing",
		"settings.workflow.doubleClickEditDesc",
		"Double-click a word to fix its text while syncing.",
		<Rename24Regular key="icon" />,
		enableTimeModeDoubleClickEditAtom,
	],
	[
		"ribbonBar.syncMode.touchSyncPanel",
		"Touch Sync Panel",
		"settings.workflow.touchSyncPanelDesc",
		"Show on-screen sync buttons for touch screens.",
		<TapSingle24Regular key="icon" />,
		showTouchSyncPanelAtom,
	],
];

const previewToggles: readonly ToggleRow[] = [
	[
		"ribbonBar.previewMode.showTranslation",
		"Show Translation",
		"settings.workflow.previewShowTranslationDesc",
		"Show translation lines in the preview.",
		<Translate24Regular key="icon" />,
		showTranslationLinesAtom,
	],
	[
		"ribbonBar.previewMode.showRoman",
		"Show Romanization",
		"settings.workflow.previewShowRomanDesc",
		"Show romanization in the preview.",
		<TextCaseTitle24Regular key="icon" />,
		showRomanLinesAtom,
	],
	[
		"ribbonBar.previewMode.simpleLyrics",
		"Simple lyrics",
		"settings.workflow.simpleLyricsDesc",
		"Match Spicy Lyrics' Simple Lyrics mode, with calmer word animations.",
		<TextDescription24Regular key="icon" />,
		spicySimpleLyricsModeAtom,
	],
	[
		"ribbonBar.previewMode.forceLineRendering",
		"Force line rendering",
		"settings.workflow.forceLineRenderingDesc",
		"Show every line in the Spicy preview as line-synced, without word timing.",
		<TextLineSpacing24Regular key="icon" />,
		spicyForceLineSyncedAtom,
	],
	[
		"ribbonBar.previewMode.instantFade",
		"Instant Fade Out",
		"settings.workflow.instantFadeDesc",
		"Drop a word's highlight as soon as it ends instead of fading it out slowly.",
		<Blur24Regular key="icon" />,
		instantHighlightFadeAtom,
	],
	[
		"ribbonBar.previewMode.autoScroll",
		"Auto-Scroll",
		"settings.workflow.timingOverviewAutoScrollDesc",
		"Keep the timing overview scrolled to the playhead.",
		<ArrowSortDownLines24Regular key="icon" />,
		timingOverviewAutoScrollAtom,
	],
];

const performanceToggles: readonly ToggleRow[] = [
	[
		"settings.preview.vsync",
		"V-Sync",
		"settings.workflow.vsyncDesc",
		"Update the Standard and Toxi previews every frame instead of about 30 times per second. Smoother, but uses more CPU.",
		<TopSpeed24Regular key="icon" />,
		vsyncAtom,
	],
	[
		"ribbonBar.previewMode.showFps",
		"Show FPS",
		"settings.workflow.showFpsDesc",
		"Show a frame rate counter on the preview.",
		<DataLine24Regular key="icon" />,
		showFpsCounterAtom,
	],
];

const SettingRow = ({
	icon,
	title,
	description,
	children,
	asLabel,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	children: ReactNode;
	asLabel?: boolean;
}) => {
	const row = (
		<Flex gap="3" align="center">
			{icon}
			<Box flexGrow="1">
				<Flex align="center" justify="between" gap="4">
					<Flex direction="column" gap="1">
						<Text>{title}</Text>
						<Text size="1" color="gray">
							{description}
						</Text>
					</Flex>
					{children}
				</Flex>
			</Box>
		</Flex>
	);
	return <Card>{asLabel ? <Text as="label">{row}</Text> : row}</Card>;
};

export const WorkflowSettings = () => {
	const { t } = useTranslation();
	const [fadeWidth, setFadeWidth] = useAtom(lyricWordFadeWidthAtom);
	const toggles = (rows: readonly ToggleRow[]) =>
		rows.map(([titleKey, title, descKey, desc, icon, setting]) => (
			<SettingRow
				key={titleKey}
				icon={icon}
				title={t(titleKey, title)}
				description={t(descKey, desc)}
				asLabel
			>
				<SettingToggle setting={setting} />
			</SettingRow>
		));
	return (
		<Flex direction="column" gap="4">
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("settings.group.editModeDisplay", "Edit mode")}
				</Heading>
				{toggles(editModeToggles)}
			</Flex>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("settings.group.timeModeDisplay", "Time mode display")}
				</Heading>
				{toggles(timeModeDisplayToggles)}
			</Flex>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("settings.group.syncAids", "Syncing aids")}
				</Heading>
				<SettingRow
					icon={<Timeline24Regular />}
					title={t("ribbonBar.syncMode.syncLevel", "Sync Level")}
					description={t(
						"settings.workflow.syncLevelDesc",
						"Word sync times every word. Line sync times whole lines only.",
					)}
				>
					<SyncLevelControl />
				</SettingRow>
				{toggles(syncAidToggles)}
			</Flex>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("settings.group.previewControls", "Preview")}
				</Heading>
				<SettingRow
					icon={<Eye24Regular />}
					title={t("ribbonBar.previewMode.mode", "Mode")}
					description={t(
						"settings.workflow.previewModeDesc",
						"Choose which preview the Preview tab shows.",
					)}
				>
					<PreviewModeControl />
				</SettingRow>
				<SettingRow
					icon={<Image24Regular />}
					title={t("ribbonBar.previewMode.background", "Background")}
					description={t(
						"settings.workflow.spicyBackgroundDesc",
						"What shows behind the Spicy preview.",
					)}
				>
					<SpicyBackgroundControl />
				</SettingRow>
				{toggles(previewToggles)}
				<SettingRow
					icon={<ArrowAutofitWidth24Regular />}
					title={t("ribbonBar.previewMode.fadeWidth", "Fade Width")}
					description={t(
						"settings.workflow.fadeWidthDesc",
						"How soft the edge of the highlight is as a word fills in the Standard and Toxi previews.",
					)}
				>
					<TextField.Root
						type="number"
						min={0}
						step={0.1}
						value={fadeWidth}
						style={{ width: 80 }}
						onChange={(event) => {
							const value = event.target.valueAsNumber;
							if (Number.isFinite(value)) setFadeWidth(Math.max(0, value));
						}}
					/>
				</SettingRow>
			</Flex>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("settings.group.previewPerformance", "Preview performance")}
				</Heading>
				{toggles(performanceToggles)}
			</Flex>
		</Flex>
	);
};

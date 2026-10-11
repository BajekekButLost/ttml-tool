import { Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useAtom, type WritableAtom } from "jotai";
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

const editorToggles: readonly [
	string,
	string,
	WritableAtom<boolean, [boolean], unknown>,
][] = [
	[
		"settings.common.advancedRibbonControls",
		"Show advanced ribbon controls",
		advancedRibbonControlsAtom,
	],
	[
		"ribbonBar.editMode.showTranslation",
		"Show translation lines",
		showLineTranslationAtom,
	],
	[
		"ribbonBar.editMode.showRomanization",
		"Show romanization lines",
		showLineRomanizationAtom,
	],
	[
		"ribbonBar.editMode.showWordRomanizationInput",
		"Word romanization inputs",
		showWordRomanizationInputAtom,
	],
	[
		"ribbonBar.syncMode.showPerWordRomanization",
		"Show per-word romanization",
		displayRomanizationInSyncAtom,
	],
	["ribbonBar.syncMode.showTimestamps", "Show timestamps", showTimestampsAtom],
	[
		"ribbonBar.syncMode.highlightActiveWord",
		"Highlight active word",
		highlightActiveWordAtom,
	],
	[
		"ribbonBar.syncMode.highlightErrors",
		"Highlight errors",
		highlightErrorsAtom,
	],
	[
		"ribbonBar.syncMode.enableGlowAnimation",
		"Enable glow animation",
		enableSyncGlowAnimationAtom,
	],
	[
		"ribbonBar.syncMode.showTimestampUpdate",
		"Show timestamp updates",
		visualizeTimestampUpdateAtom,
	],
	[
		"ribbonBar.syncMode.touchSyncPanel",
		"Touch sync panel",
		showTouchSyncPanelAtom,
	],
	["ribbonBar.editMode.previewPanel", "Preview panel", showPreviewPanelAtom],
	[
		"ribbonBar.syncMode.bgLyricIgnoreSync",
		"Ignore background lyrics while syncing",
		backgroundSyncSettingAtom,
	],
	[
		"ribbonBar.syncMode.manualTimestampEdit",
		"Manual timestamp editing",
		enableManualTimestampEditAtom,
	],
	[
		"ribbonBar.syncMode.doubleClickEdit",
		"Double-click word editing",
		enableTimeModeDoubleClickEditAtom,
	],
];
const previewToggles: typeof editorToggles = [
	[
		"ribbonBar.previewMode.autoScroll",
		"Timing overview auto-scroll",
		timingOverviewAutoScrollAtom,
	],
	[
		"ribbonBar.previewMode.showTranslation",
		"Show translation",
		showTranslationLinesAtom,
	],
	["ribbonBar.previewMode.showRoman", "Show romanization", showRomanLinesAtom],
	[
		"ribbonBar.previewMode.simpleLyrics",
		"Simple lyrics",
		spicySimpleLyricsModeAtom,
	],
	[
		"ribbonBar.previewMode.forceLineRendering",
		"Force line rendering",
		spicyForceLineSyncedAtom,
	],
	[
		"ribbonBar.previewMode.instantFade",
		"Instant fade",
		instantHighlightFadeAtom,
	],
	["settings.preview.vsync", "V-Sync", vsyncAtom],
	["ribbonBar.previewMode.showFps", "Show FPS", showFpsCounterAtom],
];

export const WorkflowSettings = () => {
	const { t } = useTranslation();
	const [fadeWidth, setFadeWidth] = useAtom(lyricWordFadeWidthAtom);
	const toggles = (items: typeof editorToggles) =>
		items.map(([key, fallback, setting]) => (
			<Card key={key}>
				<Text as="label">
					<Flex align="center" justify="between" gap="4">
						<Text>{t(key, fallback)}</Text>
						<SettingToggle setting={setting} />
					</Flex>
				</Text>
			</Card>
		));
	return (
		<Flex direction="column" gap="3">
			<Heading size="4">
				{t("settings.group.editorControls", "Editor display & controls")}
			</Heading>
			<Card>
				<Flex align="center" justify="between" gap="4">
					<Text>{t("ribbonBar.syncMode.syncLevel", "Sync Level")}</Text>
					<SyncLevelControl />
				</Flex>
			</Card>
			{toggles(editorToggles)}
			<Heading size="4">
				{t("settings.group.previewControls", "Preview")}
			</Heading>
			<Card>
				<Flex align="center" justify="between" gap="4">
					<Text>{t("ribbonBar.previewMode.mode", "Preview mode")}</Text>
					<PreviewModeControl />
				</Flex>
			</Card>
			{toggles(previewToggles)}
			<Card>
				<Flex align="center" justify="between" gap="4">
					<Text>
						{t("ribbonBar.previewMode.background", "Spicy background")}
					</Text>
					<SpicyBackgroundControl />
				</Flex>
			</Card>
			<Card>
				<Flex align="center" justify="between" gap="4">
					<Text>{t("ribbonBar.previewMode.fadeWidth", "Fade width")}</Text>
					<TextField.Root
						type="number"
						min={0}
						step={0.1}
						value={fadeWidth}
						onChange={(event) => {
							const value = event.target.valueAsNumber;
							if (Number.isFinite(value)) setFadeWidth(Math.max(0, value));
						}}
					/>
				</Flex>
			</Card>
		</Flex>
	);
};

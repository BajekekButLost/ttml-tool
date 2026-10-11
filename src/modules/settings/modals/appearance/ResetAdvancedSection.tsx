import { ArrowReset24Regular, Sparkle24Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { DEFAULT_GLASS_BLUR } from "$/modules/settings/logic/glass-blur";
import type { AppearanceSectionState } from "./sectionState";
export const ResetAdvancedSection = ({
	setLegacyDarkTheme,
	setAdvWaveformColor,
	setAdvWaveformProgress,
	setAdvPrimaryText,
	setAdvSecondaryText,
	setVTitlebarBg,
	setVSidebarBg,
	setVSidebarActive,
	setVMenuHover,
	setVEditorBg,
	setVActiveLine,
	setVLineHover,
	setVChipRadius,
	setVChipGap,
	setVChipPaddingV,
	setVChipPaddingH,
	setVRomanColor,
	setVTransColor,
	setVAudioBarBg,
	setVAudioBarText,
	setVScrollbar,
	setVDialogBg,
	setVDialogBorder,
	setVGlobalRadius,
	setVGlobalBorderWidth,
	setVShadow,
	setVSelection,
	setLayoutOrder,
	setGlassBlur,
	t,
}: Pick<
	AppearanceSectionState,
	| "setLegacyDarkTheme"
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
	| "t"
>) => (
	<Card size="2">
		<Flex direction="column" gap="3">
			<Flex align="center" gap="2" style={{ color: "var(--gray-11)" }}>
				<Sparkle24Regular />
				<Text size="2" color="gray">
					{t(
						"settings.appearance.advanced.masterResetNote",
						"This will reset all 20+ granular overrides.",
					)}
				</Text>
			</Flex>
			<Button
				variant="surface"
				color="red"
				onClick={() => {
					setAdvWaveformColor("");
					setAdvWaveformProgress("");
					setAdvPrimaryText("");
					setAdvSecondaryText("");
					setVTitlebarBg("");
					setVSidebarBg("");
					setVSidebarActive("");
					setVMenuHover("");
					setVEditorBg("");
					setVActiveLine("");
					setVLineHover("");
					setVSelection("");
					setVChipRadius(8);
					setVChipGap(8);
					setVChipPaddingV(4);
					setVChipPaddingH(12);
					setVRomanColor("");
					setVTransColor("");
					setVAudioBarBg("");
					setVAudioBarText("");
					setVScrollbar("");
					setVDialogBg("");
					setVDialogBorder("");
					setVGlobalRadius(12);
					setVGlobalBorderWidth(1);
					setVShadow(1);
					setGlassBlur(DEFAULT_GLASS_BLUR);
					setLegacyDarkTheme(false);
					setLayoutOrder(["titlebar", "ribbonbar", "editor", "audio-controls"]);
				}}
				style={{ cursor: "pointer" }}
			>
				<ArrowReset24Regular />
				{t(
					"settings.appearance.advanced.resetMaster",
					"Master Reset Advanced Config",
				)}
			</Button>
		</Flex>
	</Card>
);

import { History24Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { DEFAULT_GLASS_BLUR } from "$/modules/settings/logic/glass-blur";
import type { AppearanceSectionState } from "./sectionState";
export const ResetThemeSection = ({
	setAccentColor,
	setUseCustomAccent,
	setCustomAccentColor,
	setBackgroundMode,
	setSelectedGradient,
	setUseCustomGradient,
	setCustomGradientColors,
	setCustomGradientType,
	setCustomGradientOpacity,
	setCustomGradientCenter,
	setCustomGradientAngle,
	setCustomGradientSize,
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
	| "setAccentColor"
	| "setUseCustomAccent"
	| "setCustomAccentColor"
	| "setBackgroundMode"
	| "setSelectedGradient"
	| "setUseCustomGradient"
	| "setCustomGradientColors"
	| "setCustomGradientType"
	| "setCustomGradientOpacity"
	| "setCustomGradientCenter"
	| "setCustomGradientAngle"
	| "setCustomGradientSize"
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
	<Flex direction="column" gap="3">
		<Heading size="4">
			{t("settings.appearance.resetTitle", "Reset Theme")}
		</Heading>
		<Card>
			<Flex direction="column" gap="2">
				<Flex align="center" gap="2" style={{ color: "var(--gray-11)" }}>
					<History24Regular />
					<Text size="2">
						{t(
							"settings.appearance.resetDesc",
							"Reset all colors, backgrounds, gradients, and custom overrides back to the default theme.",
						)}
					</Text>
				</Flex>
				<Button
					variant="soft"
					color="red"
					onClick={() => {
						setAccentColor("red");
						setUseCustomAccent(false);
						setCustomAccentColor("#e5484d");
						setBackgroundMode("none");
						setSelectedGradient("sunset");
						setUseCustomGradient(false);
						setCustomGradientColors(["#7028e4"]);
						setCustomGradientType("linear");
						setCustomGradientOpacity(1);
						setCustomGradientCenter([50, 50]);
						setCustomGradientAngle(45);
						setCustomGradientSize(1);
						setGlassBlur(DEFAULT_GLASS_BLUR);
						setLegacyDarkTheme(false);

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
						setLayoutOrder([
							"titlebar",
							"ribbonbar",
							"editor",
							"audio-controls",
						]);
					}}
				>
					<History24Regular />
					{t("settings.appearance.resetTheme", "Reset Theme to Default")}
				</Button>
			</Flex>
		</Card>
	</Flex>
);

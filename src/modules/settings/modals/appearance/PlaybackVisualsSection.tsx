import { Speaker224Regular } from "@fluentui/react-icons";
import { Card, Flex, Grid, Heading } from "@radix-ui/themes";
import { AdvancedColorItem } from "./AdvancedControls";
import type { AppearanceSectionState } from "./sectionState";
export const PlaybackVisualsSection = ({
	advWaveformColor,
	setAdvWaveformColor,
	advWaveformProgress,
	setAdvWaveformProgress,
	vRomanColor,
	setVRomanColor,
	vTransColor,
	setVTransColor,
	vGeniusHeaderColor,
	setVGeniusHeaderColor,
	vAudioBarBg,
	setVAudioBarBg,
	vAudioBarText,
	setVAudioBarText,
	t,
}: Pick<
	AppearanceSectionState,
	| "advWaveformColor"
	| "setAdvWaveformColor"
	| "advWaveformProgress"
	| "setAdvWaveformProgress"
	| "vRomanColor"
	| "setVRomanColor"
	| "vTransColor"
	| "setVTransColor"
	| "vGeniusHeaderColor"
	| "setVGeniusHeaderColor"
	| "vAudioBarBg"
	| "setVAudioBarBg"
	| "vAudioBarText"
	| "setVAudioBarText"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			<Speaker224Regular />{" "}
			{t("settings.appearance.advanced.audioVisuals", "Playback & visuals")}
		</Heading>
		<Card>
			<Flex direction="column" gap="4">
				<Grid columns="2" gap="3">
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.audioBarColor",
							"Audio bar color",
						)}
						value={vAudioBarBg}
						onChange={setVAudioBarBg}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.audioBarText",
							"Audio bar text",
						)}
						value={vAudioBarText}
						onChange={setVAudioBarText}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.waveformInactive",
							"Waveform inactive",
						)}
						value={advWaveformColor}
						onChange={setAdvWaveformColor}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.waveformProgress",
							"Waveform progress",
						)}
						value={advWaveformProgress}
						onChange={setAdvWaveformProgress}
					/>
				</Grid>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.romanizationText",
						"Romanization text",
					)}
					value={vRomanColor}
					onChange={setVRomanColor}
				/>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.translationText",
						"Translation text",
					)}
					value={vTransColor}
					onChange={setVTransColor}
				/>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.geniusHeaderColor",
						"Genius header color",
					)}
					value={vGeniusHeaderColor}
					onChange={setVGeniusHeaderColor}
				/>
			</Flex>
		</Card>
	</Flex>
);

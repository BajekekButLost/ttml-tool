import {
	ArrowBidirectionalLeftRight24Regular,
	ArrowBidirectionalUpDown24Regular,
	Edit24Regular,
	Stack24Regular,
} from "@fluentui/react-icons";
import { Card, Flex, Grid, Heading, Switch, Text } from "@radix-ui/themes";
import { AdvancedColorItem, AdvancedSliderItem } from "./AdvancedControls";
import type { AppearanceSectionState } from "./sectionState";
export const EditorLayoutSection = ({
	vEditorBg,
	setVEditorBg,
	vActiveLine,
	setVActiveLine,
	vLineHover,
	setVLineHover,
	vChipRadius,
	setVChipRadius,
	vChipGap,
	setVChipGap,
	vChipPaddingV,
	setVChipPaddingV,
	vChipPaddingH,
	setVChipPaddingH,
	legacySpaceLabels,
	setLegacySpaceLabels,
	vSelection,
	setVSelection,
	t,
}: Pick<
	AppearanceSectionState,
	| "vEditorBg"
	| "setVEditorBg"
	| "vActiveLine"
	| "setVActiveLine"
	| "vLineHover"
	| "setVLineHover"
	| "vChipRadius"
	| "setVChipRadius"
	| "vChipGap"
	| "setVChipGap"
	| "vChipPaddingV"
	| "setVChipPaddingV"
	| "vChipPaddingH"
	| "setVChipPaddingH"
	| "legacySpaceLabels"
	| "setLegacySpaceLabels"
	| "vSelection"
	| "setVSelection"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			<Edit24Regular />{" "}
			{t("settings.appearance.advanced.editor", "Editor Layout")}
		</Heading>
		<Card>
			<Flex direction="column" gap="4">
				<Grid columns="2" gap="3">
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.editorCanvas",
							"Editor Canvas",
						)}
						value={vEditorBg}
						onChange={setVEditorBg}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.activeLineHighlight",
							"Active Line Highlight",
						)}
						value={vActiveLine}
						onChange={setVActiveLine}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.lineHoverEffect",
							"Line Hover Effect",
						)}
						value={vLineHover}
						onChange={setVLineHover}
					/>
					<AdvancedColorItem
						label={t(
							"settings.appearance.advanced.selectionHighlight",
							"Selection Highlight",
						)}
						value={vSelection}
						onChange={setVSelection}
					/>
				</Grid>
				<AdvancedSliderItem
					label={t(
						"settings.appearance.advanced.chipBorderRadius",
						"Chip Border Radius",
					)}
					icon={<Stack24Regular />}
					value={vChipRadius}
					min={0}
					max={32}
					onChange={setVChipRadius}
					unit="px"
				/>
				<AdvancedSliderItem
					label={t(
						"settings.appearance.advanced.chipSpacing",
						"Chip Spacing (Gap)",
					)}
					icon={<Stack24Regular />}
					value={vChipGap}
					min={0}
					max={32}
					onChange={setVChipGap}
					unit="px"
				/>
				<AdvancedSliderItem
					label={t(
						"settings.appearance.advanced.chipPaddingVertical",
						"Chip Padding (V)",
					)}
					icon={<ArrowBidirectionalUpDown24Regular />}
					value={vChipPaddingV}
					min={0}
					max={32}
					onChange={setVChipPaddingV}
					unit="px"
				/>
				<AdvancedSliderItem
					label={t(
						"settings.appearance.advanced.chipPaddingHorizontal",
						"Chip Padding (H)",
					)}
					icon={<ArrowBidirectionalLeftRight24Regular />}
					value={vChipPaddingH}
					min={0}
					max={32}
					onChange={setVChipPaddingH}
					unit="px"
				/>
				<Flex align="center" justify="between" gap="3">
					<Flex direction="column" gap="1">
						<Text>
							{t(
								"settings.appearance.advanced.legacySpaceLabels",
								"Legacy Space Labels",
							)}
						</Text>
						<Text size="1" color="gray">
							{t(
								"settings.appearance.advanced.legacySpaceLabelsDesc",
								"Show Space xN instead of compact empty space cells.",
							)}
						</Text>
					</Flex>
					<Switch
						checked={legacySpaceLabels}
						onCheckedChange={setLegacySpaceLabels}
					/>
				</Flex>
			</Flex>
		</Card>
	</Flex>
);

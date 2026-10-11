import { Card, Flex, Grid, SegmentedControl, Text } from "@radix-ui/themes";
import type { FontSelection } from "./useFontSelection";
export const FontStyleSection = ({
	t,
	appFontWeight,
	setAppFontWeight,
	appFontStyle,
	setAppFontStyle,
}: Pick<
	FontSelection,
	| "t"
	| "appFontWeight"
	| "setAppFontWeight"
	| "appFontStyle"
	| "setAppFontStyle"
>) => (
	<Card
		variant="surface"
		style={{ padding: "40px", backgroundColor: "var(--gray-2)" }}
	>
		<Grid columns="2" gap="6" width="100%">
			<Flex direction="column" gap="3">
				<Text size="4" weight="bold" mb="2">
					{t("settings.appearance.fontWeight", "Font Weight")}
				</Text>
				<SegmentedControl.Root
					size="3"
					value={appFontWeight}
					onValueChange={setAppFontWeight}
					style={{ width: "100%" }}
				>
					<SegmentedControl.Item value="400" style={{ flexGrow: 1 }}>
						{t("settings.appearance.weight.regular", "Regular")}
					</SegmentedControl.Item>
					<SegmentedControl.Item value="700" style={{ flexGrow: 1 }}>
						{t("settings.appearance.weight.bold", "Bold")}
					</SegmentedControl.Item>
				</SegmentedControl.Root>
			</Flex>
			<Flex direction="column" gap="3">
				<Text size="4" weight="bold" mb="2">
					{t("settings.appearance.fontStyle", "Font Style")}
				</Text>
				<SegmentedControl.Root
					size="3"
					value={appFontStyle}
					onValueChange={setAppFontStyle}
					style={{ width: "100%" }}
				>
					<SegmentedControl.Item value="normal" style={{ flexGrow: 1 }}>
						{t("settings.appearance.style.normal", "Normal")}
					</SegmentedControl.Item>
					<SegmentedControl.Item value="italic" style={{ flexGrow: 1 }}>
						{t("settings.appearance.style.italic", "Italic")}
					</SegmentedControl.Item>
				</SegmentedControl.Root>
			</Flex>
		</Grid>
	</Card>
);

import {
	Box,
	Card,
	Flex,
	Grid,
	Heading,
	ScrollArea,
	Text,
} from "@radix-ui/themes";
import { DEFAULT_FONTS } from "./catalog";
import type { FontSelection } from "./useFontSelection";
export const FontLibrarySection = ({
	t,
	appFont,
	appFontWeight,
	appFontStyle,
	filteredGoogleFonts,
	filteredSystemFonts,
	handleSelectFont,
}: Pick<
	FontSelection,
	| "t"
	| "appFont"
	| "appFontWeight"
	| "appFontStyle"
	| "filteredGoogleFonts"
	| "filteredSystemFonts"
	| "handleSelectFont"
>) => (
	<ScrollArea type="always" scrollbars="vertical" style={{ flexGrow: 1 }}>
		<Flex direction="column" gap="4" pr="4" pb="6">
			<Box>
				<Heading size="3" mb="2">
					{t("settings.appearance.defaultFonts", "Standard Stacks")}
				</Heading>
				<Grid columns="repeat(auto-fill, minmax(280px, 1fr))" gap="3">
					{DEFAULT_FONTS.map((font) => (
						<Card
							key={font.label}
							style={{
								cursor: "pointer",
								padding: "12px",
								minHeight: "60px",
								display: "flex",
								alignItems: "center",
								border:
									appFont === font.value ? "2px solid var(--accent-9)" : "none",
							}}
							onClick={() => handleSelectFont(font.value, false)}
						>
							<Text size="3" style={{ fontFamily: font.value }}>
								{font.label}
							</Text>
						</Card>
					))}
				</Grid>
			</Box>

			{filteredSystemFonts.length > 0 && (
				<Box>
					<Heading size="3" mb="2">
						{t("settings.appearance.systemFonts", "System Fonts")}
					</Heading>
					<Grid columns="repeat(auto-fill, minmax(280px, 1fr))" gap="3">
						{filteredSystemFonts.map((font) => (
							<Card
								key={font}
								style={{
									cursor: "pointer",
									padding: "12px",
									minHeight: "60px",
									display: "flex",
									alignItems: "center",
									border:
										appFont === font ? "2px solid var(--accent-9)" : "none",
								}}
								onClick={() => handleSelectFont(font, false)}
							>
								<Text
									size="4"
									style={{
										fontFamily: `"${font}", sans-serif`,
										fontWeight: appFontWeight,
										fontStyle: appFontStyle,
									}}
								>
									{font}
								</Text>
							</Card>
						))}
					</Grid>
				</Box>
			)}

			<Box>
				<Heading size="3" mb="2">
					{t("settings.appearance.googleFonts", "Google Fonts Library")}
				</Heading>
				<Grid columns="repeat(auto-fill, minmax(280px, 1fr))" gap="3">
					{filteredGoogleFonts.map((font) => (
						<Card
							key={font}
							style={{
								cursor: "pointer",
								padding: "12px",
								minHeight: "80px",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								border:
									appFont === `"${font}", sans-serif`
										? "2px solid var(--accent-9)"
										: "none",
							}}
							onClick={() => handleSelectFont(font)}
						>
							<Flex direction="column" gap="1">
								<Text size="1" color="gray">
									{font}
								</Text>
								<Text
									size="5"
									style={{
										fontFamily: `"${font}", sans-serif`,
										fontWeight: appFontWeight,
										fontStyle: appFontStyle,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{font}
								</Text>
							</Flex>
						</Card>
					))}
				</Grid>
			</Box>
		</Flex>
	</ScrollArea>
);

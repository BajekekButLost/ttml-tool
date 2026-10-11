import { Sparkle24Regular } from "@fluentui/react-icons";
import {
	Box,
	Card,
	Flex,
	Grid,
	Heading,
	IconButton,
	Switch,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import { accentColors } from "./accentColors";
import type { AppearanceSectionState } from "./sectionState";
export const ThemeSection = ({
	accentColor,
	setAccentColor,
	useCustomAccent,
	setUseCustomAccent,
	customAccentColor,
	setCustomAccentColor,
	customScale,
	t,
}: Pick<
	AppearanceSectionState,
	| "accentColor"
	| "setAccentColor"
	| "useCustomAccent"
	| "setUseCustomAccent"
	| "customAccentColor"
	| "setCustomAccentColor"
	| "customScale"
	| "t"
>) => (
	<Flex direction="column" gap="2">
		<Heading size="4">{t("settings.appearance.theme", "Theme")}</Heading>

		<Card>
			<Flex direction="column" gap="4">
				<Flex gap="3" align="start">
					<Sparkle24Regular />
					<Box flexGrow="1">
						<Flex direction="column" gap="3">
							<Flex align="center" justify="between">
								<Flex direction="column" gap="1">
									<Text>
										{t(
											"settings.appearance.useCustomAccent",
											"Custom Accent Color",
										)}
									</Text>
									<Text size="1" color="gray">
										{t(
											"settings.appearance.useCustomAccentDesc",
											"Set Accent color",
										)}
									</Text>
								</Flex>
								<Switch
									checked={useCustomAccent}
									onCheckedChange={setUseCustomAccent}
								/>
							</Flex>

							{useCustomAccent ? (
								<Flex direction="column" gap="3">
									<Flex align="center" gap="3">
										<input
											type="color"
											value={customAccentColor}
											onChange={(e) => {
												const newColor = e.target.value;
												setCustomAccentColor(newColor);
											}}
											style={{
												width: "40px",
												height: "40px",
												padding: 0,
												border: "none",
												borderRadius: "var(--radius-3)",
												cursor: "pointer",
												backgroundColor: "transparent",
											}}
										/>
										<Text size="2" weight="bold">
											{customAccentColor.toUpperCase()}
										</Text>
									</Flex>
									<Grid columns="12" gap="1">
										{Array.from({ length: 12 }).map((_, i) => (
											<Box
												key={`shade-${i + 1}`}
												style={{
													height: "20px",
													borderRadius: "var(--radius-1)",
													backgroundColor: customScale[`--accent-${i + 1}`],
												}}
											/>
										))}
									</Grid>
								</Flex>
							) : (
								<Grid columns="8" gap="2">
									{accentColors.map((color) => (
										<Tooltip key={color} content={color}>
											<IconButton
												size="2"
												variant={accentColor === color ? "solid" : "soft"}
												color={color}
												style={{
													borderRadius: "var(--radius-2)",
													cursor: "pointer",
												}}
												onClick={() => setAccentColor(color)}
											>
												<Box
													style={{
														width: "12px",
														height: "12px",
														borderRadius: "50%",
														backgroundColor: "currentColor",
													}}
												/>
											</IconButton>
										</Tooltip>
									))}
								</Grid>
							)}
						</Flex>
					</Box>
				</Flex>
			</Flex>
		</Card>
	</Flex>
);

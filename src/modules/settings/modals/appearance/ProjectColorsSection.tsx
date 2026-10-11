import { PaintBrush24Regular, TextT24Regular } from "@fluentui/react-icons";
import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import type { AppearanceSectionState } from "./sectionState";
export const ProjectColorsSection = ({
	advPrimaryText,
	setAdvPrimaryText,
	advSecondaryText,
	setAdvSecondaryText,
	t,
}: Pick<
	AppearanceSectionState,
	| "advPrimaryText"
	| "setAdvPrimaryText"
	| "advSecondaryText"
	| "setAdvSecondaryText"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			<PaintBrush24Regular />{" "}
			{t("settings.appearance.advanced.projectColors", "Project Colors")}
		</Heading>
		<Card>
			<Flex direction="column" gap="4">
				<Flex gap="3" align="start">
					<TextT24Regular />
					<Box flexGrow="1">
						<Flex direction="column" gap="3">
							<Flex align="center" justify="between">
								<Flex direction="column" gap="1">
									<Text>
										{t(
											"settings.appearance.advanced.primaryText",
											"Primary Text Color",
										)}
									</Text>
									<Text size="1" color="gray">
										{t(
											"settings.appearance.advanced.primaryTextDesc",
											"Global primary text override.",
										)}
									</Text>
								</Flex>
								<input
									type="color"
									value={advPrimaryText || "#ffffff"}
									onChange={(e) => setAdvPrimaryText(e.target.value)}
									style={{ width: "32px", height: "32px" }}
								/>
							</Flex>

							<Flex align="center" justify="between">
								<Flex direction="column" gap="1">
									<Text>
										{t(
											"settings.appearance.advanced.secondaryText",
											"Secondary Text Color",
										)}
									</Text>
									<Text size="1" color="gray">
										{t(
											"settings.appearance.secondaryDesc",
											"Translations & Metadata.",
										)}
									</Text>
								</Flex>
								<input
									type="color"
									value={advSecondaryText || "#888888"}
									onChange={(e) => setAdvSecondaryText(e.target.value)}
									style={{ width: "32px", height: "32px" }}
								/>
							</Flex>
						</Flex>
					</Box>
				</Flex>
			</Flex>
		</Card>
	</Flex>
);

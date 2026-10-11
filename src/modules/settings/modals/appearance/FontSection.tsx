import { TextT24Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import type { AppearanceSectionState } from "./sectionState";
export const FontSection = ({
	appFont,
	setIsFontSelectionOpen,
	t,
}: Pick<
	AppearanceSectionState,
	"appFont" | "setIsFontSelectionOpen" | "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			{t("settings.appearance.font", "Application Font")}
		</Heading>
		<Card>
			<Flex direction="column" gap="3">
				<Flex direction="column" gap="1">
					<Text size="2" weight="bold">
						{t("settings.appearance.currentFont", "Current Font")}
					</Text>
					<Text size="1" color="gray" style={{ fontFamily: appFont }}>
						{appFont.split(",")[0].replace(/"/g, "")}
					</Text>
				</Flex>
				<Button
					variant="soft"
					style={{ cursor: "pointer" }}
					onClick={() => setIsFontSelectionOpen(true)}
				>
					<TextT24Regular />
					{t("settings.appearance.changeFont", "Change Font...")}
				</Button>
			</Flex>
		</Card>
	</Flex>
);

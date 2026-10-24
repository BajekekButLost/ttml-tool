import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { openExternal } from "./externalLinks";
import type { AboutSettings } from "./useAboutSettings";
export const CommunitySection = ({ t }: Pick<AboutSettings, "t">) => (
	<Card>
		<Flex direction="column" gap="3">
			<Heading size="3">
				{t("aboutModal.community", "Community & contributions")}
			</Heading>
			<Text size="2" color="gray">
				{t(
					"aboutModal.communityDesc",
					"Help us make the tool better by contributing code, reporting issues, or providing translations.",
				)}
			</Text>
			<Flex gap="3" mt="1">
				<Button
					variant="soft"
					onClick={() =>
						openExternal("https://github.com/spicylyrics/ttml-tool")
					}
				>
					{t("aboutModal.github", "GitHub repository")}
				</Button>
			</Flex>
		</Flex>
	</Card>
);

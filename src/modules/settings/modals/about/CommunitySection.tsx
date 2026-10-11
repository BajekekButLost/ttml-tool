import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { openExternal } from "./externalLinks";
import type { AboutSettings } from "./useAboutSettings";
export const CommunitySection = ({ t }: Pick<AboutSettings, "t">) => (
	<Card>
		<Flex direction="column" gap="3">
			<Heading size="3">
				{t("aboutModal.community", "Community & Contributions")}
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
						openExternal("https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL")
					}
				>
					{t("aboutModal.github", "GitHub Repository")}
				</Button>
				<Button
					variant="soft"
					color="indigo"
					onClick={() =>
						openExternal("https://crowdin.com/project/very-cool-ttml-tool")
					}
				>
					{t("aboutModal.crowdin", "Help Translate in Crowdin")}
				</Button>
			</Flex>
		</Flex>
	</Card>
);

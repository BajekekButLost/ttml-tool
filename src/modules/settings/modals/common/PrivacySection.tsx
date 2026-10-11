import { Flex, Heading } from "@radix-ui/themes";
import { DiscordPresenceSettings } from "$/modules/discord-presence/DiscordPresenceSettings";
import type { CommonSettings } from "./useCommonSettings";
export const PrivacySection = ({ t }: Pick<CommonSettings, "t">) => (
	<Flex direction="column" gap="2">
		<Heading size="4">{t("settings.group.privacy", "Privacy")}</Heading>
		<DiscordPresenceSettings />
	</Flex>
);

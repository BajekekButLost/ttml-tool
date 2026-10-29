import { Search24Regular } from "@fluentui/react-icons";
import { Box, Card, Flex, Switch, Text } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { cmdOpenCommandPalette } from "$/modules/keyboard/commands";
import { formatKeyBindings } from "$/utils/keybindings";
import { commandPaletteEnabledAtom } from "./states";

/** The feature flag's switch, one row in Preferences → General. */
export const CommandPaletteSetting = () => {
	const { t } = useTranslation();
	const [enabled, setEnabled] = useAtom(commandPaletteEnabledAtom);
	const keys = useAtomValue(cmdOpenCommandPalette.atom);
	return (
		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<Search24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t("commandPalette.settingLabel", "Command palette")}
								</Text>
								<Text size="1" color="gray">
									{keys.length > 0
										? t("commandPalette.settingDesc", {
												shortcut: formatKeyBindings(keys),
											})
										: t("commandPalette.settingDescUnbound")}
								</Text>
							</Flex>
							<Switch checked={enabled} onCheckedChange={setEnabled} />
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
	);
};

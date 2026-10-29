import { DropdownMenu } from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { cmdOpenCommandPalette } from "$/modules/keyboard/commands";
import { formatKeyBindings } from "$/utils/keybindings";
import { commandPaletteEnabledAtom, commandPaletteOpenAtom } from "./states";

/** "Command palette..." for the Help menu. Renders nothing while the flag is off. */
export const CommandPaletteMenuItem = () => {
	const enabled = useAtomValue(commandPaletteEnabledAtom);
	return enabled ? <PaletteMenuItem /> : null;
};

const PaletteMenuItem = () => {
	const { t } = useTranslation();
	const setOpen = useSetAtom(commandPaletteOpenAtom);
	const keys = useAtomValue(cmdOpenCommandPalette.atom);
	return (
		<>
			<DropdownMenu.Item
				onSelect={() => setOpen(true)}
				shortcut={keys.length > 0 ? formatKeyBindings(keys) : undefined}
			>
				{t("commandPalette.menu", "Command palette...")}
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
		</>
	);
};

import {
	Edit20Regular,
	Folder20Regular,
	Speaker220Regular,
	Timer20Regular,
} from "@fluentui/react-icons";
import {
	Box,
	Button,
	Flex,
	Grid,
	Heading,
	Text,
	TextField,
} from "@radix-ui/themes";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	formatKeyBindings,
	getShortcutKey,
	RESET_KEYBINDING,
	recordShortcut,
	stopRecordingShortcut,
} from "$/utils/keybindings";
import { keyBindingListAtom } from "../binding-list";
import { findKeyBindingConflicts } from "../conflicts";
import { getAllCommands } from "../registry";
import type { KeyBindingCommand } from "../types";

const KEYBINDING_CATEGORY_ICONS: Record<string, React.ReactNode> = {
	File: <Folder20Regular />,
	Edit: <Edit20Regular />,
	Sync: <Timer20Regular />,
	Audio: <Speaker220Regular />,
};

const KeyBindingsEdit = ({
	command,
	conflicts = [],
}: {
	command: KeyBindingCommand;
	conflicts?: KeyBindingCommand[];
}) => {
	const { t } = useTranslation();
	const [keys, setKeys] = useAtom(command.atom);
	// Clear and Reset go through the list so extra keys go with the primary.
	// Recording only replaces the primary, leaving extras alone.
	const listAtom = keyBindingListAtom(command);
	const hasExtras = useAtomValue(listAtom).length > 1;
	const setList = useSetAtom(listAtom);
	const [listening, setListening] = useState(false);
	const labelId = useId();
	const conflictId = useId();
	const startRecording = async () => {
		if (listening) return;
		try {
			setListening(true);
			setKeys(await recordShortcut());
		} catch {
			// Escape or another recording cancels without changing this binding.
		} finally {
			setListening(false);
		}
	};

	return (
		<>
			<Box id={labelId} style={{ display: "flex", alignItems: "center" }}>
				{t(command.description)}
			</Box>

			<Box>
				<Flex direction="column" gap="2">
					<TextField.Root
						onClick={startRecording}
						onKeyDown={(event) => {
							if (!listening && (event.key === "Enter" || event.key === " ")) {
								event.preventDefault();
								event.stopPropagation();
								void startRecording();
							}
						}}
						aria-labelledby={labelId}
						aria-describedby={conflicts.length > 0 ? conflictId : undefined}
						size="2"
						value={
							listening
								? t("settingsDialog.keybindings.recording")
								: formatKeyBindings(keys) ||
									t("settingsDialog.keybindings.unbound")
						}
						readOnly
						variant="soft"
						style={{
							cursor: "pointer",
							textAlign: "left",
							backgroundColor: listening ? "var(--gray-3)" : "var(--gray-1)",
							color: listening ? "var(--accent-11)" : "var(--gray-12)",
						}}
					/>
					<Flex gap="2" wrap="wrap">
						<Button
							size="1"
							variant="soft"
							disabled={
								listening ||
								(!hasExtras &&
									getShortcutKey(keys) === getShortcutKey(command.defaultKeys))
							}
							onClick={() => void setList(RESET_KEYBINDING)}
						>
							{t("settingsDialog.keybindings.resetDefault")}
						</Button>
						<Button
							size="1"
							variant="soft"
							color="gray"
							disabled={listening || (keys.length === 0 && !hasExtras)}
							onClick={() => void setList([])}
						>
							{t("settingsDialog.keybindings.clear")}
						</Button>
					</Flex>
					{conflicts.length > 0 && (
						<Text
							id={conflictId}
							as="div"
							size="1"
							color="orange"
							role="status"
						>
							{t("settingsDialog.keybindings.conflict", {
								commands: conflicts
									.map((other) => t(other.description))
									.join(", "),
							})}
						</Text>
					)}
				</Flex>
			</Box>
		</>
	);
};

export const AutoKeyBindingSettingsPanel = () => {
	const { t } = useTranslation();
	useEffect(() => () => stopRecordingShortcut(), []);
	const commands = useMemo(() => getAllCommands(), []);
	const bindingsAtom = useMemo(
		() =>
			atom((get) =>
				commands.map((command) => ({ command, keys: get(command.atom) })),
			),
		[commands],
	);
	const bindings = useAtomValue(bindingsAtom);
	const conflicts = findKeyBindingConflicts(bindings);

	const groupedCommands = commands.reduce(
		(acc, cmd) => {
			if (!acc[cmd.category]) {
				acc[cmd.category] = [];
			}
			acc[cmd.category].push(cmd);
			return acc;
		},
		{} as Record<string, KeyBindingCommand[]>,
	);

	return (
		<Box>
			{Object.entries(groupedCommands).map(([category, cmds]) => (
				<Box key={category} mb="5">
					<Heading size="3" mb="3" color="gray">
						<Flex align="center" gap="2">
							{KEYBINDING_CATEGORY_ICONS[category]}
							<span>
								{t(`settingsDialog.keybindings.category.${category}`, category)}
							</span>
						</Flex>
					</Heading>

					<Grid
						columns={{ initial: "1", sm: "2" }}
						gapX="4"
						gapY="3"
						align="center"
					>
						{cmds.map((cmd) => (
							<KeyBindingsEdit
								key={cmd.id}
								command={cmd}
								conflicts={conflicts.get(cmd.id)}
							/>
						))}
					</Grid>
				</Box>
			))}
		</Box>
	);
};

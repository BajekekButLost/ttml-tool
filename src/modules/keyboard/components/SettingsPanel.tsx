import { Wand20Regular } from "@fluentui/react-icons";
import {
	Box,
	Button,
	Flex,
	Heading,
	Kbd,
	Switch,
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
import { autoSegmentDoublePressAtom } from "../states";
import type { KeyBindingCommand } from "../types";
import { COMMAND_CATEGORY_ICONS } from "./command-category-icons";
import styles from "./SettingsPanel.module.css";

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
	const list = useAtomValue(listAtom);
	const hasExtras = list.length > 1;
	const extras = list.slice(1).filter((extra) => extra.length > 0);
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
		<Flex className={styles.row}>
			<Text id={labelId} size="2" className={styles.name}>
				{t(command.description)}
			</Text>
			{/* Second keys are added from the keyboard above; listed here so the row is complete. */}
			{extras.map((extra, index) => (
				<Kbd
					// biome-ignore lint/suspicious/noArrayIndexKey: slots are positional
					key={index}
					size="2"
					className={styles.extra}
				>
					{formatKeyBindings(extra)}
				</Kbd>
			))}
			<TextField.Root
				className={styles.recorder}
				data-listening={listening}
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
						: formatKeyBindings(keys) || t("settingsDialog.keybindings.unbound")
				}
				readOnly
				variant="soft"
				color="gray"
			/>
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
			{conflicts.length > 0 && (
				<Text
					id={conflictId}
					as="div"
					size="1"
					color="orange"
					role="status"
					className={styles.conflict}
				>
					{t("settingsDialog.keybindings.conflict", {
						commands: conflicts.map((other) => t(other.description)).join(", "),
					})}
				</Text>
			)}
		</Flex>
	);
};

export const AutoKeyBindingSettingsPanel = () => {
	const { t } = useTranslation();
	useEffect(() => () => stopRecordingShortcut(), []);
	const [autoSegmentDoublePress, setAutoSegmentDoublePress] = useAtom(
		autoSegmentDoublePressAtom,
	);
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
							{COMMAND_CATEGORY_ICONS[category]}
							<span>
								{t(`settingsDialog.keybindings.category.${category}`, category)}
							</span>
						</Flex>
					</Heading>

					<div className={styles.rows}>
						{cmds.map((cmd) => (
							<KeyBindingsEdit
								key={cmd.id}
								command={cmd}
								conflicts={conflicts.get(cmd.id)}
							/>
						))}
					</div>
				</Box>
			))}
			<Box mb="5">
				<Heading size="3" mb="3" color="gray">
					<Flex align="center" gap="2">
						<Wand20Regular />
						<span>
							{t(
								"settingsDialog.keybindings.autoSegmentOptions",
								"Auto segment",
							)}
						</span>
					</Flex>
				</Heading>
				<Flex align="center" justify="between" gap="4">
					<Box>
						<Text>
							{t(
								"settingsDialog.keybindings.autoSegmentDoublePress",
								"Require double press",
							)}
						</Text>
						<Text as="div" size="1" color="gray">
							{t(
								"settingsDialog.keybindings.autoSegmentDoublePressDesc",
								"Only run quick auto segment when you press its shortcut twice quickly.",
							)}
						</Text>
					</Box>
					<Switch
						checked={autoSegmentDoublePress}
						onCheckedChange={setAutoSegmentDoublePress}
					/>
				</Flex>
			</Box>
		</Box>
	);
};

import {
	ChevronRight16Regular,
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
import { allKeyBindingListsAtom, keyBindingListAtom } from "../binding-list";
import { findKeyBindingConflicts } from "../conflicts";
import { getAllCommands } from "../registry";
import { shortcutSearchAtom, shortcutShowAllAtom } from "../states";
import type { KeyBindingCommand } from "../types";
import { matchShortcutSearch } from "../view/key-index";
import styles from "./SettingsPanel.module.css";

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

/**
 * "Show actions without a key", for the list below the keyboard. It sits on
 * the keyboard view's hint line instead of taking a row of its own.
 */
export const ShowAllShortcutsSwitch = () => {
	const { t } = useTranslation();
	const [showAll, setShowAll] = useAtom(shortcutShowAllAtom);
	const id = useId();
	return (
		<Flex align="center" gap="2" flexShrink="0">
			<Text as="label" htmlFor={id} size="1">
				{t("settingsDialog.keybindings.showAll")}
			</Text>
			<Switch id={id} size="1" checked={showAll} onCheckedChange={setShowAll} />
		</Flex>
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
	// Conflicts look at every action, not just the ones listed.
	const conflicts = findKeyBindingConflicts(bindings);
	const lists = useAtomValue(allKeyBindingListsAtom);
	const query = useAtomValue(shortcutSearchAtom);
	const showAll = useAtomValue(shortcutShowAllAtom);
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const searching = query.trim() !== "";

	// The keyboard view's search filters this list too, by name or by key, and
	// always over every action so an unbound one can be found and given a key.
	// Otherwise only actions with a key are listed unless "Show actions
	// without a key" is on.
	const matches = useMemo(
		() =>
			searching
				? matchShortcutSearch(lists, query, (command) => t(command.description))
				: undefined,
		[lists, query, searching, t],
	);
	const groups = new Map<string, KeyBindingCommand[]>();
	for (const { command, lists: keys } of lists) {
		const listed = matches
			? matches.has(command.id)
			: showAll || keys.some((binding) => binding.length > 0);
		if (!listed) continue;
		const group = groups.get(command.category) ?? [];
		group.push(command);
		groups.set(command.category, group);
	}

	return (
		<Box>
			{[...groups].map(([category, cmds]) => (
				<details
					key={category}
					className={styles.group}
					// Search results always show; otherwise each group remembers
					// being closed.
					open={searching || !collapsed.has(category)}
					onToggle={(event) => {
						if (searching) return;
						const open = event.currentTarget.open;
						setCollapsed((current) => {
							const next = new Set(current);
							if (open) next.delete(category);
							else next.add(category);
							return next;
						});
					}}
				>
					<summary className={styles.summary}>
						<span className={styles.chevron} aria-hidden>
							<ChevronRight16Regular />
						</span>
						<Heading as="h3" size="3" color="gray">
							<Flex align="center" gap="2">
								{KEYBINDING_CATEGORY_ICONS[category]}
								<span>
									{t(
										`settingsDialog.keybindings.category.${category}`,
										category,
									)}
								</span>
							</Flex>
						</Heading>
						<Text size="1" color="gray" className={styles.count}>
							{cmds.length}
						</Text>
					</summary>

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
				</details>
			))}
			{groups.size === 0 && (
				<Text as="div" size="2" color="gray" role="status" align="center">
					{t("keyboardView.searchResults", { count: 0 })}
				</Text>
			)}
		</Box>
	);
};

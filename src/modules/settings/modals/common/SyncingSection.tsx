import {
	ArrowEnterLeft24Regular,
	CursorClick24Regular,
	Keyboard12324Regular,
	PaddingLeft24Regular,
	PaddingRight24Regular,
	Timer24Regular,
} from "@fluentui/react-icons";
import {
	Box,
	Card,
	Flex,
	Heading,
	Select,
	Switch,
	Text,
} from "@radix-ui/themes";
import { SyncJudgeMode } from "$/modules/settings/states";
import { spectrogramHoverSyncEnabledAtom } from "$/modules/settings/states/sync";
import { KeyBindingTriggerMode } from "$/utils/keybindings";
import {
	SettingToggle,
	SyncOffsetControl,
} from "../../components/WorkflowControls";
import type { CommonSettings } from "./useCommonSettings";
export const SyncingSection = ({
	syncJudgeMode,
	setSyncJudgeMode,
	keyBindingTriggerMode,
	setKeyBindingTriggerMode,
	smartFirstWord,
	setSmartFirstWord,
	smartLastWord,
	setSmartLastWord,
	t,
}: Pick<
	CommonSettings,
	| "syncJudgeMode"
	| "setSyncJudgeMode"
	| "keyBindingTriggerMode"
	| "setKeyBindingTriggerMode"
	| "smartFirstWord"
	| "setSmartFirstWord"
	| "smartLastWord"
	| "setSmartLastWord"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">{t("settings.group.timing", "Syncing")}</Heading>

		<Card>
			<Flex gap="3" align="center">
				<Timer24Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>
								{t(
									"settings.common.syncJudgeMode",
									"Sync Timestamp Judgment Mode",
								)}
							</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.syncJudgeModeDesc",
									'Set the sync timestamp judgment mode, default is "First Key Down Time".',
								)}
							</Text>
						</Flex>

						<Select.Root
							value={syncJudgeMode}
							onValueChange={(v) => setSyncJudgeMode(v as SyncJudgeMode)}
						>
							<Select.Trigger />
							<Select.Content>
								<Select.Item value={SyncJudgeMode.FirstKeyDownTime}>
									{t(
										"settings.common.syncJudgeModeOptions.firstKeyDown",
										"First Key Down Time",
									)}
								</Select.Item>
								<Select.Item value={SyncJudgeMode.LastKeyUpTime}>
									{t(
										"settings.common.syncJudgeModeOptions.lastKeyUp",
										"Last Key Up Time",
									)}
								</Select.Item>
								<Select.Item value={SyncJudgeMode.MiddleKeyTime}>
									{t(
										"settings.common.syncJudgeModeOptions.middleKey",
										"Average of Key Down and Key Up Time",
									)}
								</Select.Item>
								<Select.Item value={SyncJudgeMode.FirstKeyDownTimeLegacy}>
									{t(
										"settings.common.syncJudgeModeOptions.firstKeyDownLegacy",
										"First Key Down Time (Legacy)",
									)}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</Flex>
				</Box>
			</Flex>
		</Card>

		<Card>
			<Flex gap="3" align="center">
				<Keyboard12324Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>
								{t(
									"settings.common.keyBindingTrigger",
									"Keybinding Trigger Timing",
								)}
							</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.keyBindingTriggerDesc",
									"Whether keybindings are triggered on key down or key up",
								)}
							</Text>
						</Flex>

						<Select.Root
							value={keyBindingTriggerMode}
							onValueChange={(v) =>
								setKeyBindingTriggerMode(v as KeyBindingTriggerMode)
							}
						>
							<Select.Trigger />
							<Select.Content>
								<Select.Item value={KeyBindingTriggerMode.KeyDown}>
									{t(
										"settings.common.keyBindingTriggerOptions.keyDown",
										"Trigger on Key Down",
									)}
								</Select.Item>
								<Select.Item value={KeyBindingTriggerMode.KeyUp}>
									{t(
										"settings.common.keyBindingTriggerOptions.keyUp",
										"Trigger on Key Up",
									)}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</Flex>
				</Box>
			</Flex>
		</Card>

		<Card>
			<Flex gap="3" align="center">
				<Timer24Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>
								{t(
									"settings.common.syncTimeOffset",
									"Global Sync Time Offset (ms)",
								)}
							</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.syncTimeOffsetDesc",
									"Adjust all sync timestamps by this amount to compensate for audio latency.",
								)}
							</Text>
						</Flex>
						<SyncOffsetControl />
					</Flex>
				</Box>
			</Flex>
		</Card>

		<Card>
			<Flex gap="3" align="center">
				<ArrowEnterLeft24Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>
								{t(
									"settings.common.syncCommitOffset",
									"Commit Input Offset (ms)",
								)}
							</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.syncCommitOffsetDesc",
									"Specific offset for the 'Commit' action to fix delayed audio issues.",
								)}
							</Text>
						</Flex>
						<SyncOffsetControl commit />
					</Flex>
				</Box>
			</Flex>
		</Card>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<PaddingLeft24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t("settings.common.smartFirstWord", "Smart First Word")}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.smartFirstWordDesc",
										"When syncing the first syllable of a line, pressing the Start trigger records its start time but not its end time.",
									)}
								</Text>
							</Flex>
							<Switch
								checked={smartFirstWord}
								onCheckedChange={setSmartFirstWord}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<PaddingRight24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t("settings.common.smartLastWord", "Smart Last Word")}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.smartLastWordDesc",
										"When syncing the last syllable of a line, pressing the End trigger records its end time without starting the next syllable.",
									)}
								</Text>
							</Flex>
							<Switch
								checked={smartLastWord}
								onCheckedChange={setSmartLastWord}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<CursorClick24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t(
										"settings.common.spectrogramHoverSync",
										"Sync to Spectrogram Cursor",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.spectrogramHoverSyncDesc",
										"When hovering over the spectrogram in Sync mode, trigger keys (F, G, H) record the hover position timestamp instead of the playback time.",
									)}
								</Text>
							</Flex>
							<SettingToggle setting={spectrogramHoverSyncEnabledAtom} />
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
	</Flex>
);

import {
	ArrowSortDownLines24Regular,
	ArrowSync24Regular,
	Highlight24Regular,
	Target24Regular,
	TextWrap24Regular,
} from "@fluentui/react-icons";
import {
	Box,
	Card,
	Flex,
	Heading,
	SegmentedControl,
	Switch,
	Text,
} from "@radix-ui/themes";
import {
	editActiveLineHighlightAtom,
	editAutoScrollAtom,
	syncActiveLineHighlightAtom,
	syncAutoScrollAtom,
} from "$/modules/settings/states/sync";
import { ToolMode } from "$/states/main";
import { SettingToggle } from "../../components/WorkflowControls";
import { WorkflowSettings } from "../workflow";
import type { CommonSettings } from "./useCommonSettings";
export const PlaybackBehaviorSection = ({
	syncWordWrap,
	setSyncWordWrap,
	syncFocusMainLine,
	setSyncFocusMainLine,
	playbackSettingsMode,
	setPlaybackSettingsMode,
	syncAutoScroll,
	syncTabPosition,
	setSyncTabPosition,
	t,
}: Pick<
	CommonSettings,
	| "syncWordWrap"
	| "setSyncWordWrap"
	| "syncFocusMainLine"
	| "setSyncFocusMainLine"
	| "playbackSettingsMode"
	| "setPlaybackSettingsMode"
	| "syncAutoScroll"
	| "syncTabPosition"
	| "setSyncTabPosition"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			{t("settings.group.syncWordWrap", "Time Mode / Sync Tab")}
		</Heading>
		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<TextWrap24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t("settings.common.syncWordWrap", "Wrap Words in Time Mode")}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.syncWordWrapDesc",
										"Wraps word cards to the next line instead of showing a horizontal scrollbar in Time / Sync tab.",
									)}
								</Text>
							</Flex>
							<Switch
								checked={syncWordWrap}
								onCheckedChange={setSyncWordWrap}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
		<Text weight="bold">
			{t("settings.common.playbackSettingsMode", "Playback behavior for")}
		</Text>
		<SegmentedControl.Root
			value={playbackSettingsMode}
			onValueChange={(value) =>
				setPlaybackSettingsMode(
					value === ToolMode.Edit ? ToolMode.Edit : ToolMode.Sync,
				)
			}
		>
			<SegmentedControl.Item value={ToolMode.Edit}>
				{t("settings.common.editMode", "Edit")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value={ToolMode.Sync}>
				{t("settings.common.timeMode", "Time")}
			</SegmentedControl.Item>
		</SegmentedControl.Root>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<ArrowSortDownLines24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t(
										"settings.common.syncAutoScroll",
										"Auto-Scroll to Active Line During Playback",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.syncAutoScrollDesc",
										"Automatically scrolls the editor view to follow the currently active lyric line during playback.",
									)}
								</Text>
							</Flex>
							<SettingToggle
								setting={
									playbackSettingsMode === ToolMode.Edit
										? editAutoScrollAtom
										: syncAutoScrollAtom
								}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
		<Card
			style={{
				opacity: syncAutoScroll ? 1 : 0.4,
				transition: "opacity 0.2s ease",
				pointerEvents: syncAutoScroll ? "auto" : "none",
			}}
		>
			<Text as="label">
				<Flex gap="3" align="center">
					<Target24Regular style={{ opacity: syncAutoScroll ? 1 : 0.5 }} />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text
									style={{
										color: syncAutoScroll ? undefined : "var(--gray-9)",
									}}
								>
									{t(
										"settings.common.syncFocusMainLine",
										"Focus Main Line During Playback",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.syncFocusMainLineDesc",
										"When playing back, focuses on active main lines and ignores background lines unless no main line is active.",
									)}
								</Text>
							</Flex>
							<Switch
								disabled={!syncAutoScroll}
								checked={syncFocusMainLine}
								onCheckedChange={setSyncFocusMainLine}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<Highlight24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t(
										"settings.common.highlightActiveLine",
										"Highlight Active Line During Playback",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.highlightActiveLineDesc",
										"Visually highlights the lyric line currently being played in the selected mode.",
									)}
								</Text>
							</Flex>
							<SettingToggle
								setting={
									playbackSettingsMode === ToolMode.Edit
										? editActiveLineHighlightAtom
										: syncActiveLineHighlightAtom
								}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<ArrowSync24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t(
										"settings.common.syncTabPosition",
										"Sync Position Across Tabs",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.syncTabPositionDesc",
										"Maintain song playback and center the active lyric line when switching between Edit, Time, and Preview tabs.",
									)}
								</Text>
							</Flex>
							<Switch
								checked={syncTabPosition}
								onCheckedChange={setSyncTabPosition}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
		<WorkflowSettings />
	</Flex>
);

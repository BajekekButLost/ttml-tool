import {
	History24Regular,
	Save24Regular,
	Stack24Regular,
} from "@fluentui/react-icons";
import {
	Box,
	Card,
	Flex,
	Heading,
	Slider,
	Switch,
	Text,
	TextField,
} from "@radix-ui/themes";
import type { CommonSettings } from "./useCommonSettings";
export const AutosaveSection = ({
	autosaveEnabled,
	setAutosaveEnabled,
	autosaveInterval,
	setAutosaveInterval,
	autosaveLimit,
	setAutosaveLimit,
	t,
}: Pick<
	CommonSettings,
	| "autosaveEnabled"
	| "setAutosaveEnabled"
	| "autosaveInterval"
	| "setAutosaveInterval"
	| "autosaveLimit"
	| "setAutosaveLimit"
	| "t"
>) => (
	<Flex direction="column" gap="2">
		<Heading size="4">{t("settings.group.autosave", "Auto Save")}</Heading>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<Save24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Text>
								{t("settings.common.autosave.enable", "Enable Auto Save")}
							</Text>
							<Switch
								checked={autosaveEnabled}
								onCheckedChange={setAutosaveEnabled}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>

		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<History24Regular />
					<Box flexGrow="1">
						<Flex direction="column" gap="2" align="start">
							<Text>
								{t(
									"settings.common.autosave.interval",
									"Save Interval (minutes)",
								)}
							</Text>
							<TextField.Root
								type="number"
								disabled={!autosaveEnabled}
								value={autosaveInterval}
								onChange={(e) =>
									setAutosaveInterval(
										Math.max(1, Number.parseInt(e.target.value, 10) || 1),
									)
								}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>

		<Card>
			<Flex gap="3" align="center">
				<Stack24Regular />
				<Box flexGrow="1">
					<Flex direction="column" gap="2" align="start">
						<Flex
							align="center"
							justify="between"
							style={{ alignSelf: "stretch" }}
						>
							<Text>
								{t("settings.common.autosave.limit", "Snapshots to keep")}
							</Text>
							<Text wrap="nowrap" color="gray" size="1">
								{autosaveLimit}
							</Text>
						</Flex>
						<Slider
							min={1}
							max={50}
							disabled={!autosaveEnabled}
							value={[autosaveLimit]}
							step={1}
							onValueChange={(v) => setAutosaveLimit(v[0])}
						/>
					</Flex>
				</Box>
			</Flex>
		</Card>
	</Flex>
);

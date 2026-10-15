import resources from "virtual:i18next-loader";
import {
	AppsListDetail24Regular,
	LocalLanguage24Regular,
	VideoBackgroundEffect24Regular,
} from "@fluentui/react-icons";
import {
	Box,
	Card,
	Flex,
	Heading,
	Link,
	Select,
	Switch,
	Text,
} from "@radix-ui/themes";
import { LayoutMode } from "$/modules/settings/states";
import { getLanguageName, getTranslationProgress } from "./language";
import type { CommonSettings } from "./useCommonSettings";
export const DisplaySection = ({
	languageOptions,
	layoutMode,
	setLayoutMode,
	compactBGInSync,
	setCompactBGInSync,
	t,
	i18n,
	currentLanguage,
}: Pick<
	CommonSettings,
	| "languageOptions"
	| "layoutMode"
	| "setLayoutMode"
	| "compactBGInSync"
	| "setCompactBGInSync"
	| "t"
	| "i18n"
	| "currentLanguage"
>) => (
	<Flex direction="column" gap="2">
		<Heading size="4">{t("settings.group.display", "Display")}</Heading>

		<Card>
			<Flex gap="3" align="center">
				<LocalLanguage24Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>{t("settings.common.language", "Interface language")}</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.languageDesc",
									"Select the language for the interface",
								)}
							</Text>
						</Flex>

						<Flex direction="column" gap="2" align="end">
							<Select.Root
								value={currentLanguage}
								onValueChange={(lng) => {
									i18n.changeLanguage(lng).then(() => {
										localStorage.setItem("language", lng);
									});
								}}
							>
								<Select.Trigger />
								<Select.Content>
									{languageOptions.map((code) => {
										const progress = getTranslationProgress(code, resources);
										return (
											<Select.Item key={code} value={code}>
												<Flex
													justify="between"
													gap="4"
													align="center"
													style={{ width: "100%" }}
												>
													<Text>{getLanguageName(code)}</Text>
													{code === "en-US" ? (
														<Text size="1" color="gray">
															(Source)
														</Text>
													) : (
														progress !== null && (
															<Text
																size="1"
																color={progress === 100 ? "green" : "gray"}
															>
																{progress}%
															</Text>
														)
													)}
												</Flex>
											</Select.Item>
										);
									})}
								</Select.Content>
							</Select.Root>
							<Link
								size="1"
								href="https://crowdin.com/project/very-cool-ttml-tool"
								target="_blank"
							>
								{t("settings.common.helpTranslate", "Help translate this app")}
							</Link>
						</Flex>
					</Flex>
				</Box>
			</Flex>
		</Card>

		<Card>
			<Flex gap="3" align="center">
				<AppsListDetail24Regular />
				<Box flexGrow="1">
					<Flex align="center" justify="between" gap="4">
						<Flex direction="column" gap="1">
							<Text>{t("settings.common.layoutMode", "Editor layout")}</Text>
							<Text size="1" color="gray">
								{t(
									"settings.common.layoutModeDesc.line1",
									"The simple layout covers most needs.",
								)}
								<br />
								{t(
									"settings.common.layoutModeDesc.line2",
									"Switch to the advanced layout for faster syncing.",
								)}
							</Text>
						</Flex>

						<Select.Root
							value={layoutMode}
							onValueChange={(v) => setLayoutMode(v as LayoutMode)}
						>
							<Select.Trigger />
							<Select.Content>
								<Select.Item value={LayoutMode.Simple}>
									{t("settings.common.layoutModeOptions.simple", "Simple")}
								</Select.Item>
								<Select.Item value={LayoutMode.Advance}>
									{t("settings.common.layoutModeOptions.advance", "Advanced")}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</Flex>
				</Box>
			</Flex>
		</Card>
		<Card>
			<Text as="label">
				<Flex gap="3" align="center">
					<VideoBackgroundEffect24Regular />
					<Box flexGrow="1">
						<Flex gap="2" align="center" justify="between">
							<Flex direction="column" gap="1">
								<Text>
									{t(
										"settings.common.compactBGInSync",
										"Compact background lines in Time mode",
									)}
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.common.compactBGInSyncDesc",
										"Use less vertical space for background lines while syncing.",
									)}
								</Text>
							</Flex>
							<Switch
								checked={compactBGInSync}
								onCheckedChange={setCompactBGInSync}
							/>
						</Flex>
					</Box>
				</Flex>
			</Text>
		</Card>
	</Flex>
);

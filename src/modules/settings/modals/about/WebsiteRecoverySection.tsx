import {
	AlertDialog,
	Button,
	Card,
	Flex,
	Heading,
	Text,
} from "@radix-ui/themes";
import type { AboutSettings } from "./useAboutSettings";
export const WebsiteRecoverySection = ({
	t,
	cacheConfirmationOpen,
	setCacheConfirmationOpen,
	recoveryAction,
	isWebsite,
	handleForceRefresh,
	handleClearCache,
}: Pick<
	AboutSettings,
	| "t"
	| "cacheConfirmationOpen"
	| "setCacheConfirmationOpen"
	| "recoveryAction"
	| "isWebsite"
	| "handleForceRefresh"
	| "handleClearCache"
>) => (
	<>
		{isWebsite && (
			<Card>
				<Flex direction="column" gap="3">
					<Heading size="3">
						{t("settings.about.websiteUpdate", "Website update")}
					</Heading>
					<Text size="2" color="gray">
						{t(
							"settings.about.websiteUpdateDescription",
							"Reload the website to get the latest version.",
						)}
					</Text>
					<Flex gap="3" wrap="wrap">
						<Button
							onClick={handleForceRefresh}
							disabled={recoveryAction !== null}
						>
							{t("settings.about.forceRefresh", "Force refresh")}
						</Button>
						<Button
							variant="soft"
							color="red"
							onClick={() => setCacheConfirmationOpen(true)}
							disabled={recoveryAction !== null}
						>
							{t(
								"settings.about.clearWebsiteCache",
								"Clear cached website data",
							)}
						</Button>
					</Flex>
				</Flex>
			</Card>
		)}

		<AlertDialog.Root
			open={cacheConfirmationOpen}
			onOpenChange={setCacheConfirmationOpen}
		>
			<AlertDialog.Content maxWidth="420px">
				<AlertDialog.Title>
					{t(
						"settings.about.clearWebsiteCacheTitle",
						"Clear cached website data?",
					)}
				</AlertDialog.Title>
				<AlertDialog.Description size="2">
					{t(
						"settings.about.clearWebsiteCacheDescription",
						"This removes offline website files and reloads the page. Your saved projects and preferences will not be deleted.",
					)}
				</AlertDialog.Description>
				<Flex gap="3" mt="4" justify="end">
					<AlertDialog.Cancel>
						<Button
							variant="soft"
							color="gray"
							disabled={recoveryAction !== null}
						>
							{t("common.cancel", "Cancel")}
						</Button>
					</AlertDialog.Cancel>
					<AlertDialog.Action>
						<Button
							color="red"
							onClick={handleClearCache}
							disabled={recoveryAction !== null}
						>
							{t(
								"settings.about.clearWebsiteCache",
								"Clear cached website data",
							)}
						</Button>
					</AlertDialog.Action>
				</Flex>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</>
);

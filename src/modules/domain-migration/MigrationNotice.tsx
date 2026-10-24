import { ArrowDownload24Regular } from "@fluentui/react-icons";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type BackupCounts,
	exportBackup,
	getBackupCounts,
} from "$/modules/settings/backup/export";
import { BACKUP_CATEGORY_IDS } from "$/modules/settings/backup/types";
import {
	classifyMigrationOrigin,
	MIGRATION_COMPLETED_KEY,
	MIGRATION_SEND_PATH,
	OFFICIAL_TOOL_ORIGIN,
} from "./config";

export function MigrationNotice() {
	const { t } = useTranslation();
	const shouldShow =
		classifyMigrationOrigin(
			window.location.origin,
			Boolean(import.meta.env.TAURI_ENV_PLATFORM),
		) === "legacy" && !localStorage.getItem(MIGRATION_COMPLETED_KEY);
	const [open, setOpen] = useState(shouldShow);
	const [counts, setCounts] = useState<BackupCounts | null>(null);
	const [exporting, setExporting] = useState(false);

	useEffect(() => {
		if (shouldShow)
			void getBackupCounts()
				.then(setCounts)
				.catch(() => setCounts(null));
	}, [shouldShow]);

	if (!shouldShow) return null;

	return (
		<Dialog.Root open={open} onOpenChange={() => undefined}>
			<Dialog.Content maxWidth="540px">
				<Dialog.Title>
					{t("domainMigration.notice.title", "The TTML Tool has a new address")}
				</Dialog.Title>
				<Dialog.Description>
					{t(
						"domainMigration.notice.description",
						"Move your projects and settings there now. This address will start redirecting soon, and browser data can't follow a redirect.",
					)}
				</Dialog.Description>
				<Flex direction="column" gap="3" mt="4">
					<Text size="2" weight="bold">
						{OFFICIAL_TOOL_ORIGIN}
					</Text>
					{counts && (
						<Text size="2" color="gray">
							{t("domainMigration.notice.counts", {
								defaultValue:
									"Found {projects, plural, one {# project} other {# projects}} and {settings, plural, one {# setting} other {# settings}} on this address.",
								projects: counts.projects,
								settings: counts.settings,
							})}
						</Text>
					)}
					<Flex gap="2" wrap="wrap" justify="end">
						<Button
							variant="soft"
							color="gray"
							disabled={exporting}
							onClick={() => {
								setExporting(true);
								void exportBackup(new Set(BACKUP_CATEGORY_IDS)).finally(() =>
									setExporting(false),
								);
							}}
						>
							<ArrowDownload24Regular />
							{t("domainMigration.notice.backup", "Download backup")}
						</Button>
						<Button variant="soft" color="gray" onClick={() => setOpen(false)}>
							{t("domainMigration.notice.later", "Later")}
						</Button>
						<Button onClick={() => window.location.assign(MIGRATION_SEND_PATH)}>
							{t("domainMigration.notice.move", "Move my data")}
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}

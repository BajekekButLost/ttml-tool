import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import { ExportSection } from "./backup/ExportSection";
import { ImportSection } from "./backup/ImportSection";
import { useBackupSettings } from "./backup/useBackupSettings";
export const SettingsBackupTab = memo(() => {
	const state = useBackupSettings();
	return (
		<Flex direction="column" gap="4">
			<ExportSection {...state} />
			<ImportSection {...state} />
		</Flex>
	);
});

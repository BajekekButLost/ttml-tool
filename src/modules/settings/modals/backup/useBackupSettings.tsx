import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
	type BackupAssetsCounts,
	countsFromParts,
	exportBackup,
} from "$/modules/settings/backup/export";
import {
	applyBackup,
	describeBackup,
	getPresentCategories,
	parseBackupFile,
} from "$/modules/settings/backup/import";
import {
	type ExportPreviewLabels,
	type ExportPreviewParts,
	loadExportParts,
	summarizeExportParts,
} from "$/modules/settings/backup/preview";
import {
	BACKUP_CATEGORY_IDS,
	type BackupCategoryId,
	type BackupFile,
	BackupValidationError,
} from "$/modules/settings/backup/types";

const ALL_CATEGORIES = new Set<BackupCategoryId>(BACKUP_CATEGORY_IDS);
function useCategoryLabels() {
	const { t } = useTranslation();
	return {
		settings: t("settings.backup.category.settings", "Settings"),
		keybindings: t("settings.backup.category.keybindings", "Shortcuts"),
		assets: t("settings.backup.category.assets", "Appearance assets"),
		projects: t("settings.backup.category.projects", "Projects & history"),
		apiKeys: t("settings.backup.category.apiKeys", "API keys"),
	} satisfies Record<BackupCategoryId, string>;
}
export function useBackupSettings() {
	const { t } = useTranslation();
	const labels = useCategoryLabels();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [exportParts, setExportParts] = useState<ExportPreviewParts | null>(
		null,
	);
	const [exportSelected, setExportSelected] = useState<Set<BackupCategoryId>>(
		() => new Set(BACKUP_CATEGORY_IDS.filter((id) => id !== "apiKeys")),
	);
	const [exporting, setExporting] = useState(false);
	const [expanded, setExpanded] = useState<Set<BackupCategoryId>>(
		() => new Set(),
	);
	const [previewLoading, setPreviewLoading] = useState(true);
	const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);
	const [importSelected, setImportSelected] = useState<Set<BackupCategoryId>>(
		() => new Set(),
	);
	const [importing, setImporting] = useState(false);
	useEffect(() => {
		let cancelled = false;
		loadExportParts(ALL_CATEGORIES)
			.then((next) => {
				if (!cancelled) setExportParts(next);
			})
			.catch(() => {
				if (!cancelled) setExportParts(null);
			})
			.finally(() => {
				if (!cancelled) setPreviewLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	const counts = useMemo(
		() => (exportParts ? countsFromParts(exportParts) : null),
		[exportParts],
	);
	const previewLabels = useMemo<ExportPreviewLabels>(
		() => ({
			preset: t("settings.backup.previewPresetPrefix", "Preset"),
			customFont: t("settings.backup.previewFontPrefix", "Custom font"),
			versions: (count) =>
				t(
					"settings.backup.previewVersions",
					"{count, plural, one {# version} other {# versions}}",
					{ count },
				),
		}),
		[t],
	);
	const preview = useMemo(
		() =>
			exportParts
				? summarizeExportParts(exportParts, ALL_CATEGORIES, previewLabels)
				: null,
		[exportParts, previewLabels],
	);
	const toggle = useCallback(
		(
			setter: React.Dispatch<React.SetStateAction<Set<BackupCategoryId>>>,
			id: BackupCategoryId,
			checked: boolean,
		) => {
			setter((prev) => {
				const next = new Set(prev);
				if (checked) next.add(id);
				else next.delete(id);
				return next;
			});
		},
		[],
	);
	const formatAssetsHint = useCallback(
		(assets: BackupAssetsCounts): string => {
			const parts: string[] = [];
			if (assets.presets > 0) {
				parts.push(
					t(
						"settings.backup.hint.presetsCount",
						"{count, plural, one {# preset} other {# presets}}",
						{
							count: assets.presets,
						},
					),
				);
			}
			if (assets.background) {
				parts.push(
					t("settings.backup.hint.backgroundSet", "Custom background"),
				);
			}
			if (assets.font) {
				parts.push(t("settings.backup.hint.fontSet", "Custom font"));
			}
			if (parts.length > 0) {
				return parts.join(" • ");
			}
			return t("settings.backup.hint.assetsNone", "No custom assets");
		},
		[t],
	);
	const exportHint = useCallback(
		(id: BackupCategoryId): string => {
			if (!counts) return "";
			switch (id) {
				case "settings":
					return t(
						"settings.backup.hint.settings",
						"{count, plural, one {# stored value} other {# stored values}}",
						{
							count: counts.settings,
						},
					);
				case "keybindings":
					return t(
						"settings.backup.hint.keybindings",
						"{count, plural, one {# shortcut} other {# shortcuts}}",
						{
							count: counts.keybindings,
						},
					);
				case "assets":
					return formatAssetsHint(counts.assets);
				case "projects":
					return t(
						"settings.backup.hint.projects",
						"{count, plural, one {# project} other {# projects}}",
						{
							count: counts.projects,
						},
					);
				case "apiKeys":
					return t(
						"settings.backup.hint.apiKeys",
						"{count, plural, one {# key} other {# keys}}",
						{
							count: counts.apiKeys,
						},
					);
			}
		},
		[counts, formatAssetsHint, t],
	);
	const handleExport = useCallback(async () => {
		if (exportSelected.size === 0) return;
		setExporting(true);
		try {
			const name = await exportBackup(exportSelected);
			if (name !== null) {
				toast.success(t("settings.backup.exportSuccess", "Backup exported"));
			}
		} catch {
			toast.error(t("settings.backup.exportFailed", "Failed to export backup"));
		} finally {
			setExporting(false);
		}
	}, [exportSelected, t]);
	const handleFilePicked = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			e.target.value = "";
			if (!file) return;
			try {
				const parsed = parseBackupFile(await file.text());
				const present = getPresentCategories(parsed);
				setPendingImport(parsed);
				setImportSelected(new Set(present.filter((id) => id !== "apiKeys")));
			} catch (err) {
				if (
					err instanceof BackupValidationError &&
					err.reason === "newerVersion"
				) {
					toast.error(
						t(
							"settings.backup.newerVersion",
							"This backup was created by a newer version of the app",
						),
					);
				} else {
					toast.error(
						t(
							"settings.backup.invalidFile",
							"Invalid or corrupted backup file",
						),
					);
				}
			}
		},
		[t],
	);
	const handleApplyImport = useCallback(async () => {
		if (!pendingImport || importSelected.size === 0) return;
		setImporting(true);
		try {
			await applyBackup(pendingImport, importSelected);
			toast.success(
				t("settings.backup.importSuccess", "Backup imported, reloading…"),
			);
			window.location.reload();
		} catch {
			setImporting(false);
			toast.error(
				t(
					"settings.backup.importFailed",
					"Failed to import backup. Some data may have been partially applied.",
				),
			);
		}
	}, [pendingImport, importSelected, t]);
	const importDescription = pendingImport ? describeBackup(pendingImport) : {};
	const importHint = (id: BackupCategoryId): string => {
		const value = importDescription[id];
		if (value === undefined) return "";
		if (id === "assets") {
			if (typeof value === "object" && value !== null) {
				return formatAssetsHint(value as BackupAssetsCounts);
			}
			return value
				? t("settings.backup.hint.backgroundSet", "Custom background")
				: t("settings.backup.hint.assetsNone", "No custom assets");
		}
		return String(value);
	};
	return {
		t,
		labels,
		fileInputRef,
		exportParts,
		setExportParts,
		exportSelected,
		setExportSelected,
		exporting,
		setExporting,
		expanded,
		setExpanded,
		previewLoading,
		setPreviewLoading,
		pendingImport,
		setPendingImport,
		importSelected,
		setImportSelected,
		importing,
		setImporting,
		counts,
		previewLabels,
		preview,
		toggle,
		formatAssetsHint,
		exportHint,
		handleExport,
		handleFilePicked,
		handleApplyImport,
		importDescription,
		importHint,
	};
}
export type BackupSettings = ReturnType<typeof useBackupSettings>;

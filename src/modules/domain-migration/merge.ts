import type { BackupFile } from "$/modules/settings/backup/types";

type Assets = NonNullable<BackupFile["categories"]["assets"]>;

export type MigrationConflictSummary = {
	settings: string[];
	keybindings: string[];
	apiKeys: string[];
	projects: string[];
	appearance: boolean;
};

export type MigrationMergeChoices = {
	replaceSettings: boolean;
	replaceKeybindings: boolean;
	replaceApiKeys: boolean;
	replaceAppearance: boolean;
};

const differentEntries = (
	source: Record<string, string> = {},
	destination: Record<string, string> = {},
) =>
	Object.keys(source).filter(
		(key) => key in destination && source[key] !== destination[key],
	);

const hasAppearance = (assets: Assets | undefined) =>
	Boolean(
		assets &&
			(assets.backgroundImage ||
				assets.appearancePresets?.length ||
				assets.customFont),
	);

export function getMigrationConflicts(
	source: BackupFile,
	destination: BackupFile,
): MigrationConflictSummary {
	const sourceProjects = source.categories.projects?.projects ?? [];
	const destinationProjects = new Set(
		(destination.categories.projects?.projects ?? []).map(
			(project) => project.id,
		),
	);

	return {
		settings: differentEntries(
			source.categories.settings?.localStorage,
			destination.categories.settings?.localStorage,
		),
		keybindings: differentEntries(
			source.categories.keybindings?.localStorage,
			destination.categories.keybindings?.localStorage,
		),
		apiKeys: differentEntries(
			source.categories.apiKeys?.localStorage,
			destination.categories.apiKeys?.localStorage,
		),
		projects: sourceProjects
			.filter((project) => destinationProjects.has(project.id))
			.map((project) => project.id),
		appearance:
			hasAppearance(source.categories.assets) &&
			hasAppearance(destination.categories.assets),
	};
}

export function hasMigrationConflicts(conflicts: MigrationConflictSummary) {
	return (
		conflicts.settings.length > 0 ||
		conflicts.keybindings.length > 0 ||
		conflicts.apiKeys.length > 0 ||
		conflicts.projects.length > 0 ||
		conflicts.appearance
	);
}

function mergeAssets(
	source: Assets | undefined,
	destination: Assets | undefined,
	preferSource: boolean,
): Assets | undefined {
	if (!source && !destination) return undefined;
	const [preferred, other] = preferSource
		? [source, destination]
		: [destination, source];
	const presets = preferred?.appearancePresets?.length
		? preferred.appearancePresets
		: other?.appearancePresets;
	const customFont = preferred?.customFont ?? other?.customFont;
	return {
		backgroundImage:
			preferred?.backgroundImage ?? other?.backgroundImage ?? null,
		...(presets?.length ? { appearancePresets: presets } : {}),
		...(customFont ? { customFont } : {}),
	};
}

export function mergeMigrationBackup(
	source: BackupFile,
	destination: BackupFile,
	choices: MigrationMergeChoices,
): BackupFile {
	const destinationProjects = destination.categories.projects?.projects ?? [];
	const sourceProjects = source.categories.projects?.projects ?? [];
	const projectMap = new Map(
		destinationProjects.map((project) => [project.id, project]),
	);
	for (const sourceProject of sourceProjects) {
		const current = projectMap.get(sourceProject.id);
		if (!current || sourceProject.lastModified >= current.lastModified)
			projectMap.set(sourceProject.id, sourceProject);
	}
	const sourceChosenProjectIds = new Set(
		sourceProjects
			.filter((project) => projectMap.get(project.id) === project)
			.map((project) => project.id),
	);
	const destinationVersions = destination.categories.projects?.versions ?? [];
	const sourceVersions = source.categories.projects?.versions ?? [];
	const mergedVersions = [
		...destinationVersions.filter(
			(version) => !sourceChosenProjectIds.has(version.projectId),
		),
		...sourceVersions.filter((version) =>
			sourceChosenProjectIds.has(version.projectId),
		),
	];

	const mergeEntries = (
		destinationEntries: Record<string, string> = {},
		sourceEntries: Record<string, string> = {},
		replace: boolean,
	) =>
		replace
			? { ...destinationEntries, ...sourceEntries }
			: { ...sourceEntries, ...destinationEntries };

	const assets = mergeAssets(
		source.categories.assets,
		destination.categories.assets,
		choices.replaceAppearance,
	);

	return {
		...source,
		categories: {
			settings: {
				localStorage: mergeEntries(
					destination.categories.settings?.localStorage,
					source.categories.settings?.localStorage,
					choices.replaceSettings,
				),
			},
			keybindings: {
				localStorage: mergeEntries(
					destination.categories.keybindings?.localStorage,
					source.categories.keybindings?.localStorage,
					choices.replaceKeybindings,
				),
			},
			apiKeys: {
				localStorage: mergeEntries(
					destination.categories.apiKeys?.localStorage,
					source.categories.apiKeys?.localStorage,
					choices.replaceApiKeys,
				),
			},
			...(assets ? { assets } : {}),
			projects: {
				projects: [...projectMap.values()],
				versions: mergedVersions,
			},
		},
	};
}

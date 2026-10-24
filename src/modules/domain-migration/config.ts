// The web tool moves from tool.community.spicylyrics.org to tool.spicylyrics.org.
// Browser storage is per-origin, so the old address hands its data to the new one
// before it becomes a redirect. The env overrides exist for local two-origin tests.
export const OFFICIAL_TOOL_ORIGIN: string =
	import.meta.env.VITE_MIGRATION_OFFICIAL_ORIGIN ||
	"https://tool.spicylyrics.org";

export const LEGACY_TOOL_ORIGINS: readonly string[] = import.meta.env
	.VITE_MIGRATION_LEGACY_ORIGIN
	? [import.meta.env.VITE_MIGRATION_LEGACY_ORIGIN]
	: ["https://tool.community.spicylyrics.org"];

export const MIGRATION_COMPLETED_KEY = "domainMigrationCompleted:v2";
export const MIGRATION_PROTOCOL_VERSION = 2;
export const MIGRATION_CHUNK_SIZE = 1024 * 1024;

// Flat paths, so the page's relative asset URLs still resolve to /assets.
export const MIGRATION_SEND_PATH = "/migration-send";
export const MIGRATION_RECEIVE_PATH = "/migration-receive";

export type MigrationHostKind = "official" | "legacy" | "other";

export function classifyMigrationOrigin(
	origin: string,
	isTauri = false,
): MigrationHostKind {
	if (isTauri) return "other";
	if (origin === OFFICIAL_TOOL_ORIGIN) return "official";
	if (LEGACY_TOOL_ORIGINS.includes(origin)) return "legacy";
	return "other";
}

export function isMigrationPath(pathname: string) {
	return (
		pathname === MIGRATION_SEND_PATH || pathname === MIGRATION_RECEIVE_PATH
	);
}

export function createMigrationNonce() {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

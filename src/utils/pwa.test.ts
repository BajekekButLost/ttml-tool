import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearWebsiteCache, forceWebsiteRefresh } = await import("./pwa");

describe("website service worker removal", () => {
	const reload = vi.fn();
	const getRegistrations =
		vi.fn<() => Promise<{ unregister: () => Promise<boolean> }[]>>();

	beforeEach(() => {
		vi.clearAllMocks();
		getRegistrations.mockReset();
		getRegistrations.mockResolvedValue([]);
		const cacheStorage = {
			keys: vi.fn().mockResolvedValue([]),
			delete: vi.fn(),
		};
		vi.stubGlobal("window", {
			location: { reload },
			caches: cacheStorage,
		});
		vi.stubGlobal("navigator", {
			serviceWorker: { getRegistrations },
		});
		vi.stubGlobal("caches", cacheStorage);
	});

	it("drops a leftover offline worker before force-refreshing", async () => {
		const unregister = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
		getRegistrations.mockResolvedValue([{ unregister }]);

		await expect(forceWebsiteRefresh()).resolves.toBe(true);

		expect(unregister).toHaveBeenCalledOnce();
		expect(reload).toHaveBeenCalledOnce();
	});

	it("unregisters service workers and removes Cache Storage before reloading", async () => {
		const unregister = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
		getRegistrations.mockResolvedValue([{ unregister }]);
		vi.mocked(caches.keys).mockResolvedValue(["workbox-precache", "runtime"]);

		await expect(clearWebsiteCache()).resolves.toBe(true);

		expect(unregister).toHaveBeenCalledOnce();
		expect(caches.delete).toHaveBeenCalledTimes(2);
		expect(reload).toHaveBeenCalledOnce();
	});

	it("does nothing when browser cache APIs are unavailable", async () => {
		vi.stubGlobal("navigator", {});

		await expect(clearWebsiteCache()).resolves.toBe(false);

		expect(reload).not.toHaveBeenCalled();
	});
});

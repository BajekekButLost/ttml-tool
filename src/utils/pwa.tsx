const isWebsite = !import.meta.env.TAURI_ENV_PLATFORM;

const reloadPage = () => window.location.reload();

/**
 * Unregister any service worker and delete its caches. The website used to
 * ship an offline worker; old installs get a self-destroying sw.js on their
 * next update check, and this covers the page side.
 */
async function removeServiceWorkers() {
	if (!("serviceWorker" in navigator)) return false;
	const [registrations, cacheNames] = await Promise.all([
		navigator.serviceWorker.getRegistrations(),
		"caches" in window ? caches.keys() : Promise.resolve([]),
	]);
	await Promise.all([
		...registrations.map((registration) => registration.unregister()),
		...cacheNames.map((cacheName) => caches.delete(cacheName)),
	]);
	return registrations.length > 0 || cacheNames.length > 0;
}

if (isWebsite) {
	void removeServiceWorkers().catch(() => undefined);
}

/** Reload the website, dropping any leftover service worker first. */
export async function forceWebsiteRefresh() {
	if (!isWebsite) {
		return false;
	}
	await removeServiceWorkers().catch(() => undefined);
	reloadPage();
	return true;
}

/** Remove this site's service worker and Cache Storage data before reloading. */
export async function clearWebsiteCache() {
	if (!isWebsite || !("serviceWorker" in navigator)) {
		return false;
	}
	await removeServiceWorkers();
	reloadPage();
	return true;
}

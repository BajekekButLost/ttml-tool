export const getLanguageName = (code: string) => {
	try {
		interface DisplayNamesLike {
			new (
				locales: string | string[],
				options: { type: string },
			): {
				of: (code: string) => string | undefined;
			};
		}
		const DN: DisplayNamesLike | undefined = (
			Intl as unknown as {
				DisplayNames?: DisplayNamesLike;
			}
		).DisplayNames;
		if (DN) {
			const nativeDn = new DN([code], { type: "language" });
			const nativeName = nativeDn.of(code) || code;
			// Capitalize first letter (e.g., français -> Français)
			return nativeName.charAt(0).toUpperCase() + nativeName.slice(1);
		}
	} catch {
		// ignore errors and fallback
	}
	return code;
};
export const getTranslationProgress = (
	code: string,
	translations: Record<string, { translation?: Record<string, unknown> }>,
) => {
	const source = translations["en-US"]?.translation;
	const target = translations[code]?.translation;
	if (!source || !target || code === "en-US") return null;

	const countKeys = (obj: Record<string, unknown>): number => {
		let count = 0;
		for (const key in obj) {
			if (typeof obj[key] === "object") {
				count += countKeys(obj[key] as Record<string, unknown>);
			} else {
				count++;
			}
		}
		return count;
	};

	const countTranslatedKeys = (
		s: Record<string, unknown>,
		t: Record<string, unknown>,
	): number => {
		let count = 0;
		for (const key in s) {
			if (t[key] !== undefined) {
				if (typeof s[key] === "object") {
					count += countTranslatedKeys(
						s[key] as Record<string, unknown>,
						t[key] as Record<string, unknown>,
					);
				} else if (t[key] !== s[key] && t[key] !== "") {
					// Only count as translated if it's different from English and not empty
					count++;
				}
			}
		}
		return count;
	};

	const total = countKeys(source);
	const translated = countTranslatedKeys(source, target);
	return Math.floor((translated / total) * 100);
};

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function flattenStrings(catalog, prefix = "") {
	if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
		throw new Error(`${prefix || "catalog"}: expected an object`);
	}
	const strings = {};
	for (const [key, value] of Object.entries(catalog)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") strings[path] = value;
		else Object.assign(strings, flattenStrings(value, path));
	}
	return strings;
}

// Read message structure, rather than treating plural branch text as arguments.
// Plural categories may differ by language; argument names and types may not.
export function placeholders(message, locale = "en-US") {
	const tokens = [...message.matchAll(/<\/?\d+>/g)].map(([tag]) => tag);
	let position = 0;
	const whitespace = () => {
		while (/\s/.test(message[position] ?? "") && position < message.length) {
			position++;
		}
	};
	const identifier = () => {
		const match = /^[\w.-]+/.exec(message.slice(position));
		if (!match) throw new Error(`Invalid argument at ${position}`);
		position += match[0].length;
		return match[0];
	};
	const expect = (character) => {
		whitespace();
		if (message[position++] !== character) {
			throw new Error(`Expected ${character} at ${position - 1}`);
		}
	};
	const text = (nested = false) => {
		while (position < message.length) {
			const character = message[position++];
			if (character === "}") {
				if (nested) return;
				throw new Error("Unexpected closing brace");
			}
			if (character === "'" && /[{}#']/.test(message[position] ?? "")) {
				// ICU doubles apostrophes, and quotes syntax characters.
				if (message[position] === "'") position++;
				else {
					while (position < message.length) {
						if (message[position++] !== "'") continue;
						if (message[position] !== "'") break;
						position++;
					}
				}
			}
			if (character !== "{") continue;
			if (message[position] === "{") {
				const end = message.indexOf("}}", ++position);
				if (end < 0) throw new Error("Unclosed interpolation");
				tokens.push(`double:${message.slice(position, end).trim()}`);
				position = end + 2;
				continue;
			}
			whitespace();
			const name = identifier();
			whitespace();
			if (message[position] === "}") {
				position++;
				tokens.push(`single:${name}`);
				continue;
			}
			expect(",");
			whitespace();
			const type = identifier();
			tokens.push(`icu:${name}:${type}`);
			whitespace();
			if (!["plural", "selectordinal", "select"].includes(type)) {
				const end = message.indexOf("}", position);
				if (end < 0) throw new Error("Unclosed formatted argument");
				position = end + 1;
				continue;
			}
			expect(",");
			whitespace();
			const offset = /^offset\s*:\s*\d+\s*/.exec(message.slice(position));
			if (offset) position += offset[0].length;
			const categories = new Set();
			while (position < message.length && message[position] !== "}") {
				whitespace();
				const exact = /^=\d+/.exec(message.slice(position));
				const category = exact ? exact[0] : identifier();
				if (exact) position += exact[0].length;
				if (categories.has(category)) throw new Error("Duplicate ICU branch");
				categories.add(category);
				expect("{");
				text(true);
				whitespace();
			}
			expect("}");
			const required =
				type === "select"
					? ["other"]
					: new Intl.PluralRules(locale, {
							type: type === "selectordinal" ? "ordinal" : "cardinal",
						}).resolvedOptions().pluralCategories;
			for (const category of required) {
				if (!categories.has(category)) {
					throw new Error(`Missing ICU ${category} branch for ${locale}`);
				}
			}
		}
		if (nested) throw new Error("Unclosed ICU branch");
	};
	text();
	return tokens.sort();
}

export function checkLocale(source, target, locale) {
	const english = flattenStrings(source);
	const translated = flattenStrings(target);
	const errors = [];
	for (const key of Object.keys(translated)) {
		if (!(key in english)) errors.push(`${locale}: extra key ${key}`);
	}
	for (const [key, value] of Object.entries(english)) {
		if (!(key in translated)) {
			errors.push(`${locale}: missing key ${key}`);
			continue;
		}
		if (value.trim() && !translated[key].trim()) {
			errors.push(`${locale}: empty translation ${key}`);
		}
		try {
			const expected = placeholders(value);
			const actual = placeholders(translated[key], locale)
				.map((token) => {
					// A translated count can gain grammatical plural branches while
					// retaining the same interpolation input as the English {count}.
					const plural = /^icu:(.+):plural$/.exec(token);
					return plural && expected.includes(`single:${plural[1]}`)
						? `single:${plural[1]}`
						: token;
				})
				.sort();
			if (JSON.stringify(expected) !== JSON.stringify(actual)) {
				errors.push(
					`${locale}: ${key}: placeholders differ (${expected} / ${actual})`,
				);
			}
		} catch (error) {
			errors.push(`${locale}: ${key}: ${error.message}`);
		}
	}
	if (
		errors.length === 0 &&
		JSON.stringify(Object.keys(english)) !==
			JSON.stringify(Object.keys(translated))
	) {
		errors.push(`${locale}: key order differs from en-US`);
	}
	return errors;
}

export function checkLocales(root) {
	const read = (locale) =>
		JSON.parse(readFileSync(resolve(root, locale, "translation.json"), "utf8"));
	const source = read("en-US");
	const locales = readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
	return {
		locales,
		errors: locales.flatMap((locale) =>
			checkLocale(source, read(locale), locale),
		),
	};
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const root = fileURLToPath(new URL("../src/i18n/locales", import.meta.url));
	const { locales, errors } = checkLocales(root);
	if (errors.length) {
		console.error(errors.join("\n"));
		process.exitCode = 1;
	} else {
		console.log(
			`Locale check passed: ${locales.length} catalogs, matching keys, order and placeholders.`,
		);
	}
}

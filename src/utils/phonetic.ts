import { Romanize } from "hangul-romanize";
import { pinyin as getPinyin } from "pinyin-pro";
import * as wanakana from "wanakana";
import { graphemes, preservesSource } from "./graphemes";
import { splitJapaneseRun } from "./japanese";

export type PhoneticLanguage = "ja" | "zh" | "ko" | "yue" | "auto";

export interface PhoneticSpan {
	text: string;
	start: number;
	end: number;
	reading: string;
	warning: boolean;
}

interface PhoneticConversion {
	value: string;
	cacheable: boolean;
}

const phoneticCache = new Map<string, Promise<PhoneticConversion>>();
const spanRequests = new Map<string, Promise<PhoneticSpan[]>>();
const googleRequestQueue: Array<() => void> = [];
let activeGoogleRequests = 0;

const withGoogleRequestSlot = async <T>(request: () => Promise<T>) => {
	if (activeGoogleRequests >= 4)
		await new Promise<void>((resolve) => googleRequestQueue.push(resolve));
	activeGoogleRequests++;
	try {
		return await request();
	} finally {
		activeGoogleRequests--;
		googleRequestQueue.shift()?.();
	}
};

export const formatPhoneticForDisplay = (text: string) =>
	text.toLocaleLowerCase().replace(/\s+/g, "");

export const buildLineRomanization = (
	capsules: string[],
	romanizations: string[],
) =>
	capsules
		.map((capsule, index) => romanizations[index] || capsule)
		.join("")
		.toLocaleLowerCase();

const hasSourceScript = (text: string, language: PhoneticLanguage) => {
	switch (language) {
		case "ja":
			return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
				text,
			);
		case "zh":
		case "yue":
			return /\p{Script=Han}/u.test(text);
		case "ko":
			return /\p{Script=Hangul}/u.test(text);
		default:
			return false;
	}
};

export function detectPhoneticLanguage(
	text: string,
	declared?: string,
): PhoneticLanguage {
	const language = declared?.toLowerCase().split(/[-_]/)[0];
	if (
		language === "ja" ||
		language === "zh" ||
		language === "ko" ||
		language === "yue"
	)
		return language;
	if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return "ja";
	if (/\p{Script=Hangul}/u.test(text)) return "ko";
	if (/\p{Script=Han}/u.test(text)) return "zh";
	return "auto";
}

export async function getPhonetic(
	text: string,
	lang: PhoneticLanguage = "auto",
	preserveFormatting = false,
): Promise<string> {
	const detected = lang === "auto" ? detectPhoneticLanguage(text) : lang;
	if (!text.trim() || detected === "auto" || !hasSourceScript(text, detected))
		return "";
	const key = `${detected}\u0000${text}`;
	let request = phoneticCache.get(key);
	if (!request) {
		request = convertPhonetic(text, detected);
		phoneticCache.set(key, request);
		if (phoneticCache.size > 2048) {
			const oldest = phoneticCache.keys().next().value;
			if (oldest !== undefined) phoneticCache.delete(oldest);
		}
	}
	try {
		const result = await request;
		if (!result.cacheable) phoneticCache.delete(key);
		return preserveFormatting
			? result.value
			: formatPhoneticForDisplay(result.value);
	} catch (error) {
		phoneticCache.delete(key);
		console.error("Phonetic conversion failed", error);
		return "";
	}
}

async function convertPhonetic(
	text: string,
	language: Exclude<PhoneticLanguage, "auto">,
): Promise<PhoneticConversion> {
	if (language === "ja" && !/\p{Script=Han}/u.test(text))
		return {
			value: wanakana.toRomaji(text.normalize("NFKC")),
			cacheable: true,
		};
	if (language === "ko")
		return { value: Romanize.from(text.normalize("NFC")), cacheable: true };
	if (language === "zh")
		return {
			value: getPinyin(text, { toneType: "symbol", traditional: true }),
			cacheable: true,
		};
	try {
		const value = await withGoogleRequestSlot(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);
			try {
				const response = await fetch(
					`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${language}&tl=en&dt=rm&q=${encodeURIComponent(text)}`,
					{ signal: controller.signal },
				);
				if (!response.ok)
					throw new Error(`Transliteration request failed: ${response.status}`);
				const data: unknown = await response.json();
				const segments =
					Array.isArray(data) && Array.isArray(data[0]) ? data[0] : null;
				if (!segments) throw new Error("Invalid transliteration response");
				const result = segments
					.map((segment: unknown) =>
						Array.isArray(segment) && typeof segment[3] === "string"
							? segment[3]
							: "",
					)
					.join("");
				if (!result.trim()) throw new Error("Empty transliteration response");
				return result;
			} finally {
				clearTimeout(timeout);
			}
		});
		return { value, cacheable: true };
	} catch (error) {
		console.warn(`${language} transliteration unavailable`, error);
		return { value: "", cacheable: false };
	}
}

function kanaReadings(parts: string[]): string[] | null {
	const normalized = parts.map((part) => part.normalize("NFKC"));
	const readings = normalized.map((part) =>
		formatPhoneticForDisplay(wanakana.toRomaji(part)),
	);
	for (let index = 0; index < normalized.length; index++) {
		const char = normalized[index];
		if (char === "っ" || char === "ッ") {
			const next = readings[index + 1] ?? "";
			readings[index] = /^(?:ch|ts)/.test(next)
				? "t"
				: /^[bcdfghjkmprstvwz]/.test(next)
					? next[0]
					: "";
		}
		if (char === "ー")
			readings[index] = readings[index - 1]?.match(/[aeiou]$/)?.[0] ?? "";
		if (
			(char === "ん" || char === "ン") &&
			/^[aeiouy]/.test(readings[index + 1] ?? "")
		)
			readings[index] = "n'";
	}
	return readings.join("") ===
		formatPhoneticForDisplay(wanakana.toRomaji(normalized.join("")))
		? readings
		: null;
}

async function proposeSpans(
	text: string,
	language: PhoneticLanguage,
): Promise<PhoneticSpan[]> {
	const spans: PhoneticSpan[] = [];
	const push = (source: string, reading: string, warning = false) => {
		const start = spans[spans.length - 1]?.end ?? 0;
		spans.push({
			text: source,
			start,
			end: start + source.length,
			reading,
			warning,
		});
	};
	if (language === "zh") {
		const records = getPinyin(text, {
			type: "all",
			traditional: true,
			toneType: "symbol",
		});
		let offset = 0;
		const readings = records.map((record) => {
			const start = offset;
			offset += record.origin.length;
			return {
				start,
				end: offset,
				reading: record.isZh ? record.pinyin.toLocaleLowerCase() : "",
			};
		});
		let recordIndex = 0;
		for (const char of graphemes(text)) {
			const start = spans[spans.length - 1]?.end ?? 0;
			let reading = "";
			while (
				recordIndex < readings.length &&
				readings[recordIndex].end <= start + char.length
			) {
				const record = readings[recordIndex++];
				if (record.start >= start) reading += record.reading;
			}
			push(char, reading, /\p{Script=Han}/u.test(char) && !reading);
		}
		return spans;
	}
	const units = graphemes(text);
	for (let index = 0; index < units.length; ) {
		const char = units[index];
		if (!hasSourceScript(char, language)) {
			push(char, "");
			index++;
			continue;
		}
		const start = index;
		while (
			index < units.length &&
			(hasSourceScript(units[index], language) ||
				(language === "ja" && units[index] === "ー"))
		)
			index++;
		const run = units.slice(start, index).join("");
		if (language === "ja" && !/\p{Script=Han}/u.test(run)) {
			const parts = splitJapaneseRun(run);
			const readings = kanaReadings(parts);
			if (readings)
				parts.forEach((part, offset) => {
					push(part, readings[offset], !readings[offset]);
				});
			else push(run, await getPhonetic(run, language), true);
		} else if (language === "ko") {
			const parts = graphemes(run);
			const readings = Romanize.toGroup(run.normalize("NFC"));
			if (readings.length === parts.length)
				parts.forEach((part, offset) => {
					push(part, readings[offset].toLowerCase(), !readings[offset]);
				});
			else push(run, await getPhonetic(run, language), true);
		} else if (language === "yue") {
			const reading = await getPhonetic(run, language, true);
			const readings = reading.trim().split(/\s+/).filter(Boolean);
			const parts = graphemes(run);
			if (readings.length === parts.length)
				parts.forEach((part, offset) => {
					push(part, readings[offset].toLowerCase());
				});
			else push(run, formatPhoneticForDisplay(reading), true);
		} else push(run, await getPhonetic(run, language), true);
	}
	return spans;
}

export async function getPhoneticSpans(
	text: string,
	lang: PhoneticLanguage = "auto",
	signal?: AbortSignal,
): Promise<PhoneticSpan[]> {
	if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
	const language = lang === "auto" ? detectPhoneticLanguage(text) : lang;
	const key = `${language}\u0000${text}`;
	let request = spanRequests.get(key);
	if (!request) {
		request = proposeSpans(text, language).finally(() =>
			spanRequests.delete(key),
		);
		spanRequests.set(key, request);
	}
	const result = await request;
	if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
	if (
		!preservesSource(
			text,
			result.map((span) => span.text),
		)
	)
		return [{ text, start: 0, end: text.length, reading: "", warning: true }];
	return result.map((span) => ({ ...span }));
}

export async function getPhoneticCapsules(
	capsules: string[],
	lang: PhoneticLanguage = "auto",
): Promise<{ reading: string; warning: boolean }[]> {
	const spans = await getPhoneticSpans(capsules.join(""), lang);
	let start = 0;
	let spanIndex = 0;
	return capsules.map((capsule) => {
		const end = start + capsule.length;
		while (spanIndex < spans.length && spans[spanIndex].end <= start)
			spanIndex++;
		const matches: PhoneticSpan[] = [];
		for (
			let index = spanIndex;
			index < spans.length && spans[index].start < end;
			index++
		)
			matches.push(spans[index]);
		const reading = matches
			.filter((span) => span.start >= start)
			.map((span) => span.reading)
			.join("");
		const warning = matches.some(
			(span) => span.warning || span.start < start || span.end > end,
		);
		start = end;
		return { reading, warning };
	});
}

export async function getPhoneticSyllables(
	textOrArray: string | string[],
	lang: PhoneticLanguage = "auto",
): Promise<string[]> {
	if (typeof textOrArray === "string")
		return (await getPhoneticSpans(textOrArray, lang)).map(
			(span) => span.reading,
		);
	return (await getPhoneticCapsules(textOrArray, lang)).map(
		(capsule) => capsule.reading,
	);
}

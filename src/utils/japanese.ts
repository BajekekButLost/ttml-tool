import { graphemes } from "./graphemes";

export const isKanaModifier = (char: string | undefined) =>
	!!char &&
	/^[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]$/u.test(char.normalize("NFKC"));

export function splitJapaneseRun(text: string): string[] {
	const tokens: string[] = [];
	for (const char of graphemes(text)) {
		if (
			isKanaModifier(char) &&
			tokens.length > 0 &&
			/[\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(
				tokens[tokens.length - 1].normalize("NFKC"),
			)
		) {
			tokens[tokens.length - 1] += char;
		} else tokens.push(char);
	}
	return tokens;
}

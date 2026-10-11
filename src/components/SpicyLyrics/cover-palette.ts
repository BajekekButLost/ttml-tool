/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
export type CoverPalette = { base: string; highlight: string };
const colorToHex = (red: number, green: number, blue: number) =>
	`#${[red, green, blue]
		.map((value) => Math.round(value).toString(16).padStart(2, "0"))
		.join("")}`;

export function getCoverPalette(
	data: Uint8ClampedArray,
): CoverPalette | undefined {
	const base = { red: 0, green: 0, blue: 0, weight: 0 };
	let highlight = { red: 0, green: 0, blue: 0, saturation: -1 };
	for (let index = 0; index < data.length; index += 4) {
		const red = data[index];
		const green = data[index + 1];
		const blue = data[index + 2];
		const alpha = data[index + 3] / 255;
		const max = Math.max(red, green, blue);
		const min = Math.min(red, green, blue);
		const saturation = max === 0 ? 0 : (max - min) / max;
		const weight = alpha * (0.35 + saturation * 0.65);
		base.red += red * weight;
		base.green += green * weight;
		base.blue += blue * weight;
		base.weight += weight;
		if (alpha > 0 && saturation > highlight.saturation && max > 38 && max < 235)
			highlight = { red, green, blue, saturation };
	}
	if (!base.weight) return undefined;
	const baseColor = colorToHex(
		base.red / base.weight,
		base.green / base.weight,
		base.blue / base.weight,
	);
	return {
		base: baseColor,
		highlight:
			highlight.saturation >= 0
				? colorToHex(highlight.red, highlight.green, highlight.blue)
				: baseColor,
	};
}

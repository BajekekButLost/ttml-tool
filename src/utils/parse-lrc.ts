import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";

interface ParsedEvent {
	time: number;
	text: string;
	index: number; // 用于保持同时间戳下的原始顺序
}

// Include the seconds-only tags accepted by the old online-import stripper.
const TIME_TAG = /\[(?:(\d+):)?(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const METADATA_TAG = /\[(?:ar|ti|al|by|re|ve|length|offset):[^\]]*\]/gi;

function readLrcRows(content: string) {
	return content.split(/\r\n|\r|\n/).map((line) => ({
		text: line.replace(TIME_TAG, "").replace(METADATA_TAG, "").trim(),
		times: [...line.matchAll(TIME_TAG)].map(
			(match) =>
				Number(match[1] ?? 0) * 60000 +
				Number(match[2]) * 1000 +
				Number((match[3] ?? "").padEnd(3, "0")),
		),
	}));
}

/** Strip all time/metadata tags, keeping each source lyric row once. */
export function lrcToPlainLyrics(content: string): string {
	return readLrcRows(content)
		.map((row) => row.text)
		.filter(Boolean)
		.join("\n");
}

/** Parse line timing; equal timestamps become main, translation, romanization. */
export function parseLrc(lrcContent: string): LyricLine[] {
	const parsedEvents: ParsedEvent[] = [];
	const offsets = [...lrcContent.matchAll(/\[offset:([+-]?\d+)\]/gi)];
	const offset = Number(offsets[offsets.length - 1]?.[1] ?? 0);
	let globalIndex = 0;
	for (const row of readLrcRows(lrcContent)) {
		for (const time of row.times) {
			parsedEvents.push({
				time: Math.max(0, time + offset),
				text: row.text,
				index: globalIndex++,
			});
		}
	}

	parsedEvents.sort((a, b) => a.time - b.time || a.index - b.index);

	const validLyricLines: LyricLine[] = [];

	let i = 0;
	while (i < parsedEvents.length) {
		const currentTime = parsedEvents[i].time;

		const group: ParsedEvent[] = [];
		while (i < parsedEvents.length && parsedEvents[i].time === currentTime) {
			group.push(parsedEvents[i]);
			i++;
		}

		const nextEvent = i < parsedEvents.length ? parsedEvents[i] : null;
		const endTime = nextEvent ? nextEvent.time : currentTime + 10000; // 最后一行只加10秒，以便可以在频谱图上调整而不会要拉到后面很远

		const textEvents = group.filter((e) => e.text.length > 0);

		if (textEvents.length === 0) {
			continue;
		}

		const mainEvent = textEvents[0];
		const mainLine = newLyricLine();
		const mainWord = newLyricWord();

		mainWord.word = mainEvent.text;
		mainWord.startTime = currentTime;
		mainWord.endTime = endTime;

		mainLine.words = [mainWord];
		mainLine.startTime = currentTime;
		mainLine.endTime = endTime;
		mainLine.isLineSynced = true;

		// 第二行作为翻译
		if (textEvents.length > 1) {
			mainLine.translatedLyric = textEvents[1].text;
		}

		// 第三行作为音译
		if (textEvents.length > 2) {
			mainLine.romanLyric = textEvents[2].text;
		}

		validLyricLines.push(mainLine);

		if (textEvents.length > 3) {
			for (let k = 3; k < textEvents.length; k++) {
				const extraEvent = textEvents[k];
				const extraLine = newLyricLine();
				const extraWord = newLyricWord();

				extraWord.word = extraEvent.text;
				extraWord.startTime = currentTime;
				extraWord.endTime = endTime;

				extraLine.words = [extraWord];
				extraLine.startTime = currentTime;
				extraLine.endTime = endTime;
				extraLine.isLineSynced = true;

				validLyricLines.push(extraLine);
			}
		}
	}

	return validLyricLines;
}

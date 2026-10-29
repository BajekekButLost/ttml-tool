/**
 * @description 管理分词设置的持久化状态
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { graphemes, preservesSource } from "$/utils/graphemes";
import type { SegmentationEngineId } from "../types";

type Scope = "all" | "range";
type PunctuationMode = "merge" | "standalone";
type CustomRulesMap = Map<string, string[]>;
type CustomRulesStorage = [string, string[]][];
type LearnedRulesStorage = [string, number[]][];

export const segmentationScopeAtom = atomWithStorage<Scope>(
	"segmentation.scope",
	"all",
);
export const segmentationRangeStartAtom = atomWithStorage(
	"segmentation.rangeStart",
	"1",
);
export const segmentationRangeEndAtom = atomWithStorage(
	"segmentation.rangeEnd",
	"1",
);
export const segmentationSplitCJKAtom = atomWithStorage(
	"segmentation.splitCJK",
	true,
);
export const segmentationSplitEnglishAtom = atomWithStorage(
	"segmentation.splitEnglish",
	true,
);
export const segmentationEngineAtom = atomWithStorage<SegmentationEngineId>(
	"segmentation.engine",
	"prosodic",
);
export const segmentationPunctuationModeAtom = atomWithStorage<PunctuationMode>(
	"segmentation.punctuationMode",
	"merge",
);
export const segmentationPunctuationWeightAtom = atomWithStorage(
	"segmentation.punctuationWeight",
	"0.2",
);
export const segmentationRemoveEmptySegmentsAtom = atomWithStorage(
	"segmentation.removeEmptySegments",
	true,
);
export const segmentationIgnoreListTextAtom = atomWithStorage(
	"segmentation.ignoreListText",
	"",
);

const segmentationCustomRulesStorageAtom = atomWithStorage<CustomRulesStorage>(
	"segmentation.customRules",
	[],
);

export const segmentationCustomRulesAtom = atom<
	CustomRulesMap,
	[CustomRulesMap],
	void
>(
	(get) => {
		const rulesArray = get(segmentationCustomRulesStorageAtom);
		return new Map(
			Array.isArray(rulesArray)
				? rulesArray.filter(
						(entry) =>
							Array.isArray(entry) &&
							typeof entry[0] === "string" &&
							Array.isArray(entry[1]) &&
							entry[1].every((part) => typeof part === "string") &&
							preservesSource(entry[0], entry[1]),
					)
				: [],
		);
	},
	(_get, set, newMap) => {
		const rulesArray = Array.from(newMap.entries());
		set(segmentationCustomRulesStorageAtom, rulesArray);
	},
);

const segmentationLearnedRulesStorageAtom = atomWithStorage<
	LearnedRulesStorage | { version: 2; rules: LearnedRulesStorage }
>("segmentation.learnedRules", []);

export const segmentationAllLearnedRulesAtom = atom((get) => {
	const stored = get(segmentationLearnedRulesStorageAtom);
	const legacy = Array.isArray(stored);
	const entries = legacy ? stored : stored?.version === 2 ? stored.rules : [];
	const rules = new Map<string, number[]>();
	if (!Array.isArray(entries)) return rules;
	for (const entry of entries) {
		if (
			!Array.isArray(entry) ||
			typeof entry[0] !== "string" ||
			!Array.isArray(entry[1])
		)
			continue;
		const [key, boundaries] = entry;
		const wordKey = key.slice(key.indexOf("\u0000") + 1);
		const chars = graphemes(wordKey);
		const offsets = [0];
		for (const char of chars)
			offsets.push(offsets[offsets.length - 1] + Array.from(char).length);
		const mapped = boundaries.map((value) =>
			legacy ? offsets.indexOf(value) : value,
		);
		rules.set(
			key.includes("\u0000") ? key : `prosodic\u0000${key}`,
			[
				...new Set(
					mapped.filter(
						(value) =>
							Number.isInteger(value) && value > 0 && value < chars.length,
					),
				),
			].sort((a, b) => a - b),
		);
	}
	return rules;
});

export const segmentationLearnedRulesAtom = atom(
	(get) => {
		const prefix = `${get(segmentationEngineAtom)}\u0000`;
		return new Map(
			[...get(segmentationAllLearnedRulesAtom)]
				.filter(([key]) => key.startsWith(prefix))
				.map(([key, boundaries]) => [key.slice(prefix.length), boundaries]),
		);
	},
	(get, set, rules: Map<string, number[]>) => {
		const prefix = `${get(segmentationEngineAtom)}\u0000`;
		const allRules = new Map(
			[...get(segmentationAllLearnedRulesAtom)].filter(
				([key]) => !key.startsWith(prefix),
			),
		);
		for (const [key, boundaries] of rules)
			allRules.set(prefix + key, boundaries);
		set(segmentationLearnedRulesStorageAtom, {
			version: 2,
			rules: [...allRules],
		});
	},
);

export const splitWordApplyToAllAtom = atomWithStorage(
	"segmentation.splitWord.applyToAll",
	false,
);
export const splitWordIgnoreCaseAtom = atomWithStorage(
	"segmentation.splitWord.ignoreCase",
	true,
);
export const splitWordRememberAtom = atomWithStorage(
	"segmentation.splitWord.remember",
	false,
);

/*
 * Copyright 2023-2025 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/spicylyrics/ttml-tool/blob/main/LICENSE
 */

import { useAtomValue, useStore } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { displayRomanizationInSyncAtom } from "$/modules/settings/states/index.ts";
import {
	lyricLinesAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main.ts";
import {
	buildLineRomanization,
	getPhoneticSyllables,
	type PhoneticLanguage,
} from "$/utils/phonetic";

export const usePhoneticSection = () => {
	const { t } = useTranslation();
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const selectedLines = useAtomValue(selectedLinesAtom);
	const selectedWords = useAtomValue(selectedWordsAtom);
	const store = useStore();
	const [loading, setLoading] = useState(false);
	const [lang, setLang] = useState<PhoneticLanguage>("auto");

	const handleAutoFetch = useCallback(async () => {
		setLoading(true);
		try {
			const { lyricLines: originalLines } = store.get(lyricLinesAtom);

			if (selectedLines.size === 0 && selectedWords.size === 0) {
				toast.info(
					t(
						"ribbonBar.editMode.phonetic.noSelection",
						"Select lines or words first",
					),
				);
				return;
			}

			const lineUpdates: Record<string, string> = {};
			const wordUpdates: Record<string, string> = {};

			if (selectedWords.size > 0) {
				const targetLines = originalLines.filter((line) =>
					line.words.some((word) => selectedWords.has(word.id)),
				);
				for (const line of targetLines) {
					// Pass word arrays directly to ensure capsule-aware mapping
					const capsuleTexts = line.words.map((w) => w.word);
					if (capsuleTexts.join("").trim().length === 0) continue;

					// Get line-level phonetic data
					const lineSyllables = await getPhoneticSyllables(capsuleTexts, lang);

					for (let i = 0; i < line.words.length; i++) {
						const word = line.words[i];
						if (selectedWords.has(word.id)) {
							wordUpdates[word.id] = lineSyllables[i] ?? "";
						}
					}
				}
			} else {
				const targetLines = originalLines.filter((l) =>
					selectedLines.has(l.id),
				);
				for (const line of targetLines) {
					// Join for the line summary, but process capsules for word updates
					const capsuleTexts = line.words.map((w) => w.word);
					if (line.words.length > 0) {
						// Distribute using capsule-aware mapping
						const syllables = await getPhoneticSyllables(capsuleTexts, lang);
						lineUpdates[line.id] = buildLineRomanization(
							capsuleTexts,
							syllables,
						);
						for (let i = 0; i < line.words.length; i++) {
							wordUpdates[line.words[i].id] = syllables[i] ?? "";
						}
					}
				}
			}

			editLyricLines((draft) => {
				for (const line of draft.lyricLines) {
					if (lineUpdates[line.id] !== undefined) {
						line.romanLyric = lineUpdates[line.id];
					}
					for (const word of line.words) {
						if (wordUpdates[word.id] !== undefined) {
							word.romanWord = wordUpdates[word.id];
						}
					}
				}
			});
			toast.success(
				t(
					"ribbonBar.editMode.phonetic.success",
					"Phonetics fetched successfully",
				),
			);
		} catch (e) {
			console.error(e);
			toast.error(
				t("ribbonBar.editMode.phonetic.error", "Failed to fetch phonetics"),
			);
		} finally {
			setLoading(false);
		}
	}, [editLyricLines, selectedLines, selectedWords, store, t, lang]);

	const displayRomanization = useAtomValue(displayRomanizationInSyncAtom);

	return {
		t,
		lang,
		setLang,
		loading,
		handleAutoFetch,
		displayRomanization,
		store,
	};
};

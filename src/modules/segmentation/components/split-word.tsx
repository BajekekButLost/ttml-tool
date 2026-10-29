import { Info16Regular } from "@fluentui/react-icons";
import {
	Box,
	Button,
	Callout,
	Checkbox,
	Dialog,
	Flex,
	Text,
} from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLyricLinesWhileOpen } from "$/hooks/useLyricLinesWhileOpen.ts";
import {
	segmentationLearnedRulesAtom,
	splitWordApplyToAllAtom,
	splitWordIgnoreCaseAtom,
	splitWordRememberAtom,
} from "$/modules/segmentation/states";
import {
	applyLearnedRule,
	createLearnedRule,
	getLearnedWordParts,
} from "$/modules/segmentation/utils/learned-rules";
import {
	recalculateWordTime,
	segmentWord,
} from "$/modules/segmentation/utils/segmentation.ts";
import { splitWordDialogAtom } from "$/states/dialogs.ts";
import { editingWordStateAtom, lyricLinesAtom } from "$/states/main";
import type { LyricWord } from "$/types/ttml";
import { graphemes } from "$/utils/graphemes";
import { useSegmentationConfig } from "../utils/useSegmentationConfig";
import { ManualWordSplitter } from "./ManualWordSplitter";

export const SplitWordDialog = memo(() => {
	const [splitWordDialog, splitWordDialogOpen] = useAtom(splitWordDialogAtom);
	const editingState = useAtomValue(editingWordStateAtom);
	const lyricLines = useLyricLinesWhileOpen(splitWordDialog);
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const { t } = useTranslation();

	const [splitIndices, setSplitIndices] = useState(new Set<number>());
	const [target, setTarget] = useState<{
		lineId: string;
		word: LyricWord;
	} | null>(null);
	const targetWordText = target?.word.word ?? "";
	const dirty = useRef(false);

	const [applyToAll, setApplyToAll] = useAtom(splitWordApplyToAllAtom);
	const [ignoreCase, setIgnoreCase] = useAtom(splitWordIgnoreCaseAtom);
	const [rememberSplit, setRememberSplit] = useAtom(splitWordRememberAtom);
	const [learnedRules, setLearnedRules] = useAtom(segmentationLearnedRulesAtom);
	const {
		config: segmentationConfig,
		isReady,
		error,
		runSegmentation,
	} = useSegmentationConfig();

	useEffect(() => {
		if (!splitWordDialog) {
			setTarget(null);
			dirty.current = false;
			return;
		}
		if (target) return;
		const line = lyricLines.lyricLines[editingState.lineIndex];
		const word = line?.words[editingState.wordIndex];
		if (word) setTarget({ lineId: line.id, word });
	}, [
		splitWordDialog,
		target,
		lyricLines,
		editingState.lineIndex,
		editingState.wordIndex,
	]);

	useEffect(() => {
		if (!target || !isReady || dirty.current) return;
		const resultWords = segmentWord(target.word, segmentationConfig);
		if (resultWords.length > 1) {
			const indices = new Set<number>();
			let currentIndex = 0;
			for (let i = 0; i < resultWords.length - 1; i++) {
				currentIndex += graphemes(resultWords[i].word).length;
				indices.add(currentIndex);
			}
			setSplitIndices(indices);
		} else {
			setSplitIndices(new Set());
		}
	}, [target, segmentationConfig, isReady]);

	const toggleSplitPoint = useCallback((index: number) => {
		dirty.current = true;
		setSplitIndices((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	}, []);

	const handleSplit = useCallback(() => {
		if (!targetWordText || !target) return;

		const sortedIndices = Array.from(splitIndices).sort((a, b) => a - b);
		const buildSegments = (text: string) => {
			const chars = graphemes(text);
			const parts: string[] = [];
			let lastIndex = 0;
			for (const index of sortedIndices) {
				if (index <= lastIndex) continue;
				parts.push(chars.slice(lastIndex, index).join(""));
				lastIndex = index;
			}
			parts.push(chars.slice(lastIndex).join(""));
			return parts.filter((p) => p.length > 0);
		};

		const targetSegments = buildSegments(targetWordText);

		if (targetSegments.length === 0) return;
		const splitRule = createLearnedRule(targetWordText, sortedIndices);
		const learnedRule = rememberSplit ? splitRule : null;
		const ruleForCurrentSplit = splitRule
			? new Map([[splitRule.key, splitRule.boundaries]])
			: null;
		const targetCore = getLearnedWordParts(targetWordText);

		let applied = false;
		runSegmentation(
			(config) =>
				editLyricLines((state) => {
					const createNewWords = (word: LyricWord, segments: string[]) =>
						recalculateWordTime(word, segments, config);
					const sourceLine = state.lyricLines.find(
						(line) => line.id === target.lineId,
					);
					const currentWord = sourceLine?.words.find(
						(word) => word.id === target.word.id,
					);
					if (
						!currentWord ||
						JSON.stringify(currentWord) !== JSON.stringify(target.word)
					)
						return;
					applied = true;
					if (applyToAll) {
						for (const line of state.lyricLines) {
							line.words = line.words.flatMap((word) => {
								const candidateCore = getLearnedWordParts(word.word);
								const isMatch =
									ignoreCase && targetCore && candidateCore
										? candidateCore.key === targetCore.key
										: word.word === targetWordText;

								if (isMatch) {
									const wordSegments =
										ruleForCurrentSplit && ignoreCase
											? applyLearnedRule(word.word, ruleForCurrentSplit) ||
												targetSegments
											: targetSegments;
									return createNewWords(
										word,
										wordSegments.length > 0 ? wordSegments : targetSegments,
									);
								}
								return word;
							});
						}
					} else {
						const line = sourceLine;
						if (line) {
							const index = line.words.findIndex(
								(word) => word.id === target.word.id,
							);
							const word = line.words[index];
							if (word && word.word === targetWordText) {
								line.words.splice(
									index,
									1,
									...createNewWords(word, targetSegments),
								);
							}
						}
					}
				}),
			false,
		);

		if (applied && learnedRule) {
			const nextRules = new Map(learnedRules);
			nextRules.set(learnedRule.key, learnedRule.boundaries);
			setLearnedRules(nextRules);
		}
	}, [
		targetWordText,
		target,
		splitIndices,
		editLyricLines,
		applyToAll,
		ignoreCase,
		rememberSplit,
		learnedRules,
		setLearnedRules,
		runSegmentation,
	]);

	return (
		<Dialog.Root open={splitWordDialog} onOpenChange={splitWordDialogOpen}>
			<Dialog.Content>
				<Dialog.Title>{t("splitWordDialog.title", "Split word")}</Dialog.Title>
				<Flex direction="column" gap="2">
					<Callout.Root color="blue">
						<Callout.Icon>
							<Info16Regular />
						</Callout.Icon>
						<Callout.Text>
							{t(
								"syllableSplitting.timing",
								"Splitting creates draft timings weighted by character count. Review the timing and romanization before export.",
							)}
						</Callout.Text>
					</Callout.Root>

					<Box my="3">
						<ManualWordSplitter
							word={targetWordText}
							splitIndices={splitIndices}
							onSplitIndexToggle={toggleSplitPoint}
						/>
						<Flex justify="end" mt="2">
							<Button
								size="1"
								variant="soft"
								disabled={!isReady || !targetWordText}
								onClick={() => {
									if (!isReady || !target) return;
									dirty.current = true;
									const parts = segmentWord(
										target.word,
										segmentationConfig,
									).map((word) => word.word);
									const indices = new Set<number>();
									let currentIndex = 0;
									for (let i = 0; i < parts.length - 1; i++) {
										currentIndex += graphemes(parts[i]).length;
										indices.add(currentIndex);
									}
									setSplitIndices(indices);
								}}
							>
								{t("splitWordDialog.syllableSplit", "Syllable split")}
							</Button>
						</Flex>
						{error && (
							<Text role="alert" color="red">
								{t(
									"syllableSplitting.engineError",
									"The selected splitting engine could not load. Choose another engine or reopen this dialog to retry.",
								)}
							</Text>
						)}
					</Box>

					<Flex direction="column" gap="2">
						<Text as="label" size="2">
							<Flex gap="2" align="center">
								<Checkbox
									checked={applyToAll}
									onCheckedChange={(c) => setApplyToAll(c as boolean)}
								/>
								{t(
									"splitWordDialog.applyToAll",
									"Apply this split to all identical words",
								)}
							</Flex>
						</Text>

						<Text as="label" size="2">
							<Flex gap="2" align="center">
								<Checkbox
									checked={rememberSplit}
									onCheckedChange={(c) => setRememberSplit(c as boolean)}
								/>
								{t("splitWordDialog.remember", "Remember this split")}
							</Flex>
						</Text>
						<Text size="1" color="gray">
							{t("syllableSplitting.rememberHint")}
						</Text>

						<Text as="label" size="2">
							<Flex
								gap="2"
								align="center"
								style={{ opacity: applyToAll ? 1 : 0.5 }}
							>
								<Checkbox
									disabled={!applyToAll}
									checked={ignoreCase}
									onCheckedChange={(c) => setIgnoreCase(c as boolean)}
								/>
								{t("splitWordDialog.ignoreCase", "忽略大小写")}
							</Flex>
						</Text>
					</Flex>
				</Flex>

				<Flex justify="end" mt="4">
					<Dialog.Close>
						<Button onClick={handleSplit}>
							{t("splitWordDialog.actionButton", "执行")}
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
});

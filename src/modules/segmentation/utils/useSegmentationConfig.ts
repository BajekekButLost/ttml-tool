import { useAtomValue, useStore } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { lyricLinesAtom, selectedWordsAtom } from "$/states/main";
import {
	segmentationAllLearnedRulesAtom,
	segmentationCustomRulesAtom,
	segmentationEngineAtom,
	segmentationIgnoreListTextAtom,
	segmentationPunctuationModeAtom,
	segmentationPunctuationWeightAtom,
	segmentationRemoveEmptySegmentsAtom,
	segmentationSplitCJKAtom,
	segmentationSplitEnglishAtom,
} from "../states";
import type {
	HyphenatorFunc,
	SegmentationConfig,
	SegmentationEngineId,
} from "../types";
import { loadHyphenator } from "../utils/hyphen-loader";
import {
	getHyphenationLanguage,
	getSyllabificationEngine,
} from "./syllabification-engines";

export const useSegmentationConfig = (
	engineOverride?: SegmentationEngineId,
	enableWestern?: boolean,
) => {
	const { t } = useTranslation();
	const store = useStore();
	const splitCJK = useAtomValue(segmentationSplitCJKAtom);
	const savedSplitEnglish = useAtomValue(segmentationSplitEnglishAtom);
	const savedEngine = useAtomValue(segmentationEngineAtom);
	const engine = getSyllabificationEngine(engineOverride ?? savedEngine).id;
	const invalidEngine = engineOverride === undefined && savedEngine !== engine;
	const splitEnglish = enableWestern ?? savedSplitEnglish;
	const punctuationMode = useAtomValue(segmentationPunctuationModeAtom);
	const punctuationWeightStr = useAtomValue(segmentationPunctuationWeightAtom);
	const removeEmptySegments = useAtomValue(segmentationRemoveEmptySegmentsAtom);
	const ignoreListText = useAtomValue(segmentationIgnoreListTextAtom);
	const customRules = useAtomValue(segmentationCustomRulesAtom);
	const allLearnedRules = useAtomValue(segmentationAllLearnedRulesAtom);
	const learnedRules = useMemo(() => {
		const prefix = `${engine}\u0000`;
		return new Map(
			[...allLearnedRules]
				.filter(([key]) => key.startsWith(prefix))
				.map(([key, boundaries]) => [key.slice(prefix.length), boundaries]),
		);
	}, [allLearnedRules, engine]);

	const [resolution, setResolution] = useState<{
		engine: SegmentationEngineId;
		split?: HyphenatorFunc;
		status: "ready" | "loading" | "error";
	}>({ engine, status: "loading" });
	const needsPatterns = splitEnglish && !!getHyphenationLanguage(engine);
	const matches = resolution.engine === engine;
	const error =
		invalidEngine ||
		(needsPatterns && matches && resolution.status === "error");
	const isReady =
		!invalidEngine &&
		(!needsPatterns ||
			(matches && resolution.status === "ready" && !!resolution.split));
	const isLoading = needsPatterns && !isReady && !error;
	const hyphenator = needsPatterns && isReady ? resolution.split : undefined;

	useEffect(() => {
		let isMounted = true;
		const fetchHyphenator = async () => {
			const language = getHyphenationLanguage(engine);
			if (!splitEnglish || !language) {
				setResolution({ engine, status: "ready" });
				return;
			}
			setResolution({ engine, status: "loading" });
			const func = await loadHyphenator(language);
			if (isMounted) {
				setResolution({
					engine,
					split: func ?? undefined,
					status: func ? "ready" : "error",
				});
			}
		};
		fetchHyphenator();
		return () => {
			isMounted = false;
		};
	}, [engine, splitEnglish]);

	const config = useMemo((): SegmentationConfig => {
		const weight = parseFloat(punctuationWeightStr);
		const finalPunctuationWeight = Number.isNaN(weight) ? 0.2 : weight;

		const ignoreList = new Set(
			ignoreListText
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean),
		);

		return {
			engine,
			splitCJK,
			splitEnglish,
			punctuationMode,
			punctuationWeight: finalPunctuationWeight,
			removeEmptySegments,
			ignoreList,
			customRules,
			learnedRules,
			hyphenator,
			hyphenatorEngine: hyphenator ? engine : undefined,
		};
	}, [
		engine,
		splitCJK,
		splitEnglish,
		punctuationMode,
		punctuationWeightStr,
		removeEmptySegments,
		ignoreListText,
		customRules,
		learnedRules,
		hyphenator,
	]);

	const runSegmentation = useCallback(
		(action: (config: SegmentationConfig) => void, requireEngine = true) => {
			if (requireEngine && !isReady) {
				toast.error(t("syllableSplitting.engineError"));
				return false;
			}
			const diagnostics = new Set<string>();
			action({
				...config,
				onDiagnostic: (reason, text) =>
					diagnostics.add(`${reason}\u0000${text}`),
			});
			const selected = store.get(selectedWordsAtom);
			if (selected.size > 0) {
				const existing = new Set(
					store
						.get(lyricLinesAtom)
						.lyricLines.flatMap((line) => line.words.map((word) => word.id)),
				);
				const valid = new Set([...selected].filter((id) => existing.has(id)));
				if (valid.size !== selected.size) store.set(selectedWordsAtom, valid);
			}
			if (diagnostics.size > 0)
				toast.warn(t("syllableSplitting.review", { count: diagnostics.size }));
			return true;
		},
		[config, isReady, store, t],
	);

	return {
		config,
		isLoading,
		isReady,
		error,
		runSegmentation,
	};
};

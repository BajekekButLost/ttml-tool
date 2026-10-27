/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { timedPreviewLyricsAtom } from "$/components/PreviewModeSwitcher/states";
import { audioEngine } from "$/modules/audio/audio-engine";
import { audioCoverArtAtom, currentTimeAtom } from "$/modules/audio/states";
import { playbackClock } from "$/modules/playback-clock";
import { usePreviewScroll } from "$/modules/playback-clock/use-preview-scroll";
import { customBackgroundImageAtom } from "$/modules/settings/modals/customBackground";
import {
	allowConsecutiveBackgroundLinesAtom,
	customAccentColorAtom,
	useCustomAccentAtom,
} from "$/modules/settings/states";
import {
	showFpsCounterAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
	spicyBackgroundModeAtom,
	spicyForceLineSyncedAtom,
	spicySimpleLyricsModeAtom,
} from "$/modules/settings/states/preview";
import { findSpicyScrollIndex } from "./active-line";
import {
	createSpicyAnimator,
	type SlmAnimation,
	type SpringSet,
} from "./createSpicyAnimator";
import type { Spring } from "./math";
import { buildSpicyLines } from "./model";
import { useCoverPalette, useKawarpBackground } from "./useBackground";

export function useSpicyLyrics() {
	const lyrics = useAtomValue(timedPreviewLyricsAtom);
	const simple = useAtomValue(spicySimpleLyricsModeAtom);
	const forceLineSynced = useAtomValue(spicyForceLineSyncedAtom);
	const romanized = useAtomValue(showRomanLinesAtom);
	const showTranslation = useAtomValue(showTranslationLinesAtom);
	const showFps = useAtomValue(showFpsCounterAtom);
	const backgroundMode = useAtomValue(spicyBackgroundModeAtom);
	const embeddedCoverArt = useAtomValue(audioCoverArtAtom);
	const customBackgroundImage = useAtomValue(customBackgroundImageAtom);
	const useAccent = useAtomValue(useCustomAccentAtom);
	const accent = useAtomValue(customAccentColorAtom);
	// Background lines nest under their lead exactly as the export writes them.
	const allowConsecutiveBackgrounds = useAtomValue(
		allowConsecutiveBackgroundLinesAtom,
	);
	const setCurrentTime = useSetAtom(currentTimeAtom);
	const lines = useMemo(
		() =>
			buildSpicyLines(
				lyrics.lyricLines,
				simple,
				romanized,
				forceLineSynced,
				allowConsecutiveBackgrounds,
			),
		[
			lyrics.lyricLines,
			simple,
			romanized,
			forceLineSynced,
			allowConsecutiveBackgrounds,
		],
	);
	const hasDuetLines = useMemo(
		() => lines.some((line) => !line.isDotLine && line.isDuet),
		[lines],
	);
	// Match Spicy's priority: artwork embedded in the loaded audio file comes first.
	// TTML cover_art and the app-level custom image are only fallbacks.
	const coverArtImage = useMemo(
		() =>
			lyrics.metadata
				.find((entry) => entry.key.toLowerCase() === "cover_art")
				?.value.find((value) => value.trim().length > 0) ?? null,
		[lyrics.metadata],
	);
	const backgroundImage =
		embeddedCoverArt ?? coverArtImage ?? customBackgroundImage;
	const coverPalette = useCoverPalette(backgroundImage);
	const viewportRef = useRef<HTMLDivElement>(null);
	const backgroundRef = useRef<HTMLDivElement>(null);
	const lineNodes = useRef(new Map<string, HTMLDivElement>());
	const wordNodes = useRef(new Map<string, HTMLElement>());
	const springs = useRef(new Map<string, SpringSet>());
	const lineGlowSprings = useRef(new Map<string, Spring>());
	const slmAnimations = useRef(new Map<string, SlmAnimation>());
	const lastTime = useRef(performance.now());
	const [fps, setFps] = useState(0);
	const fpsRef = useRef({ frames: 0, lastTime: performance.now() });
	const showFpsRef = useRef(showFps);
	useKawarpBackground(backgroundRef, backgroundImage, backgroundMode);

	useEffect(() => {
		showFpsRef.current = showFps;
		fpsRef.current = { frames: 0, lastTime: performance.now() };
		setFps(0);
	}, [showFps]);

	useEffect(() => {
		if (simple) return;
		for (const [key, animation] of slmAnimations.current) {
			animation.animation?.cancel();
			wordNodes.current
				.get(key)
				?.style.removeProperty("--spicy-slm-gradient-position");
		}
		slmAnimations.current.clear();
	}, [simple]);

	const getScrollTarget = useCallback(
		(timeMs: number) => {
			const index = findSpicyScrollIndex(lines, timeMs);
			if (index < 0) return undefined;
			const line = lines[index];
			return { id: line.id, getNode: () => lineNodes.current.get(line.id) };
		},
		[lines],
	);
	usePreviewScroll(viewportRef, getScrollTarget, { offset: 30 });

	useEffect(() => {
		lastTime.current = performance.now();
		const animate = createSpicyAnimator({
			lines,
			simple,
			lineNodes,
			wordNodes,
			springs,
			lineGlowSprings,
			slmAnimations,
			lastTime,
			setFps,
			fpsRef,
			showFpsRef,
		});
		animate(playbackClock.getSnapshot(), performance.now(), true);
		return playbackClock.subscribe(animate);
	}, [lines, simple]);

	const seek = (time: number) => {
		setCurrentTime(time);
		audioEngine.seekMusic(time / 1000);
	};
	return {
		simple,
		useAccent,
		accent,
		coverPalette,
		backgroundRef,
		backgroundMode,
		backgroundImage,
		showFps,
		fps,
		viewportRef,
		hasDuetLines,
		lines,
		lineNodes,
		wordNodes,
		showTranslation,
		seek,
	};
}

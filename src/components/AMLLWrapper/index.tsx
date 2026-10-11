import {
	BackgroundRender,
	MeshGradientRenderer,
} from "@applemusic-like-lyrics/react";
import classNames from "classnames";
import { atom, useAtomValue, useSetAtom } from "jotai";
import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { timedPreviewLyricsAtom } from "$/components/PreviewModeSwitcher/states";
import { audioEngine } from "$/modules/audio/audio-engine";
import {
	activeLineIdsAtom,
	audioPlayingAtom,
	currentTimeAtom,
} from "$/modules/audio/states/index.ts";
import { playbackClock } from "$/modules/playback-clock";
import { usePreviewScroll } from "$/modules/playback-clock/use-preview-scroll";
import { customBackgroundImageAtom } from "$/modules/settings/modals/customBackground";
import {
	instantHighlightFadeAtom,
	lyricWordFadeWidthAtom,
	showFpsCounterAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
	vsyncAtom,
} from "$/modules/settings/states/preview";
import {
	isDarkThemeAtom,
	projectIdentityAtom,
	selectedLinesAtom,
} from "$/states/main.ts";
import type { LyricLine, LyricWord } from "$/types/ttml";
import styles from "./index.module.css";

const displayTimeAtom = atom(0);

/**
 * A registry to hold references to active word DOM elements.
 * This allows us to update the --progress CSS variable directly at high frequency
 * without triggering React re-renders.
 */
const wordRegistry = new Map<
	string,
	{ el: HTMLSpanElement; word: LyricWord }
>();

// A single word span - static version (no time subscription)
const StaticWord = memo(({ word }: { word: LyricWord }) => (
	<span className={styles.wordStatic}>{word.word}</span>
));

// A single word span - active version (subscribes to time at a lower frequency)
const ActiveWord = memo(
	({
		word,
		onWordClick,
	}: {
		word: LyricWord;
		onWordClick: (t: number) => void;
	}) => {
		const currentTime = useAtomValue(displayTimeAtom);
		const spanRef = useRef<HTMLSpanElement>(null);

		const isWordActive =
			currentTime >= word.startTime && currentTime <= word.endTime;
		const isWordPast = currentTime > word.endTime;
		const fadeWidth = useAtomValue(lyricWordFadeWidthAtom);

		// Register the element for high-frequency direct DOM updates
		useEffect(() => {
			if (isWordActive && spanRef.current) {
				wordRegistry.set(word.id || `${word.startTime}`, {
					el: spanRef.current,
					word,
				});
				return () => {
					wordRegistry.delete(word.id || `${word.startTime}`);
				};
			}
		}, [isWordActive, word]);

		// Initial progress for the first render or when state changes
		const progress = isWordActive
			? Math.min(
					Math.max(
						(currentTime - word.startTime) / (word.endTime - word.startTime),
						0,
					),
					1,
				)
			: isWordPast
				? 1
				: 0;
		const progressPercent = (progress * 100).toFixed(2);
		const wordStyle: CSSProperties &
			Record<"--progress" | "--fade-width", string> = {
			"--progress": `${progressPercent}%`,
			"--fade-width": `${(fadeWidth * 20).toFixed(2)}px`, // Scale for visibility
		};

		return (
			<span
				ref={spanRef}
				className={classNames(
					styles.word,
					isWordActive && styles.wordActive,
					isWordPast && styles.wordPast,
				)}
				data-active={isWordActive}
				style={wordStyle}
				onClick={(e) => {
					e.stopPropagation();
					onWordClick(word.startTime);
				}}
			>
				{word.word}
			</span>
		);
	},
);

/**
 * A "line group" = one main line + any co-timed BG lines beneath it.
 */
interface LineGroup {
	main: LyricLine;
	bg: LyricLine[];
}

const StaticLineGroup = memo(
	({ group, isPast }: { group: LineGroup; isPast: boolean }) => (
		<div
			className={classNames(
				styles.lineGroup,
				isPast && styles.lineGroupPast,
				group.main.isDuet && styles.lineGroupDuet,
			)}
		>
			{/* Main / duet line */}
			<div
				className={classNames(
					styles.line,
					group.main.isDuet && styles.lineDuetR,
				)}
			>
				<div className={styles.wordsContainer}>
					{group.main.words.map((w) => (
						<StaticWord key={w.id} word={w} />
					))}
				</div>
			</div>
			{/* BG lines */}
			{group.bg.map((bgLine, i) => (
				<div
					key={bgLine.id || i}
					className={classNames(
						styles.line,
						styles.lineBG,
						bgLine.isDuet && styles.lineDuetR,
					)}
				>
					<div className={styles.wordsContainer}>
						{bgLine.words.map((w, wi) => (
							<StaticWord key={w.id || wi} word={w} />
						))}
					</div>
				</div>
			))}
		</div>
	),
);

const ActiveLineGroup = memo(
	({
		group,
		onWordClick,
	}: {
		group: LineGroup;
		onWordClick: (t: number) => void;
	}) => {
		const showTranslation = useAtomValue(showTranslationLinesAtom);
		const showRoman = useAtomValue(showRomanLinesAtom);
		return (
			<div
				className={classNames(
					styles.lineGroup,
					styles.lineGroupActive,
					group.main.isDuet && styles.lineGroupDuet,
				)}
			>
				{/* Main / duet line */}
				<div
					className={classNames(
						styles.line,
						styles.lineActive,
						group.main.isDuet && styles.lineDuetR,
					)}
				>
					<div className={styles.wordsContainer}>
						{group.main.words.map((w, i) => (
							<ActiveWord key={w.id || i} word={w} onWordClick={onWordClick} />
						))}
					</div>
					{showTranslation && group.main.translatedLyric && (
						<span className={styles.extraLine}>
							{group.main.translatedLyric}
						</span>
					)}
					{showRoman && group.main.romanLyric && (
						<span className={styles.extraLine}>{group.main.romanLyric}</span>
					)}
				</div>
				{/* BG lines - also highlight when group is active */}
				{group.bg.map((bgLine, i) => (
					<div
						key={bgLine.id || i}
						className={classNames(
							styles.line,
							styles.lineBG,
							styles.lineBGActive,
							bgLine.isDuet && styles.lineDuetR,
						)}
					>
						<div className={styles.wordsContainer}>
							{bgLine.words.map((w, wi) => (
								<ActiveWord
									key={w.id || wi}
									word={w}
									onWordClick={onWordClick}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		);
	},
);

export const AMLLWrapper = memo(
	({ variant }: { variant?: "standard" | "toxi" }) => {
		const isToxi = variant === "toxi";
		const vsync = useAtomValue(vsyncAtom);
		const showFps = useAtomValue(showFpsCounterAtom);
		const setDisplayTime = useSetAtom(displayTimeAtom);
		const lastUpdateRef = useRef(0);
		const [fps, setFps] = useState(0);
		const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

		useEffect(() => {
			const update = (seconds: number, now: number, seeked = false) => {
				const displayMs = seconds * 1000;
				wordRegistry.forEach(({ el, word }) => {
					const progress =
						word.endTime <= word.startTime
							? 1
							: Math.min(
									Math.max(
										(displayMs - word.startTime) /
											(word.endTime - word.startTime),
										0,
									),
									1,
								);
					el.style.setProperty(
						"--progress",
						`${Math.round(progress * 1000) / 10}%`,
					);
				});
				// Preserve the existing 30/60Hz React budget. DOM progress and the
				// shared editor atom always use the engine's exact frame sample.
				if (
					seeked ||
					!audioEngine.musicPlaying ||
					now - lastUpdateRef.current >= (vsync ? 16.6 : 33.3)
				) {
					setDisplayTime(displayMs);
					lastUpdateRef.current = now;
				}
				fpsRef.current.frames++;
				if (now - fpsRef.current.lastTime >= 1000) {
					setFps(
						Math.round(
							(fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime),
						),
					);
					fpsRef.current = { frames: 0, lastTime: now };
				}
			};
			update(playbackClock.getSnapshot(), performance.now(), true);
			return playbackClock.subscribe(update);
		}, [vsync, setDisplayTime]);

		const lyrics = useAtomValue(timedPreviewLyricsAtom);
		const activeLineIds = useAtomValue(activeLineIdsAtom);
		const darkMode = useAtomValue(isDarkThemeAtom);
		const projectIdentity = useAtomValue(projectIdentityAtom);
		const setCurrentTime = useSetAtom(currentTimeAtom);
		const setSelectedLines = useSetAtom(selectedLinesAtom);

		const scrollContainerRef = useRef<HTMLDivElement>(null);

		// Group lines: in the AMLL data format, a BG vocal line (isBG: true) is
		// ALWAYS placed immediately after its parent main line in the sorted array.
		// This is guaranteed by the TTML→AMLL converter (amll-converter.ts line 149-156).
		// So we just scan in order and attach BG lines to the preceding main line.
		const lineGroups = useMemo((): LineGroup[] => {
			const sorted = [...lyrics.lyricLines].sort(
				(a, b) => a.startTime - b.startTime,
			);
			const groups: LineGroup[] = [];

			for (let i = 0; i < sorted.length; i++) {
				const line = sorted[i];
				if (line.isBG) {
					// Attach to the last group if one exists
					if (groups.length > 0) {
						groups[groups.length - 1].bg.push(line);
					} else {
						groups.push({ main: line, bg: [] });
					}
				} else {
					groups.push({ main: line, bg: [] });
				}
			}

			return groups;
		}, [lyrics.lyricLines]);

		const activeLineIdsSet = useMemo(
			() => new Set(activeLineIds),
			[activeLineIds],
		);

		const getScrollTarget = useCallback(
			(timeMs: number) => {
				const index = lineGroups.findIndex((group) =>
					[group.main, ...group.bg].some(
						(line) => timeMs >= line.startTime && timeMs <= line.endTime,
					),
				);
				if (index < 0) return undefined;
				return {
					id: lineGroups[index].main.id,
					getNode: () => {
						const wrapper = scrollContainerRef.current?.children[index + 1];
						// display:contents has no box; measure its actual line group.
						const line = wrapper?.firstElementChild ?? wrapper;
						return line instanceof HTMLElement ? line : undefined;
					},
				};
			},
			[lineGroups],
		);
		usePreviewScroll(scrollContainerRef, getScrollTarget, { anchor: 0.4 });

		const handleLineClick = (line: LyricLine) => {
			setCurrentTime(line.startTime);
			setSelectedLines(new Set([line.id]));
			audioEngine.seekMusic(line.startTime / 1000);
		};

		const handleWordClick = (time: number) => {
			setCurrentTime(time);
			audioEngine.seekMusic(time / 1000);
		};

		const isPlaying = useAtomValue(audioPlayingAtom);
		const instantFade = useAtomValue(instantHighlightFadeAtom);
		const albumImg = useAtomValue(customBackgroundImageAtom);

		return (
			<div
				className={classNames(
					styles.amllWrapper,
					darkMode && styles.isDark,
					isToxi && styles.isToxi,
					instantFade && styles.hasInstantFade,
				)}
			>
				{/* Dynamic Mesh Warp Background (Kawarp) */}
				<div className={styles.bgLayer}>
					<BackgroundRender
						key={albumImg || "default"}
						album={albumImg || undefined}
						// PERF: Only animate when audio is actually playing
						playing={isPlaying}
						// PERF: 0.5x render scale - invisible quality difference on a blurred gradient
						renderScale={0.5}
						renderer={MeshGradientRenderer}
					/>
				</div>
				<div className={styles.contentOverlay}>
					<div className={styles.header}>
						<h3>{projectIdentity.name || "Untitled"}</h3>
						<span>{projectIdentity.artist || "Unknown Artist"}</span>
					</div>

					<div className={styles.lyricsViewport} ref={scrollContainerRef}>
						<div className={styles.padding} />
						{lineGroups.map((group) => {
							const isActive =
								activeLineIdsSet.has(group.main.id) ||
								group.bg.some((b) => activeLineIdsSet.has(b.id));

							if (isActive) {
								return (
									<div
										key={group.main.id}
										onClick={() => handleLineClick(group.main)}
										style={{ display: "contents" }}
									>
										<ActiveLineGroup
											group={group}
											onWordClick={handleWordClick}
										/>
									</div>
								);
							}
							return (
								<div
									key={group.main.id}
									onClick={() => handleLineClick(group.main)}
									style={{ display: "contents" }}
								>
									<StaticLineGroup group={group} isPast={false} />
								</div>
							);
						})}
						<div className={styles.padding} />
					</div>
				</div>
				{showFps && (
					<div
						style={{
							position: "absolute",
							bottom: 10,
							right: 10,
							background: "rgba(0,0,0,0.5)",
							color: "#0f0",
							fontFamily: "monospace",
							fontSize: "12px",
							padding: "2px 6px",
							borderRadius: "4px",
							pointerEvents: "none",
							zIndex: 1000,
						}}
					>
						FPS: {fps}
					</div>
				)}
			</div>
		);
	},
);

export default AMLLWrapper;

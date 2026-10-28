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

import {
	ChevronDownFilled,
	ChevronUpFilled,
	MusicNote2Filled,
	PauseFilled,
	PlayFilled,
} from "@fluentui/react-icons";
import {
	Button,
	Card,
	Flex,
	Grid,
	IconButton,
	Inset,
	Popover,
	Slider,
	Switch,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import { useAtom, useAtomValue, useStore } from "jotai";
import {
	type ComponentProps,
	type CSSProperties,
	type FC,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLoadAudio } from "$/hooks/useLoadAudio";
import { audioEngine } from "$/modules/audio/audio-engine";
import { AudioSlider } from "$/modules/audio/components/AudioSlider";
import {
	audioPlayingAtom,
	currentDurationAtom,
	currentTimeAtom,
	playbackRateAtom,
	preservesPitchAtom,
	volumeAtom,
} from "$/modules/audio/states";
import {
	MAX_PLAYBACK_RATE,
	MIN_PLAYBACK_RATE,
	stepPlaybackRate,
} from "$/modules/audio/utils/playback-rate";
import { AuditionKeyBinding } from "$/modules/keyboard/components/AuditionKeyBinding";
import { AudioSpectrogram } from "$/modules/spectrogram/components/AudioSpectrogram";
import {
	keyPlaybackRateDownAtom,
	keyPlaybackRateResetAtom,
	keyPlaybackRateUpAtom,
	keyPlayPauseAtom,
	keySeekBackwardAtom,
	keySeekForwardAtom,
	keyVolumeDownAtom,
	keyVolumeUpAtom,
} from "$/states/keybindings.ts";
import { useKeyBindingAtom } from "$/utils/keybindings.ts";
import { msToTimestamp } from "$/utils/timestamp.ts";

/**
 * Radix puts `aria-label` on the slider root, but screen readers announce the
 * focusable thumb, so the name goes there.
 */
const LabeledSlider: FC<
	Omit<ComponentProps<typeof Slider>, "aria-label"> & { label: string }
> = ({ label, ...props }) => {
	const ref = useRef<HTMLSpanElement>(null);
	useLayoutEffect(() => {
		ref.current
			?.querySelector('[role="slider"]')
			?.setAttribute("aria-label", label);
	}, [label]);
	return <Slider ref={ref} {...props} />;
};

const AudioPlaybackKeyBinding = memo(() => {
	const store = useStore();

	useKeyBindingAtom(keyPlayPauseAtom, () => {
		if (audioEngine.musicPlaying) audioEngine.pauseMusic();
		else audioEngine.resumeOrSeekMusic();
	}, []);

	useKeyBindingAtom(keySeekForwardAtom, () => {
		audioEngine.seekMusic(
			Math.min(audioEngine.musicCurrentTime + 5, audioEngine.musicDuration),
		);
	}, []);

	useKeyBindingAtom(keySeekBackwardAtom, () => {
		audioEngine.seekMusic(Math.max(audioEngine.musicCurrentTime - 5, 0));
	}, []);

	useKeyBindingAtom(keyVolumeUpAtom, () => {
		store.set(volumeAtom, (v) => Math.min(1, v + 0.1));
	}, [store]);

	useKeyBindingAtom(keyVolumeDownAtom, () => {
		store.set(volumeAtom, (v) => Math.max(0, v - 0.1));
	}, [store]);

	useKeyBindingAtom(keyPlaybackRateUpAtom, () => {
		store.set(playbackRateAtom, (v) => stepPlaybackRate(v, 1));
	}, [store]);

	useKeyBindingAtom(keyPlaybackRateDownAtom, () => {
		store.set(playbackRateAtom, (v) => stepPlaybackRate(v, -1));
	}, [store]);

	useKeyBindingAtom(keyPlaybackRateResetAtom, () => {
		store.set(playbackRateAtom, 1);
	}, [store]);

	return null;
});

// Never wrap or shrink: the inherited overflow-wrap breaks off the last digit
// when the fallback monospace font (Menlo on macOS) runs wider than min-width.
const timeLabelStyle: CSSProperties = {
	minWidth: "5.5em",
	flexShrink: 0,
	whiteSpace: "nowrap",
	fontVariantNumeric: "tabular-nums",
	color: "var(--audio-bar-text, inherit)",
	fontFamily: "var(--timestamp-font-family)",
};

const CurrentTimeLabel: FC = () => {
	const currentTime = useAtomValue(currentTimeAtom);
	return (
		<Text size="2" style={{ ...timeLabelStyle, textAlign: "left" }}>
			{msToTimestamp(currentTime)}
		</Text>
	);
};

export const AudioControls: FC = memo(() => {
	const [audioLoaded, setAudioLoaded] = useState(false);
	const [playbackRate, setPlaybackRate] = useAtom(playbackRateAtom);
	const [preservesPitch, setPreservesPitch] = useAtom(preservesPitchAtom);
	const [spectrogramVisible, setSpectrogramVisible] = useState(false);
	const currentDuration = useAtomValue(currentDurationAtom);
	const [audioPlaying, setAudioPlaying] = useAtom(audioPlayingAtom);
	const [volume, setVolume] = useAtom(volumeAtom);
	const { loadAudio: onLoadMusic } = useLoadAudio();
	const { t } = useTranslation();

	const onTogglePlay = useCallback(() => {
		if (audioEngine.musicPlaying) {
			audioEngine.pauseMusic();
		} else {
			audioEngine.resumeOrSeekMusic();
		}
	}, []);

	useEffect(() => {
		const onMusicLoad = () => {
			setAudioLoaded(true);
			setAudioPlaying(false);
		};
		const onMusicUnload = () => {
			setAudioLoaded(false);
			setAudioPlaying(false);
		};
		const onMusicPause = () => {
			setAudioPlaying(false);
		};
		const onMusicResume = () => {
			setAudioPlaying(true);
		};
		const onVolumeChange = () => {
			setVolume(audioEngine.volume);
		};
		setAudioLoaded(audioEngine.musicLoaded);
		setAudioPlaying(audioEngine.musicPlaying);
		audioEngine.addEventListener("music-load", onMusicLoad);
		audioEngine.addEventListener("music-unload", onMusicUnload);
		audioEngine.addEventListener("music-pause", onMusicPause);
		audioEngine.addEventListener("music-resume", onMusicResume);
		audioEngine.addEventListener("volume-change", onVolumeChange);
		return () => {
			audioEngine.removeEventListener("music-load", onMusicLoad);
			audioEngine.removeEventListener("music-unload", onMusicUnload);
			audioEngine.removeEventListener("music-pause", onMusicPause);
			audioEngine.removeEventListener("music-resume", onMusicResume);
			audioEngine.removeEventListener("volume-change", onVolumeChange);
		};
	}, [setAudioPlaying, setVolume]);

	useEffect(() => {
		audioEngine.volume = volume;
	}, [volume]);

	useEffect(() => {
		audioEngine.musicPlayBackRate = playbackRate;
	}, [playbackRate]);

	useEffect(() => {
		audioEngine.preservesPitch = preservesPitch;
	}, [preservesPitch]);

	return (
		<Card
			data-guide-target="audio"
			m="0"
			style={
				{
					backgroundColor: "var(--audio-bar-bg, var(--rt-color-panel-solid))",
					height: "100%",
					minHeight: 0,
					borderRadius: 0,
					// borderRadius alone leaves the Inset and card background rounded.
					"--card-border-radius": "0px",
				} as CSSProperties
			}
		>
			<Inset>
				<AudioPlaybackKeyBinding />
				<AuditionKeyBinding />
				<Flex direction="column">
					<div style={{ display: spectrogramVisible ? "flex" : "none" }}>
						<AudioSpectrogram />
					</div>
					<Flex
						align="center"
						px="2"
						gapX="2"
						data-guide-target="audio-playback-bar"
					>
						<Popover.Root>
							<Tooltip
								content={t("audioPanel.audioMenu", "Audio and playback")}
							>
								<Popover.Trigger>
									<IconButton
										my="2"
										variant="soft"
										aria-label={t("audioPanel.audioMenu", "Audio and playback")}
									>
										<MusicNote2Filled />
									</IconButton>
								</Popover.Trigger>
							</Tooltip>
							<Popover.Content side="top" align="start">
								<Flex direction="column" gap="3">
									<Popover.Close>
										<Button variant="soft" onClick={onLoadMusic}>
											{t("spectrogram.loadAudio", "Load audio file")}
										</Button>
									</Popover.Close>
									<Grid columns="0fr 7em 2.5em" gap="2" align="center">
										<Text wrap="nowrap">
											{t("audioPanel.volume", "Volume")}
										</Text>
										<LabeledSlider
											label={t("audioPanel.volume", "Volume")}
											min={0}
											max={1}
											value={[volume]}
											step={0.01}
											onValueChange={(v) => setVolume(v[0])}
										/>
										<Text wrap="nowrap" color="gray" size="1">
											{(volume * 100).toFixed()}%
										</Text>
										<Text wrap="nowrap">
											{t("audioPanel.playbackRate", "Playback speed")}
										</Text>
										<LabeledSlider
											label={t("audioPanel.playbackRate", "Playback speed")}
											min={MIN_PLAYBACK_RATE}
											max={MAX_PLAYBACK_RATE}
											value={[playbackRate]}
											step={0.05}
											onValueChange={(v) => setPlaybackRate(v[0])}
										/>
										<Text wrap="nowrap" color="gray" size="1">
											{playbackRate.toFixed(2)}x
										</Text>
										<Text wrap="nowrap">
											{t("audioPanel.preservesPitch", "Preserve pitch")}
										</Text>
										<Switch
											checked={preservesPitch}
											onCheckedChange={setPreservesPitch}
											aria-label={t(
												"audioPanel.preservesPitch",
												"Preserve pitch",
											)}
										/>
									</Grid>
								</Flex>
							</Popover.Content>
						</Popover.Root>
						<Tooltip content={t("audioPanel.playPause", "暂停 / 播放音乐")}>
							<IconButton
								my="2"
								ml="0"
								variant="soft"
								disabled={!audioLoaded}
								onClick={onTogglePlay}
								aria-label={t("audioPanel.playPause", "Play / pause music")}
								aria-pressed={audioPlaying}
							>
								{audioPlaying ? <PauseFilled /> : <PlayFilled />}
							</IconButton>
						</Tooltip>
						<CurrentTimeLabel />
						<AudioSlider />
						<Text size="2" style={timeLabelStyle}>
							{msToTimestamp(currentDuration)}
						</Text>
						<Tooltip
							content={t("audioPanel.expandSpectrogram", "展开 / 收起频谱图")}
						>
							<IconButton
								my="2"
								ml="0"
								variant="soft"
								onClick={() => setSpectrogramVisible(!spectrogramVisible)}
								aria-label={t(
									"audioPanel.expandSpectrogram",
									"Expand / collapse spectrogram",
								)}
								aria-expanded={spectrogramVisible}
							>
								{spectrogramVisible ? (
									<ChevronDownFilled />
								) : (
									<ChevronUpFilled />
								)}
							</IconButton>
						</Tooltip>
					</Flex>
				</Flex>
			</Inset>
		</Card>
	);
});

export default AudioControls;

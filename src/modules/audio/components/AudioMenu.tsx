import { MusicNote2Filled } from "@fluentui/react-icons";
import {
	Button,
	IconButton,
	Popover,
	Slider,
	Switch,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";
import { type ComponentProps, type FC, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLoadAudio } from "$/hooks/useLoadAudio";
import {
	audioCoverArtAtom,
	currentDurationAtom,
	loadedAudioAtom,
	playbackRateAtom,
	preservesPitchAtom,
	volumeAtom,
} from "$/modules/audio/states";
import {
	MAX_PLAYBACK_RATE,
	MIN_PLAYBACK_RATE,
} from "$/modules/audio/utils/playback-rate";
import styles from "./AudioMenu.module.css";

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

/** `m:ss`, or `h:mm:ss` past an hour. */
function formatDuration(ms: number): string {
	const total = Math.round(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor(total / 60) % 60;
	const s = String(total % 60).padStart(2, "0");
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** The song being synced, with load or replace. */
const SongSlot: FC = () => {
	const { t } = useTranslation();
	const { loadAudio } = useLoadAudio();
	const audio = useAtomValue(loadedAudioAtom);
	const cover = useAtomValue(audioCoverArtAtom);
	const duration = useAtomValue(currentDurationAtom);
	const name = audio instanceof File ? audio.name : null;
	const loaded = audio.size > 0;

	const art = cover ? (
		<img className={styles.cover} src={cover} alt="" />
	) : (
		<div className={styles.coverPlaceholder} aria-hidden>
			<MusicNote2Filled />
		</div>
	);

	if (!loaded) {
		return (
			<div className={classNames(styles.song, styles.songEmpty)}>
				{art}
				<Text size="2" color="gray">
					{t("audioPanel.noAudio", "No audio loaded")}
				</Text>
				<Popover.Close>
					<Button className={styles.loadEmpty} onClick={loadAudio}>
						{t("spectrogram.loadAudio", "Load audio file")}
					</Button>
				</Popover.Close>
			</div>
		);
	}

	return (
		<div className={styles.song}>
			{art}
			<div className={styles.songText}>
				<Text
					size="2"
					weight="medium"
					className={styles.songName}
					title={name ?? undefined}
				>
					{name ?? t("audioPanel.loadedAudio", "Loaded audio")}
				</Text>
				<Text size="1" color="gray" className={styles.value}>
					{formatDuration(duration)}
				</Text>
			</div>
			<Popover.Close>
				<Button size="1" variant="soft" onClick={loadAudio}>
					{t("audioPanel.replaceAudio", "Replace")}
				</Button>
			</Popover.Close>
		</div>
	);
};

/** The audio bar's music note: the loaded song, then how it plays. */
export const AudioMenu: FC = () => {
	const { t } = useTranslation();
	const [volume, setVolume] = useAtom(volumeAtom);
	const [playbackRate, setPlaybackRate] = useAtom(playbackRateAtom);
	const [preservesPitch, setPreservesPitch] = useAtom(preservesPitchAtom);
	const menuLabel = t("audioPanel.audioMenu", "Audio and playback");

	return (
		<Popover.Root>
			<Tooltip content={menuLabel}>
				<Popover.Trigger>
					<IconButton my="2" variant="soft" aria-label={menuLabel}>
						<MusicNote2Filled />
					</IconButton>
				</Popover.Trigger>
			</Tooltip>
			<Popover.Content side="top" align="start" width="288px">
				<div className={styles.menu}>
					<SongSlot />
					<div className={styles.row}>
						<div className={styles.rowHead}>
							<Text size="2">{t("audioPanel.volume", "Volume")}</Text>
							<Text size="2" color="gray" className={styles.value}>
								{Math.round(volume * 100)}%
							</Text>
						</div>
						<LabeledSlider
							label={t("audioPanel.volume", "Volume")}
							min={0}
							max={1}
							step={0.01}
							value={[volume]}
							onValueChange={(v) => setVolume(v[0])}
						/>
					</div>
					<div className={styles.row}>
						<div className={styles.rowHead}>
							<Text size="2">
								{t("audioPanel.playbackRate", "Playback speed")}
							</Text>
							{playbackRate === 1 ? (
								<Text size="2" color="gray" className={styles.value}>
									1.00×
								</Text>
							) : (
								// The slider already announces the value; this names the action.
								<Tooltip content={t("audioPanel.resetSpeed", "Reset to 1×")}>
									<Button
										size="1"
										variant="ghost"
										color="gray"
										className={styles.value}
										onClick={() => setPlaybackRate(1)}
										aria-label={t("audioPanel.resetSpeed", "Reset to 1×")}
									>
										{playbackRate.toFixed(2)}×
									</Button>
								</Tooltip>
							)}
						</div>
						<LabeledSlider
							label={t("audioPanel.playbackRate", "Playback speed")}
							min={MIN_PLAYBACK_RATE}
							max={MAX_PLAYBACK_RATE}
							step={0.05}
							value={[playbackRate]}
							onValueChange={(v) => setPlaybackRate(v[0])}
						/>
					</div>
					<Text as="label" size="2" className={styles.rowHead}>
						{t("audioPanel.preservesPitch", "Preserve pitch")}
						<Switch
							checked={preservesPitch}
							onCheckedChange={setPreservesPitch}
						/>
					</Text>
				</div>
			</Popover.Content>
		</Popover.Root>
	);
};

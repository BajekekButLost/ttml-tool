import { type FC, memo } from "react";
import { useAudioSpectrogram } from "../hooks/useAudioSpectrogram";
import { SpectrogramView } from "./SpectrogramView";

export const AudioSpectrogram: FC = memo(() => {
	const state = useAudioSpectrogram();
	return <SpectrogramView {...state} />;
});

export default AudioSpectrogram;

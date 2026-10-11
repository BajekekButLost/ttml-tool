import { useStore } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { audioEngine } from "$/modules/audio/audio-engine";
import { maybePromptCreateProject } from "$/modules/project/folder-project/project-create";
import { AUDIO_EXTENSIONS, AUDIO_FILE_FILTERS } from "$/utils/audio-formats";
import { openFileWithDialog } from "$/utils/fileDialog";
import { error as logError } from "$/utils/logging";
import { loadAudioFile } from "./load-audio";

/** Audio buttons and file drops share validation, project state and errors. */
export function useLoadAudio() {
	const store = useStore();
	const { t } = useTranslation();
	const openAudioFile = useCallback(
		async (file: File, forceExt?: string) => {
			const ext =
				forceExt?.toLowerCase() ??
				file.name.split(".").pop()?.toLowerCase() ??
				"";
			if (!AUDIO_EXTENSIONS.has(ext)) {
				toast.error(
					t("error.unsupportedFileFormat", "Unsupported file format: {ext}", {
						ext,
					}),
				);
				return;
			}
			try {
				const loaded = await loadAudioFile(store, file, (audio) =>
					audioEngine.loadMusic(audio),
				);
				if (loaded) maybePromptCreateProject(store);
			} catch (error) {
				logError(`Failed to load audio: ${file.name}`, error);
				toast.error(t("error.openFileFailed", "Failed to open file"));
			}
		},
		[store, t],
	);

	const loadAudio = useCallback(async () => {
		try {
			const file = await openFileWithDialog({
				multiple: false,
				filters: AUDIO_FILE_FILTERS,
			});
			if (file && !Array.isArray(file)) await openAudioFile(file);
		} catch (error) {
			logError("Failed to pick audio", error);
			toast.error(t("error.openFileFailed", "Failed to open file"));
		}
	}, [openAudioFile, t]);
	return { loadAudio, openAudioFile };
}

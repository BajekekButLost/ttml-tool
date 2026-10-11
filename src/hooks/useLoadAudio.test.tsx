// @vitest-environment jsdom
import { createStore, Provider } from "jotai";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$/modules/audio/audio-engine", () => ({
	audioEngine: { loadMusic: vi.fn(async () => undefined) },
}));
vi.mock("$/modules/project/autosave/autosave", () => ({
	getProjectList: vi.fn(),
}));
vi.mock("$/modules/project/folder-project/project-create", () => ({
	maybePromptCreateProject: vi.fn(),
}));
vi.mock("$/utils/fileDialog", () => ({ openFileWithDialog: vi.fn() }));
vi.mock("$/utils/logging", () => ({ log: vi.fn(), error: vi.fn() }));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({ toast: { error: vi.fn() } }));

import { toast } from "react-toastify";
import { audioEngine } from "$/modules/audio/audio-engine";
import { maybePromptCreateProject } from "$/modules/project/folder-project/project-create";
import {
	activeProjectDirAtom,
	pendingAudioFileAtom,
	pendingAudioPathAtom,
	projectAudioFileAtom,
} from "$/modules/project/folder-project/state";
import { AUDIO_FILE_FILTERS } from "$/utils/audio-formats";
import { openFileWithDialog } from "$/utils/fileDialog";
import { useLoadAudio } from "./useLoadAudio";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("audio picker and window-drop entry points", () => {
	let root: Root;
	let store: ReturnType<typeof createStore>;
	let opener: ReturnType<typeof useLoadAudio>;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(openFileWithDialog).mockReset();
		store = createStore();
		root = createRoot(document.createElement("div"));
		function Harness() {
			opener = useLoadAudio();
			return null;
		}
		await act(async () => {
			root.render(
				<Provider store={store}>
					<Harness />
				</Provider>,
			);
		});
	});
	afterEach(async () => {
		await act(async () => root.unmount());
	});

	it("uses the common filters and leaves state alone when cancelled", async () => {
		vi.mocked(openFileWithDialog).mockResolvedValueOnce(null);
		await act(async () => opener.loadAudio());
		expect(openFileWithDialog).toHaveBeenCalledWith({
			multiple: false,
			filters: AUDIO_FILE_FILTERS,
		});
		expect(audioEngine.loadMusic).not.toHaveBeenCalled();
		expect(toast.error).not.toHaveBeenCalled();
	});

	it.each([
		"picker",
		"drop",
	])("loads uppercase AAC from %s with the same project and linked-path tracking", async (source) => {
		store.set(activeProjectDirAtom, "C:/Project");
		const file = Object.assign(new File([], "song.AAC"), {
			path: "C:/Music/song.AAC",
		});
		vi.mocked(openFileWithDialog).mockResolvedValueOnce(file);
		await act(async () => {
			if (source === "picker") await opener.loadAudio();
			else await opener.openAudioFile(file);
		});
		expect(audioEngine.loadMusic).toHaveBeenCalledWith(file);
		expect(store.get(projectAudioFileAtom)).toBe(file);
		expect(store.get(pendingAudioPathAtom)).toBe(file.path);
		expect(maybePromptCreateProject).toHaveBeenCalledOnce();
	});

	it("reports picker/read failures using the common error toast", async () => {
		vi.mocked(openFileWithDialog).mockRejectedValueOnce(
			new Error("read failed"),
		);
		await act(async () => opener.loadAudio());
		expect(toast.error).toHaveBeenCalledWith("error.openFileFailed");
		expect(audioEngine.loadMusic).not.toHaveBeenCalled();
	});

	it.each([
		"picker",
		"drop",
	])("reports decode failures from %s without offering to create a project", async (source) => {
		const file = new File([], "broken.mp3");
		vi.mocked(openFileWithDialog).mockResolvedValueOnce(file);
		vi.mocked(audioEngine.loadMusic).mockRejectedValueOnce(
			new Error("decode failed"),
		);
		await act(async () => {
			if (source === "picker") await opener.loadAudio();
			else await opener.openAudioFile(file);
		});
		expect(toast.error).toHaveBeenCalledWith("error.openFileFailed");
		expect(store.get(pendingAudioFileAtom)).toBeNull();
		expect(maybePromptCreateProject).not.toHaveBeenCalled();
	});

	it("rejects non-audio selections without replacing editor lyrics", async () => {
		vi.mocked(openFileWithDialog).mockResolvedValueOnce(
			new File([], "song.ttml"),
		);
		await act(async () => opener.loadAudio());
		expect(toast.error).toHaveBeenCalledWith("error.unsupportedFileFormat");
		expect(audioEngine.loadMusic).not.toHaveBeenCalled();
	});
});

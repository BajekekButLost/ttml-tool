import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";
import {
	activeProjectDirAtom,
	activeProjectManifestAtom,
	pendingAudioFileAtom,
	pendingAudioPathAtom,
	projectAudioFileAtom,
} from "$/modules/project/folder-project/state";
import { projectIdAtom } from "$/states/main";
import { AUDIO_EXTENSIONS, AUDIO_FILE_FILTERS } from "$/utils/audio-formats";
import { getDialogPath, loadAudioFile } from "./load-audio";

describe("shared audio load", () => {
	it("uses the union of old picker and opener formats", () => {
		expect(AUDIO_FILE_FILTERS[0].extensions).toEqual([...AUDIO_EXTENSIONS]);
		for (const ext of [
			"mp3",
			"flac",
			"wav",
			"ogg",
			"m4a",
			"aac",
			"opus",
			"webm",
			"weba",
			"oga",
			"mid",
			"aiff",
			"wma",
			"au",
		]) {
			expect(AUDIO_EXTENSIONS.has(ext)).toBe(true);
		}
	});

	it("records the selected file and safe desktop path after decoding", async () => {
		const store = createStore();
		const audio = Object.assign(new File(["music"], "song.mp3"), {
			path: "C:/Music/song.mp3",
		});
		const decode = vi.fn(async () => undefined);
		await loadAudioFile(store, audio, decode);
		expect(decode).toHaveBeenCalledWith(audio);
		expect(store.get(pendingAudioFileAtom)).toBe(audio);
		expect(store.get(pendingAudioPathAtom)).toBe(audio.path);
		expect(store.get(projectAudioFileAtom)).toBeNull();
	});

	it("updates folder and linked-project audio without renaming their existing paths", async () => {
		const store = createStore();
		store.set(activeProjectDirAtom, "C:/Project");
		const manifest = {
			version: 1 as const,
			name: "Song",
			lyricFile: "old.ttml",
			audioFile: "old.mp3",
			linked: { lyricPath: "C:/Music/old.ttml", audioPath: "C:/Music/old.mp3" },
		};
		store.set(activeProjectManifestAtom, manifest);
		const audio = new File([], "new.mp3");
		await loadAudioFile(store, audio, async () => undefined);
		expect(store.get(projectAudioFileAtom)).toBe(audio);
		expect(store.get(activeProjectManifestAtom)).toBe(manifest);
	});

	it("doesn't retain failed/cancelled audio as a pending project file", async () => {
		const store = createStore();
		const previous = new File([], "previous.mp3");
		store.set(pendingAudioFileAtom, previous);
		await expect(
			loadAudioFile(store, new File([], "broken.mp3"), async () => {
				throw new Error("decode failed");
			}),
		).rejects.toThrow("decode failed");
		expect(store.get(pendingAudioFileAtom)).toBe(previous);
	});

	it("doesn't attach a delayed load to a project opened during decoding", async () => {
		const store = createStore();
		store.set(activeProjectDirAtom, "C:/Old");
		await loadAudioFile(store, new File([], "song.mp3"), async () => {
			store.set(activeProjectDirAtom, "C:/New");
		});
		expect(store.get(projectAudioFileAtom)).toBeNull();
		expect(store.get(pendingAudioFileAtom)).toBeNull();
	});

	it("rejects unsafe or non-string file paths", () => {
		for (const path of ["../song.mp3", "C:/Music/../song.mp3", 42, undefined]) {
			expect(
				getDialogPath(Object.assign(new File([], "song.mp3"), { path })),
			).toBeNull();
		}
	});

	it("keeps a successful load when a save refreshes the same project manifest", async () => {
		const store = createStore();
		store.set(activeProjectDirAtom, "C:/Project");
		const audio = new File([], "song.mp3");
		await loadAudioFile(store, audio, async () => {
			store.set(activeProjectManifestAtom, {
				version: 1,
				name: "Song",
				audioFile: "song.mp3",
				lyricFile: "song.ttml",
			});
		});
		expect(store.get(projectAudioFileAtom)).toBe(audio);
	});

	it("doesn't retain delayed audio after changing lyric documents without a folder", async () => {
		const store = createStore();
		const loaded = await loadAudioFile(
			store,
			new File([], "song.mp3"),
			async () => {
				store.set(projectIdAtom, "another-document");
			},
		);
		expect(loaded).toBe(false);
		expect(store.get(pendingAudioFileAtom)).toBeNull();
	});
});

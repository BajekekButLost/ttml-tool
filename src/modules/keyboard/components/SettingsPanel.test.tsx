// @vitest-environment jsdom
import { Theme } from "@radix-ui/themes";
import { createStore, Provider } from "jotai";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extraKeyBindingsStorageKey,
	keyBindingListAtom,
} from "../binding-list";
import { cmdSyncStart } from "../commands";
import { AutoKeyBindingSettingsPanel } from "./SettingsPanel";

// Node's own localStorage stub shadows jsdom's; use a plain in-memory one.
const data = vi.hoisted(() => {
	const data = new Map<string, string>();
	vi.stubGlobal("localStorage", {
		getItem: (name: string) => data.get(name) ?? null,
		setItem: (name: string, value: string) => data.set(name, String(value)),
		removeItem: (name: string) => data.delete(name),
		clear: () => data.clear(),
	});
	return data;
});
(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup = () => {};
beforeEach(() => data.clear());
afterEach(() => cleanup());

const EXTRA_KEY = extraKeyBindingsStorageKey(cmdSyncStart.id);

function mount() {
	data.set(`keybindings:${cmdSyncStart.id}`, JSON.stringify(["KeyJ"]));
	data.set(EXTRA_KEY, JSON.stringify([["KeyZ"]]));
	const store = createStore();
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	act(() =>
		root.render(
			<Provider store={store}>
				<Theme>
					<AutoKeyBindingSettingsPanel />
				</Theme>
			</Provider>,
		),
	);
	cleanup = () => {
		act(() => root.unmount());
		container.remove();
	};
	return { store, container };
}

function rowButton(container: HTMLElement, text: string) {
	const field = [...container.querySelectorAll("input")].find(
		(input) => input.value === "J",
	);
	const row = field?.closest(".rt-Flex");
	const button = [...(row?.querySelectorAll("button") ?? [])].find(
		(candidate) => candidate.textContent === text,
	);
	if (!button) throw new Error(`No ${text} button in the sync start row`);
	return button;
}

async function click(button: HTMLButtonElement) {
	await act(async () => button.click());
}

describe("shortcut rows", () => {
	it("clears the extra keys along with the primary", async () => {
		const { store, container } = mount();
		expect(store.get(keyBindingListAtom(cmdSyncStart))).toEqual([
			["KeyJ"],
			["KeyZ"],
		]);
		await click(rowButton(container, "settingsDialog.keybindings.clear"));
		expect(store.get(keyBindingListAtom(cmdSyncStart))).toEqual([[]]);
		expect(data.has(EXTRA_KEY)).toBe(false);
	});

	it("resets to the default and drops the extra keys", async () => {
		const { store, container } = mount();
		await click(
			rowButton(container, "settingsDialog.keybindings.resetDefault"),
		);
		expect(store.get(keyBindingListAtom(cmdSyncStart))).toEqual([
			cmdSyncStart.defaultKeys,
		]);
		expect(data.has(EXTRA_KEY)).toBe(false);
	});
});

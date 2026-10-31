import {
	formatKeyBindings,
	formatKeyBindingsAsArray,
	shortcutKeyFromEvent,
} from "$/utils/keybindings";
import type { KeyBindingsConfig } from "../types";
import { isModifierCode, layoutLabel } from "./layouts";
import type { KeyboardLayoutInfo } from "./use-keyboard-layout";

// Keys that only appear on caps, never in a saved shortcut's usual wording.
const CAP_ONLY_LABELS: Record<string, string> = {
	CapsLock: "Caps",
	ContextMenu: "Menu",
};

/** What a key cap prints, following the user's layout where it is known. */
export function capLabel(code: string, layout: KeyboardLayoutInfo): string {
	if (isModifierCode(code)) return formatKeyBindingsAsArray([code])[0];
	const reported = layout.labels?.get(code);
	if (reported && reported.trim().length === 1) return reported.toUpperCase();
	return (
		layoutLabel(layout.layout, code) ??
		CAP_ONLY_LABELS[code] ??
		formatKeyBindingsAsArray([code])[0]
	);
}

// Narrow caps print a short form; the full name stays in labels and combos.
const CAP_FACE_LABELS: Record<string, string> = {
	Backspace: "Bksp",
	Insert: "Ins",
	Delete: "Del",
	PageUp: "PgUp",
	PageDown: "PgDn",
};

/** The text on the cap itself, shortened where the full name doesn't fit. */
export function capFaceLabel(code: string, layout: KeyboardLayoutInfo): string {
	return CAP_FACE_LABELS[code] ?? capLabel(code, layout);
}

export function capShortcutKey(
	code: string,
	layout: KeyboardLayoutInfo,
): string {
	const key = layout.labels?.get(code) ?? layoutLabel(layout.layout, code);
	return key ? shortcutKeyFromEvent({ code, key }) : code;
}

export function formatViewCombo(
	binding: KeyBindingsConfig,
	_layout: KeyboardLayoutInfo,
): string {
	return formatKeyBindings(binding);
}

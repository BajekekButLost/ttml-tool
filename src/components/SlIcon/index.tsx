import type { FluentIcon } from "@fluentui/react-icons";
import {
	BookmarkOffRegular,
	BookmarkRegular,
	PeopleRegular,
	PersonVoiceRegular,
	TextFontRegular,
	TranslateRegular,
	WarningRegular,
} from "@fluentui/react-icons";
import { useMemo } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { type SlIconName, slGlyphMarkup } from "./glyphs";
import styles from "./index.module.css";

export type { SlIconName } from "./glyphs";

/** The Fluent icon each glyph stands in for outside the Spicy Lyrics design. */
const FALLBACKS: Record<SlIconName, FluentIcon> = {
	background: PersonVoiceRegular,
	duet: PeopleRegular,
	translation: TranslateRegular,
	romanization: TextFontRegular,
	section: BookmarkRegular,
	sectionRemoved: BookmarkOffRegular,
	warning: WarningRegular,
};

/**
 * An icon that draws the Spicy Lyrics glyph while that design is on and its
 * Fluent icon otherwise. Its colour comes from `currentColor`.
 */
export function SlIcon({
	name,
	label,
	className,
}: {
	name: SlIconName;
	/** Names the icon for assistive tech; leave out when it's decorative. */
	label?: string;
	className?: string;
}) {
	const Fallback = FALLBACKS[name];
	// Built once per icon, so its cut-out mask keeps one id.
	const glyph = useMemo(() => ({ __html: slGlyphMarkup(name) }), [name]);
	return (
		<span
			className={className ? `${styles.icon} ${className}` : styles.icon}
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
		>
			<span
				className={styles.sl}
				// The glyph markup is built from constants, never from input.
				// biome-ignore lint/security/noDangerouslySetInnerHtml: see above
				dangerouslySetInnerHTML={glyph}
			/>
			<span className={styles.fallback}>
				<Fallback />
			</span>
		</span>
	);
}

const fallbackMarkup = new Map<SlIconName, string>();

/** The Fluent icon's markup, rendered once and reused. */
function fallbackHtml(name: SlIconName): string {
	let html = fallbackMarkup.get(name);
	if (html === undefined) {
		const Fallback = FALLBACKS[name];
		const container = document.createElement("span");
		const root = createRoot(container);
		flushSync(() => root.render(<Fallback />));
		html = container.innerHTML;
		root.unmount();
		fallbackMarkup.set(name, html);
	}
	return html;
}

/** The same icon as a plain element, for DOM built outside React (editor gutters). */
export function slIconElement(name: SlIconName, label?: string): HTMLElement {
	const icon = document.createElement("span");
	icon.className = styles.icon;
	if (label) {
		icon.setAttribute("role", "img");
		icon.setAttribute("aria-label", label);
		icon.title = label;
	} else icon.setAttribute("aria-hidden", "true");
	const sl = document.createElement("span");
	sl.className = styles.sl;
	sl.innerHTML = slGlyphMarkup(name);
	const fallback = document.createElement("span");
	fallback.className = styles.fallback;
	fallback.innerHTML = fallbackHtml(name);
	icon.append(sl, fallback);
	return icon;
}

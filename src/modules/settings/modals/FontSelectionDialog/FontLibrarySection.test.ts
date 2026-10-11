import { createInstance } from "i18next";
import {
	Children,
	type CSSProperties,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import { describe, expect, it, vi } from "vitest";
import { FontLibrarySection } from "./FontLibrarySection";

type CardProps = {
	children?: ReactNode;
	style?: CSSProperties;
	onClick?: () => void;
};

function findFontCard(
	node: ReactNode,
	font: string,
): ReactElement<CardProps> | undefined {
	let match: ReactElement<CardProps> | undefined;
	Children.forEach(node, (child) => {
		if (!isValidElement<CardProps>(child)) return;
		if (child.key === font) match = child;
		else match ??= findFontCard(child.props.children, font);
	});
	return match;
}

describe("system font selection", () => {
	it("highlights the value saved by clicking a system font", async () => {
		const i18n = createInstance();
		await i18n.init({ lng: "en-US", resources: {} });
		const handleSelectFont = vi.fn();
		const props = {
			t: i18n.t,
			appFont: "Inter",
			appFontWeight: "400",
			appFontStyle: "normal",
			filteredGoogleFonts: [],
			filteredSystemFonts: ["Arial"],
			handleSelectFont,
		};
		const before = findFontCard(FontLibrarySection(props), "Arial");
		expect(before?.props.style?.border).toBe("none");
		before?.props.onClick?.();
		expect(handleSelectFont).toHaveBeenCalledWith("Arial", false);
		const after = findFontCard(
			FontLibrarySection({ ...props, appFont: "Arial" }),
			"Arial",
		);
		expect(after?.props.style?.border).toBe("2px solid var(--accent-9)");
	});
});

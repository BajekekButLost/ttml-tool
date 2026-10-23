import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChangeMarkdown, releaseColor } from "./change-notes.tsx";

describe("change note rendering", () => {
	it("renders formatted spans, nested code, links, and migrated italics", () => {
		expect(
			renderToStaticMarkup(
				<ChangeMarkdown
					text={
						"Use **bold `code`**, *italics*, and [help](https://example.com)."
					}
				/>,
			),
		).toBe(
			'Use <strong>bold <code>code</code></strong>, <em>italics</em>, and <a href="https://example.com" target="_blank" rel="noreferrer">help</a>.',
		);
	});
	it("escapes HTML and leaves unsafe link destinations as plain text", () => {
		const output = renderToStaticMarkup(
			<ChangeMarkdown
				text={"<img src=x> [bad](javascript:alert) `**literal**`"}
			/>,
		);
		expect(output).toBe(
			"&lt;img src=x&gt; [bad](javascript:alert) <code>**literal**</code>",
		);
	});
	it("falls back to blue for unknown release colors", () => {
		expect(releaseColor("iris")).toBe("iris");
		expect(releaseColor("invalid")).toBe("blue");
	});
});

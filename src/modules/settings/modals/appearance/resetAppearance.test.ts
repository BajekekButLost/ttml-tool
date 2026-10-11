import { describe, expect, it, vi } from "vitest";
import {
	type AdvancedOverrideSetters,
	DEFAULT_LAYOUT_ORDER,
	resetAdvancedOverrides,
} from "./resetAppearance";

describe("resetAdvancedOverrides", () => {
	it("resets every advanced override, including the Genius header color and legacy space labels", () => {
		const setters = new Proxy({} as Record<string, ReturnType<typeof vi.fn>>, {
			get: (target, key: string) => {
				target[key] ??= vi.fn();
				return target[key];
			},
		});

		resetAdvancedOverrides(setters as unknown as AdvancedOverrideSetters);

		expect(setters.setVGeniusHeaderColor).toHaveBeenCalledWith("");
		expect(setters.setLegacySpaceLabels).toHaveBeenCalledWith(false);
		expect(setters.setLegacyDarkTheme).toHaveBeenCalledWith(false);
		expect(setters.setVGlobalRadius).toHaveBeenCalledWith(12);
		expect(setters.setLayoutOrder).toHaveBeenCalledWith(DEFAULT_LAYOUT_ORDER);
	});
});

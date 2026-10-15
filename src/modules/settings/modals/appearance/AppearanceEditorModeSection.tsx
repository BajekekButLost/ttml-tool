import { Flex, SegmentedControl } from "@radix-ui/themes";
import { AppearanceEditorMode } from "$/modules/settings/states/index.ts";
import type { AppearanceSectionState } from "./sectionState";
export const AppearanceEditorModeSection = ({
	editorMode,
	setEditorMode,
	t,
}: Pick<AppearanceSectionState, "editorMode" | "setEditorMode" | "t">) => (
	<Flex direction="column" gap="2">
		<SegmentedControl.Root
			value={editorMode}
			onValueChange={(v) => setEditorMode(v as AppearanceEditorMode)}
		>
			<SegmentedControl.Item value={AppearanceEditorMode.Basic}>
				{t("settings.appearance.mode.basic", "Simple layout")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value={AppearanceEditorMode.Advanced}>
				{t("settings.appearance.mode.advanced", "Advanced layout")}
			</SegmentedControl.Item>
		</SegmentedControl.Root>
	</Flex>
);

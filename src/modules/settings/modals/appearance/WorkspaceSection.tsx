import { Layer24Regular } from "@fluentui/react-icons";
import { Card, Flex, Grid, Heading } from "@radix-ui/themes";
import { AdvancedColorItem } from "./AdvancedControls";
import type { AppearanceSectionState } from "./sectionState";
export const WorkspaceSection = ({
	vTitlebarBg,
	setVTitlebarBg,
	vSidebarBg,
	setVSidebarBg,
	vSidebarActive,
	setVSidebarActive,
	vMenuHover,
	setVMenuHover,
	t,
}: Pick<
	AppearanceSectionState,
	| "vTitlebarBg"
	| "setVTitlebarBg"
	| "vSidebarBg"
	| "setVSidebarBg"
	| "vSidebarActive"
	| "setVSidebarActive"
	| "vMenuHover"
	| "setVMenuHover"
	| "t"
>) => (
	<Flex direction="column" gap="3">
		<Heading size="4">
			<Layer24Regular />{" "}
			{t("settings.appearance.advanced.workspace", "Workspace Theme")}
		</Heading>
		<Card>
			<Grid columns="2" gap="3">
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.titlebarBackground",
						"Titlebar Background",
					)}
					value={vTitlebarBg}
					onChange={setVTitlebarBg}
				/>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.sidebarBackground",
						"Sidebar Background",
					)}
					value={vSidebarBg}
					onChange={setVSidebarBg}
				/>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.activeItemHighlight",
						"Active Item Highlight",
					)}
					value={vSidebarActive}
					onChange={setVSidebarActive}
				/>
				<AdvancedColorItem
					label={t(
						"settings.appearance.advanced.menuHoverColor",
						"Menu Hover Color",
					)}
					value={vMenuHover}
					onChange={setVMenuHover}
				/>
			</Grid>
		</Card>
	</Flex>
);

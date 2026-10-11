import {
	Folder20Regular,
	Key20Regular,
	Keyboard20Regular,
	PaintBrush20Regular,
	Settings20Regular,
} from "@fluentui/react-icons";
import type { BackupCategoryId } from "$/modules/settings/backup/types";
export const CATEGORY_ICONS: Record<BackupCategoryId, React.ReactNode> = {
	settings: <Settings20Regular />,
	keybindings: <Keyboard20Regular />,
	assets: <PaintBrush20Regular />,
	projects: <Folder20Regular />,
	apiKeys: <Key20Regular />,
};

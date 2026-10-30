import { DropdownMenu } from "@radix-ui/themes";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { editAsTextDialogAtom } from "../states";

/** Edit > Edit as text. */
export const EditAsTextMenuItem = () => {
	const { t } = useTranslation();
	const openDialog = useSetAtom(editAsTextDialogAtom);
	return (
		<DropdownMenu.Item onSelect={() => openDialog(true)}>
			{t("editAsText.menuItem", "Edit as text...")}
		</DropdownMenu.Item>
	);
};

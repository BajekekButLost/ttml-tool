import { DismissRegular, TextFont24Regular } from "@fluentui/react-icons";
import {
	Button,
	Dialog,
	Flex,
	IconButton,
	VisuallyHidden,
} from "@radix-ui/themes";
import { CustomFontSection } from "./FontSelectionDialog/CustomFontSection";
import { FontLibrarySection } from "./FontSelectionDialog/FontLibrarySection";
import { FontSearchSection } from "./FontSelectionDialog/FontSearchSection";
import { FontStyleSection } from "./FontSelectionDialog/FontStyleSection";
import { useFontSelection } from "./FontSelectionDialog/useFontSelection";

export { GOOGLE_FONTS } from "./FontSelectionDialog/catalog";
export const FontSelectionDialog = () => {
	const state = useFontSelection();
	return (
		<Dialog.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
			<Dialog.Content
				style={{
					maxWidth: 850,
					width: "95vw",
					height: "90vh",
					maxHeight: 900,
					padding: "32px",
				}}
			>
				<VisuallyHidden>
					<Dialog.Description>
						Select a font from standard, system, or Google fonts library.
					</Dialog.Description>
				</VisuallyHidden>
				<Flex justify="between" align="center" mb="5">
					<Flex align="center" gap="3">
						<TextFont24Regular />
						<Dialog.Title mb="0" style={{ fontSize: "32px" }}>
							{state.t("settings.appearance.fontLibrary", "Font Library")}
						</Dialog.Title>
					</Flex>
					<Dialog.Close>
						<IconButton
							variant="ghost"
							color="gray"
							style={{ cursor: "pointer" }}
						>
							<DismissRegular />
						</IconButton>
					</Dialog.Close>
				</Flex>

				<Flex direction="column" gap="5" height="calc(100% - 50px)">
					<FontStyleSection {...state} />

					<FontSearchSection {...state} />

					<CustomFontSection {...state} />

					<FontLibrarySection {...state} />

					<Flex justify="end" pt="2">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								{state.t("common.close", "Close")}
							</Button>
						</Dialog.Close>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

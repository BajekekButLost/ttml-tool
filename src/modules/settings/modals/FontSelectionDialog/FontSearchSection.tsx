import { ArrowUpload24Regular, Search16Regular } from "@fluentui/react-icons";
import { Button, Flex, TextField } from "@radix-ui/themes";
import type { FontSelection } from "./useFontSelection";
export const FontSearchSection = ({
	t,
	searchQuery,
	setSearchQuery,
	fileInputRef,
	handleFileImport,
}: Pick<
	FontSelection,
	"t" | "searchQuery" | "setSearchQuery" | "fileInputRef" | "handleFileImport"
>) => (
	<Flex gap="3" wrap="wrap" align="center">
		<TextField.Root
			placeholder={t("common.search", "Search fonts...")}
			value={searchQuery}
			onChange={(e) => setSearchQuery(e.target.value)}
			style={{ flexGrow: 1, minWidth: "200px" }}
			size="3"
		>
			<TextField.Slot>
				<Search16Regular />
			</TextField.Slot>
		</TextField.Root>

		<input
			type="file"
			accept=".ttf,.otf,.woff,.woff2"
			style={{ display: "none" }}
			ref={fileInputRef}
			onChange={handleFileImport}
		/>
		<Button
			variant="solid"
			size="3"
			onClick={() => fileInputRef.current?.click()}
			style={{ cursor: "pointer" }}
		>
			<ArrowUpload24Regular />
			{t("settings.appearance.importFont", "Import font file")}
		</Button>
	</Flex>
);

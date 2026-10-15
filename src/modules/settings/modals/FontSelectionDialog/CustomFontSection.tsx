import { Delete20Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, IconButton, Text } from "@radix-ui/themes";
import type { FontSelection } from "./useFontSelection";
export const CustomFontSection = ({
	t,
	appFont,
	customFontName,
	handleSelectFont,
	clearCustomFont,
}: Pick<
	FontSelection,
	"t" | "appFont" | "customFontName" | "handleSelectFont" | "clearCustomFont"
>) =>
	customFontName && (
		<Card variant="surface" style={{ backgroundColor: "var(--indigo-3)" }}>
			<Flex align="center" justify="between">
				<Flex direction="column">
					<Text size="1" color="indigo" weight="bold">
						{t("settings.appearance.customFontActive", "Local custom font")}
					</Text>
					<Text
						size="3"
						style={{ fontFamily: `"${customFontName}", sans-serif` }}
					>
						{customFontName}
					</Text>
				</Flex>
				<Flex gap="2">
					<Button
						variant="solid"
						color="indigo"
						size="1"
						onClick={() =>
							handleSelectFont(`"${customFontName}", sans-serif`, false)
						}
						disabled={appFont === `"${customFontName}", sans-serif`}
					>
						{t("common.apply", "Apply")}
					</Button>
					<IconButton
						variant="ghost"
						color="red"
						size="1"
						onClick={clearCustomFont}
					>
						<Delete20Regular />
					</IconButton>
				</Flex>
			</Flex>
		</Card>
	);

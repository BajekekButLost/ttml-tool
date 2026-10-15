import { ArrowReset24Regular, Sparkle24Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, Text } from "@radix-ui/themes";
import {
	type AdvancedOverrideSetters,
	resetAdvancedOverrides,
} from "./resetAppearance";
import type { AppearanceSectionState } from "./sectionState";

export const ResetAdvancedSection = (
	props: AdvancedOverrideSetters & Pick<AppearanceSectionState, "t">,
) => {
	const { t } = props;
	return (
		<Card size="2">
			<Flex direction="column" gap="3">
				<Flex align="center" gap="2" style={{ color: "var(--gray-11)" }}>
					<Sparkle24Regular />
					<Text size="2" color="gray">
						{t(
							"settings.appearance.advanced.masterResetNote",
							"Resets every advanced override on this page.",
						)}
					</Text>
				</Flex>
				<Button
					variant="surface"
					color="red"
					onClick={() => resetAdvancedOverrides(props)}
					style={{ cursor: "pointer" }}
				>
					<ArrowReset24Regular />
					{t(
						"settings.appearance.advanced.resetMaster",
						"Reset all advanced overrides",
					)}
				</Button>
			</Flex>
		</Card>
	);
};

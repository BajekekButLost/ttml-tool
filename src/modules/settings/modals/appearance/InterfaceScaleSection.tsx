import { FullScreenMaximize24Regular } from "@fluentui/react-icons";
import { Button, Card, Flex, Heading, Slider, Text } from "@radix-ui/themes";
import {
	DEFAULT_INTERFACE_SCALE,
	MAX_INTERFACE_SCALE,
	MIN_INTERFACE_SCALE,
} from "$/modules/settings/logic/interface-scale";
import type { AppearanceSectionState } from "./sectionState";
export const InterfaceScaleSection = ({
	interfaceScale,
	setInterfaceScale,
	interfaceScaleDraft,
	setInterfaceScaleDraft,
	t,
}: Pick<
	AppearanceSectionState,
	| "interfaceScale"
	| "setInterfaceScale"
	| "interfaceScaleDraft"
	| "setInterfaceScaleDraft"
	| "t"
>) =>
	import.meta.env.TAURI_ENV_PLATFORM && (
		<Flex direction="column" gap="3">
			<Heading size="4">
				{t("settings.appearance.interfaceScale", "Interface Scale")}
			</Heading>
			<Card>
				<Flex gap="3" align="start">
					<FullScreenMaximize24Regular />
					<Flex direction="column" gap="3" flexGrow="1">
						<Flex align="center" justify="between" gap="3">
							<Flex direction="column" gap="1">
								<Text size="2" weight="bold">
									{Math.round(interfaceScaleDraft * 100)}%
								</Text>
								<Text size="1" color="gray">
									{t(
										"settings.appearance.interfaceScaleDesc",
										"Choose a scale, then apply it. You can also use Ctrl/Cmd +, -, or 0.",
									)}
								</Text>
							</Flex>
							<Flex gap="2">
								<Button
									variant="soft"
									disabled={interfaceScaleDraft === DEFAULT_INTERFACE_SCALE}
									onClick={() =>
										setInterfaceScaleDraft(DEFAULT_INTERFACE_SCALE)
									}
								>
									{t("common.reset", "Reset")}
								</Button>
								<Button
									disabled={interfaceScaleDraft === interfaceScale}
									onClick={() => setInterfaceScale(interfaceScaleDraft)}
								>
									{t("common.apply", "Apply")}
								</Button>
							</Flex>
						</Flex>
						<Slider
							min={MIN_INTERFACE_SCALE}
							max={MAX_INTERFACE_SCALE}
							step={0.05}
							value={[interfaceScaleDraft]}
							onValueChange={(value) => setInterfaceScaleDraft(value[0])}
						/>
					</Flex>
				</Flex>
			</Card>
		</Flex>
	);

import {
	CompassNorthwest24Regular,
	History24Regular,
} from "@fluentui/react-icons";
import {
	Button,
	Flex,
	IconButton,
	Popover,
	Slider,
	Text,
} from "@radix-ui/themes";
import type { AppearanceSectionState } from "./sectionState";
export const GradientPositionControls = ({
	t,
	customGradientType,
	customGradientCenter,
	setCustomGradientCenter,
	customGradientAngle,
	setCustomGradientAngle,
}: Pick<
	AppearanceSectionState,
	| "t"
	| "customGradientType"
	| "customGradientCenter"
	| "setCustomGradientCenter"
	| "customGradientAngle"
	| "setCustomGradientAngle"
>) => (
	<Flex align="center" gap="2">
		<Popover.Root>
			<Popover.Trigger>
				<Button variant="soft" style={{ flexGrow: 1 }}>
					<CompassNorthwest24Regular />
					{t(
						"settings.appearance.gradientPositionSettings",
						"Adjust Center & Angle",
					)}
				</Button>
			</Popover.Trigger>
			<Popover.Content size="2" style={{ width: 300 }}>
				<Flex direction="column" gap="3">
					<Text weight="bold" size="2">
						{t(
							"settings.appearance.gradientPositionSettings",
							"Center & Angle",
						)}
					</Text>

					{customGradientType !== "linear" && (
						<>
							<Text size="1" color="gray">
								{t(
									"settings.appearance.gradientCenterX",
									"Center X (Horizontal)",
								)}
								: {customGradientCenter[0]}%
							</Text>
							<Slider
								min={0}
								max={100}
								step={1}
								value={[customGradientCenter[0]]}
								onValueChange={(v) =>
									setCustomGradientCenter([v[0], customGradientCenter[1]])
								}
							/>

							<Text size="1" color="gray">
								{t(
									"settings.appearance.gradientCenterY",
									"Center Y (Vertical)",
								)}
								: {customGradientCenter[1]}%
							</Text>
							<Slider
								min={0}
								max={100}
								step={1}
								value={[customGradientCenter[1]]}
								onValueChange={(v) =>
									setCustomGradientCenter([customGradientCenter[0], v[0]])
								}
							/>
						</>
					)}

					{customGradientType !== "radial" && (
						<>
							<Text size="1" color="gray">
								{t("settings.appearance.gradientAngle", "Angle")}:{" "}
								{customGradientAngle}°
							</Text>
							<Slider
								min={0}
								max={360}
								step={1}
								value={[customGradientAngle]}
								onValueChange={(v) => setCustomGradientAngle(v[0])}
							/>
						</>
					)}
				</Flex>
			</Popover.Content>
		</Popover.Root>
		<IconButton
			variant="outline"
			onClick={() => {
				setCustomGradientCenter([50, 50]);
				setCustomGradientAngle(45);
			}}
		>
			<History24Regular />
		</IconButton>
	</Flex>
);

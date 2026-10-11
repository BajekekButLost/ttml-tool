import {
	BoxRegular,
	MusicNote1Regular,
	SettingsRegular,
	StarRegular,
} from "@fluentui/react-icons";
import { Box, Card, Flex, Grid, Heading, Link, Text } from "@radix-ui/themes";
import type { AboutSettings } from "./useAboutSettings";
export const CreditsSection = ({ t }: Pick<AboutSettings, "t">) => (
	<Card>
		<Flex direction="column" gap="3">
			<Heading size="3">
				{t("aboutModal.credits", "Credits & Third-Party Notices")}
			</Heading>
			<Text size="2" color="gray">
				{t(
					"aboutModal.creditsIntro",
					"This project includes work adapted from the following open-source projects.",
				)}
			</Text>
			<Grid columns="2" gap="3">
				<Card variant="classic" style={{ padding: "var(--space-3)" }}>
					<Flex direction="column" gap="2">
						<Flex align="center" gap="2">
							<Box style={{ color: "var(--ruby-11)" }}>
								<StarRegular />
							</Box>
							<Heading size="3">Spicy Lyrics</Heading>
						</Flex>
						<Text size="2" color="gray">
							Renderer and font adapted from{" "}
							<Link
								href="https://github.com/Spikerko/Spicy-Lyrics"
								target="_blank"
								rel="noreferrer"
							>
								Spicy Lyrics
							</Link>{" "}
							by Spikerko and contributors, licensed under AGPL-3.0-or-later.
						</Text>
					</Flex>
				</Card>
				<Card variant="classic" style={{ padding: "var(--space-3)" }}>
					<Flex direction="column" gap="2">
						<Flex align="center" gap="2">
							<Box style={{ color: "var(--violet-11)" }}>
								<SettingsRegular />
							</Box>
							<Heading size="3">Fraktality Spring</Heading>
						</Flex>
						<Text size="2" color="gray">
							Analytic spring implementation derived from Fraktality&apos;s{" "}
							<code>spr.lua</code>, licensed under the MIT License.
						</Text>
					</Flex>
				</Card>
				<Card variant="classic" style={{ padding: "var(--space-3)" }}>
					<Flex direction="column" gap="2">
						<Flex align="center" gap="2">
							<Box style={{ color: "var(--cyan-11)" }}>
								<MusicNote1Regular />
							</Box>
							<Heading size="3">Prosodic Engine</Heading>
						</Flex>
						<Text size="2" color="gray">
							Syllabification engine and dictionary adapted from{" "}
							<Link
								href="https://github.com/amll-dev/amll-editor"
								target="_blank"
								rel="noreferrer"
							>
								amll-dev/amll-editor
							</Link>
							, licensed under GNU AGPL-3.0-only.
						</Text>
					</Flex>
				</Card>
				<Card variant="classic" style={{ padding: "var(--space-3)" }}>
					<Flex direction="column" gap="2">
						<Flex align="center" gap="2">
							<Box style={{ color: "var(--gold-11)" }}>
								<BoxRegular />
							</Box>
							<Heading size="3">AMLL TTML Tool</Heading>
						</Flex>
						<Text size="2" color="gray">
							Forked from{" "}
							<Link
								href="https://github.com/amll-dev/amll-ttml-tool"
								target="_blank"
								rel="noreferrer"
							>
								amll-dev/amll-ttml-tool
							</Link>
							, licensed under GPL-3.0-or-later.
						</Text>
					</Flex>
				</Card>
			</Grid>
		</Flex>
	</Card>
);

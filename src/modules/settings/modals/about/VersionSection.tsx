import { BUILD_TIME, GIT_COMMIT } from "virtual:buildmeta";
import { Card, Flex, Link, Text } from "@radix-ui/themes";
import { Children, Fragment, type ReactNode } from "react";
import { openExternal } from "./externalLinks";
import type { AboutSettings } from "./useAboutSettings";

/**
 * ICU returns [text, link] for an element value. Children.toArray would copy
 * React's pending missing-key flag onto the keyed clones, so wrap each part in
 * a fresh keyed Fragment instead.
 */
const keyedParts = (parts: ReactNode) =>
	Children.map(parts, (part, index) => <Fragment key={index}>{part}</Fragment>);

export const VersionSection = ({ t }: Pick<AboutSettings, "t">) => (
	<Card>
		<Flex direction="column" gap="2">
			<Flex direction="column" gap="1">
				<Text as="div" size="2">
					{t("aboutModal.buildDate", "Build Date: {date}", {
						date: BUILD_TIME,
					})}
				</Text>
				<Text as="div" size="2">
					{t("aboutModal.platform", "Platform: {platform}", {
						platform: window.navigator.platform,
					})}
				</Text>
				<Text as="div" size="2">
					{keyedParts(
						t("aboutModal.gitCommit", "Git Commit: {commit}", {
							commit:
								GIT_COMMIT === "unknown" ? (
									t("aboutModal.unknown", "Unknown")
								) : (
									<Link
										href={`https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/commit/${GIT_COMMIT}`}
										target="_blank"
										rel="noreferrer"
										onClick={(event) => {
											if (import.meta.env.TAURI_ENV_PLATFORM) {
												event.preventDefault();
												openExternal(
													`https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/commit/${GIT_COMMIT}`,
												);
											}
										}}
									>
										{GIT_COMMIT}
									</Link>
								),
						}),
					)}
				</Text>
			</Flex>
		</Flex>
	</Card>
);

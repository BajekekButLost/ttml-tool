import { Open16Regular, PeopleTeam24Regular } from "@fluentui/react-icons";
import {
	Avatar,
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import { CONTRIBUTORS_URL, openExternal } from "./externalLinks";
import type { AboutSettings } from "./useAboutSettings";
export const MaintainersSection = ({
	t,
	contributors,
}: Pick<AboutSettings, "t" | "contributors">) => (
	<Card>
		<Flex direction="column" gap="3">
			<Heading size="3">
				{t("aboutModal.maintainers", "Maintainers & contributors")}
			</Heading>
			<Text size="2" color="gray">
				{t("aboutModal.maintainersDesc", "Maintained and developed by:")}
			</Text>
			<Flex gap="2">
				<Box
					p="3"
					style={{
						flex: 1,
						background: "var(--gray-3)",
						borderRadius: "var(--radius-3)",
					}}
				>
					<Flex align="center">
						<Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
							<Avatar
								src="https://avatars.githubusercontent.com/u/191877009?v=4"
								fallback="N"
								size="3"
								radius="small"
							/>
							<Flex direction="column" gap="1">
								<Text as="div" weight="bold">
									NaeNaeTart
								</Text>
								<Text as="div" size="1" color="gray">
									{t("aboutModal.forkMaintainer", "Maintainer & contributor")}
								</Text>
							</Flex>
						</Flex>
						<Button asChild variant="soft" size="1">
							<a
								href="https://yoursit.ee/naenaetart"
								target="_blank"
								rel="noreferrer"
								aria-label={t("aboutModal.visitWebsite", "Visit website")}
							>
								<Open16Regular />
							</a>
						</Button>
					</Flex>
				</Box>
				<Box
					p="3"
					style={{
						flex: 1,
						background: "var(--gray-3)",
						borderRadius: "var(--radius-3)",
					}}
				>
					<Flex align="center">
						<Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
							<Avatar
								src="https://avatars.githubusercontent.com/u/55551133?v=4"
								fallback="T"
								size="3"
								radius="small"
							/>
							<Flex direction="column" gap="1">
								<Text as="div" weight="bold">
									TX24
								</Text>
								<Text as="div" size="1" color="gray">
									{t("aboutModal.forkMaintainer", "Maintainer & contributor")}
								</Text>
							</Flex>
						</Flex>
						<Button asChild variant="soft" size="1">
							<a
								href="https://tx24.dev"
								target="_blank"
								rel="noreferrer"
								aria-label={t("aboutModal.visitWebsite", "Visit website")}
							>
								<Open16Regular />
							</a>
						</Button>
					</Flex>
				</Box>
			</Flex>
			<Flex direction="column" gap="2" pt="1">
				<Flex align="center" justify="between" gap="3" wrap="wrap">
					<Flex align="center" gap="2">
						<Box style={{ color: "var(--accent-11)", display: "flex" }}>
							<PeopleTeam24Regular />
						</Box>
						<Text weight="bold" size="2">
							{t("aboutModal.contributors", "Contributors")}
						</Text>
						<Badge variant="soft">{contributors.length}</Badge>
					</Flex>
					<Button asChild variant="ghost" size="1">
						<a
							href={CONTRIBUTORS_URL}
							target="_blank"
							rel="noreferrer"
							onClick={(event) => {
								if (import.meta.env.TAURI_ENV_PLATFORM) {
									event.preventDefault();
									openExternal(CONTRIBUTORS_URL);
								}
							}}
						>
							{t("aboutModal.viewContributors", "View contributors")}
							<Open16Regular />
						</a>
					</Button>
				</Flex>
				{contributors.length > 0 && (
					<Flex
						gap="2"
						wrap="wrap"
						aria-label={t(
							"aboutModal.contributorProfiles",
							"Contributor profiles",
						)}
					>
						{contributors.map((contributor) => (
							<Tooltip
								key={contributor.login}
								content={t("aboutModal.contributorTooltip", {
									defaultValue: "{name} - {count} contributions",
									name: contributor.login,
									count: contributor.contributions,
								})}
							>
								<a
									href={contributor.profileUrl}
									target="_blank"
									rel="noreferrer"
									aria-label={t("aboutModal.openContributorProfile", {
										defaultValue: "Open {name}'s GitHub profile",
										name: contributor.login,
									})}
									onClick={(event) => {
										if (import.meta.env.TAURI_ENV_PLATFORM) {
											event.preventDefault();
											openExternal(contributor.profileUrl);
										}
									}}
									style={{
										display: "inline-flex",
										borderRadius: "var(--radius-full)",
										outlineOffset: "2px",
									}}
								>
									<Avatar
										src={contributor.avatarUrl}
										fallback={contributor.login.slice(0, 1).toUpperCase()}
										alt={contributor.login}
										size="2"
										radius="full"
									/>
								</a>
							</Tooltip>
						))}
					</Flex>
				)}
			</Flex>
		</Flex>
	</Card>
);

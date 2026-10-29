import { OpenRegular, SparkleRegular } from "@fluentui/react-icons";
import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Text,
} from "@radix-ui/themes";
import { open } from "@tauri-apps/plugin-shell";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ChangeMarkdown,
	releaseColor,
} from "$/components/Dialogs/change-notes.tsx";
import { OptionPicker } from "$/components/OptionPicker";
import changelog from "$/data/changelog.json";
import legacy from "$/data/changelog-legacy.json";
import styles from "./ChangelogScreen.module.css";
import {
	buildReleaseCards,
	type ChangeEntry,
	type ChangeSection,
	type ReleaseCard,
} from "./model";

type View = "all" | "highlights";

function EntryText({ entry }: { entry: ChangeEntry }) {
	return (
		<Flex direction="column" gap="1" className={styles.entry}>
			<Text as="p" size="2" weight="bold">
				<ChangeMarkdown text={entry.title} />
			</Text>
			{entry.body && (
				<Text as="p" size="2" color="gray">
					<ChangeMarkdown text={entry.body} />
				</Text>
			)}
		</Flex>
	);
}

function formatDate(date: string | undefined, language: string) {
	if (!date) return undefined;
	const parsed = new Date(`${date}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return date;
	try {
		return new Intl.DateTimeFormat(language, {
			dateStyle: "medium",
			timeZone: "UTC",
		}).format(parsed);
	} catch {
		return date;
	}
}

function ReleaseCardView({
	card,
	latest,
}: {
	card: ReleaseCard;
	latest: boolean;
}) {
	const { t, i18n } = useTranslation();
	const sectionLabels: Record<ChangeSection, string> = {
		new: t("changelogScreen.sectionNew", "New"),
		changed: t("changelogScreen.sectionChanged", "Changed"),
		fixed: t("changelogScreen.sectionFixed", "Fixed"),
	};
	const date = formatDate(card.date, i18n.language);
	return (
		<Card size="2" className={styles.release} asChild>
			<article aria-label={card.version ? `v${card.version}` : card.summary}>
				<Flex align="baseline" gap="2" wrap="wrap" mb="3">
					<Heading as="h3" size="4" className={styles.releaseHeading}>
						{card.version ? `v${card.version}` : card.summary}
					</Heading>
					{latest && (
						<Badge color={releaseColor(card.color ?? "")} variant="soft">
							{t("changelogScreen.latest", "Latest")}
						</Badge>
					)}
					{card.version && card.summary && (
						<Text size="2" color="gray">
							{card.summary}
						</Text>
					)}
					{date && (
						<Text size="1" color="gray" className={styles.date}>
							<time dateTime={card.date}>{date}</time>
						</Text>
					)}
				</Flex>

				{card.highlights.length > 0 && (
					<Box className={styles.highlights} mb="3">
						<Flex align="center" gap="1" mb="2">
							<SparkleRegular aria-hidden className={styles.highlightIcon} />
							<Text size="2" weight="medium">
								{t("changelogScreen.highlights", "Highlights")}
							</Text>
						</Flex>
						<Flex direction="column" gap="2">
							{card.highlights.map((entry) => (
								<EntryText
									key={`${entry.title}:${entry.body ?? ""}`}
									entry={entry}
								/>
							))}
						</Flex>
					</Box>
				)}

				{card.sections.map(({ section, entries }) => (
					<Box key={section} className={styles.section}>
						<Heading as="h4" size="2" mb="2" className={styles.sectionHeading}>
							{sectionLabels[section]}
						</Heading>
						<ul className={styles.list}>
							{entries.map((entry) => (
								<li key={`${entry.title}:${entry.body ?? ""}`}>
									<EntryText entry={entry} />
								</li>
							))}
						</ul>
					</Box>
				))}
			</article>
		</Card>
	);
}

const openCommits = async () => {
	const repoUrl = "https://github.com/spicylyrics/ttml-tool/commits/main";
	if (import.meta.env.TAURI_ENV_PLATFORM) {
		await open(repoUrl);
	} else {
		window.open(repoUrl, "_blank");
	}
};

/** The Changelog page in Preferences: one card per release, newest first. */
export function ChangelogScreen() {
	const { t } = useTranslation();
	const [view, setView] = useState<View>("all");
	const cards = useMemo(
		() =>
			buildReleaseCards(changelog, legacy, {
				highlightsOnly: view === "highlights",
			}),
		[view],
	);

	return (
		<Flex direction="column" gap="3">
			<Flex justify="between" align="center" gap="2" wrap="wrap">
				<OptionPicker<View>
					variant="segmented"
					label={t("changelogScreen.viewLabel", "Show")}
					value={view}
					onValueChange={setView}
					options={[
						{
							value: "all",
							label: t("changelogScreen.viewAll", "Everything"),
						},
						{
							value: "highlights",
							label: t("changelogScreen.viewHighlights", "Highlights"),
						},
					]}
				/>
				<Button variant="soft" size="1" onClick={openCommits}>
					<OpenRegular aria-hidden />
					{t("changeNotes.viewCommits", "View Commits on GitHub")}
				</Button>
			</Flex>

			{cards.length ? (
				cards.map((card, index) => (
					<ReleaseCardView key={card.key} card={card} latest={index === 0} />
				))
			) : (
				<Text size="2" color="gray">
					{t("changelogScreen.empty", "No releases to show.")}
				</Text>
			)}
		</Flex>
	);
}

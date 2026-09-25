import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Section, P, List } from "@/components/legal/Legal";

// PLACEHOLDERS TO CONFIRM BEFORE LAUNCH (marked [to confirm] in the copy):
//  - Exact hosting provider and Australian region.
//  - Backup location, frequency and retention periods.
//  - Security contact address.
// CLAIM-FLAG (anonymous-voting): the anonymity description below must match the
//   real implementation. Per internal notes, votes are written client-side and
//   anonymity depends on how the poll is configured and on database rules —
//   confirm what is actually stored against an anonymous response before launch.
// CLAIM-FLAG (verified-voting): verified one-link-per-member voting is described
//   as not yet available. Update this section when it ships.

export const metadata: Metadata = {
  title: "Security & data hosting | TheJury",
  description:
    "How TheJury handles your data: Australian-hosted polls and votes, what we store, how anonymous voting works, and how to reach us with a security question.",
  alternates: { canonical: "/security" },
};

const UPDATED = "21 September 2026";

export default function SecurityPage() {
  return (
    <LegalShell title="Security & data hosting" updated={UPDATED}>
      <Section heading="In short">
        <P>
          TheJury is built for organisations that can&apos;t put member or staff
          data in overseas tools. Your polls, votes and member details are hosted
          in Australia. This page explains, in plain terms, where your data
          lives, what we store, and how voting works. It is not marketing copy.
        </P>
      </Section>

      <Section heading="Where your data is hosted">
        <P>
          Poll content, votes and account details are stored on
          Australian-hosted infrastructure in [Australian region: to confirm].
          We run our own database and storage rather than a shared overseas
          platform.
        </P>
        <P>
          Two supporting services operate overseas, and we keep them to the
          minimum: Stripe processes payments, and Google Analytics records
          aggregate usage (for example, that a poll was created). We do not send
          poll content, member rolls or individual responses to either of them.
        </P>
      </Section>

      <Section heading="What we store">
        <List
          items={[
            "Poll content: the questions, options and settings you create.",
            "Votes: the option each response selected, and the running counts.",
            "Account details: the email and username of the person who owns the account, and the plan they are on.",
            "For paid accounts: Stripe customer and subscription identifiers (never card numbers).",
          ]}
        />
      </Section>

      <Section heading="What we don't store">
        <List
          items={[
            "Card numbers. Payment details stay with Stripe.",
            "A voter account for people who only vote. No one needs an account to respond to a poll.",
            "Message content from any linked Discord server.",
          ]}
        />
      </Section>

      <Section heading="How anonymous voting works">
        <P>
          A poll can be run as anonymous. In that case we do not attach a name or
          an account to a response. To stop the same person voting twice, the
          poll uses a device identifier (and, in some cases, the network address)
          only to check for repeat votes. It is not shown to you and is not used
          to identify the voter.
        </P>
        <P>
          If your vote must be genuinely unlinkable from the voter for a formal
          process, contact us first so we can confirm the current behaviour suits
          your requirement.
        </P>
      </Section>

      <Section heading="How verified voting works">
        <P>
          Verified voting sends each eligible member their own private link, so
          you can run an election or a motion with one vote per person and a
          clear record of who was eligible. This is on our roadmap and is not yet
          available. We will update this page when it ships, rather than describe
          it as something you can rely on today.
        </P>
      </Section>

      <Section heading="Backups and retention">
        <P>
          We back up the database on a regular schedule, kept within Australia
          [backup location, frequency and retention: to confirm]. You can delete
          a poll at any time, which removes its votes. Deleting your account
          removes your personal data, other than records we are required to keep
          for legal or accounting reasons, such as billing history.
        </P>
      </Section>

      <Section heading="Your privacy rights">
        <P>
          We handle personal information in line with the Australian Privacy
          Principles. Our{" "}
          <Link
            href="/privacy"
            className="text-jury-emerald hover:text-jury-emerald-hi underline underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          sets out what we collect, why, and how to access, correct or delete it.
        </P>
      </Section>

      <Section heading="Security questions">
        <P>
          If you have a security question, or you need to report something, email
          [security contact: to confirm]. We would rather hear about a concern
          early than late.
        </P>
      </Section>
    </LegalShell>
  );
}

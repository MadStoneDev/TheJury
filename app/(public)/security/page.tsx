import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Section, P, List } from "@/components/legal/Legal";

// PLACEHOLDERS TO CONFIRM BEFORE LAUNCH (marked [to confirm] in the copy):
//  - Exact hosting provider and Australian region.
//  - Backup location, frequency and retention periods.
//  - Security contact address.
// Anonymous and verified voting are implemented (migration 017): anonymous and
// verified ballots are cast through a server-side function that never stores
// voter identity, computes the anonymity hash server-side, and consumes a
// single-use member token for verified polls. The copy below states the honest
// guarantee — anonymous FROM THE POLL OWNER — and the real limit (a guest link
// on an anonymous poll can't fully prevent repeat voting; verified voting can).

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
          A poll can be run as anonymous. When it is, the ballot is recorded
          through a server-side process that never stores a name or an account
          against the vote — so the result is anonymous to you, the poll owner,
          and to your admins. You see the tallies, never who cast which ballot.
        </P>
        <P>
          To stop the same signed-in person voting twice, the poll stores a
          one-way hash of their account, salted with a per-poll value and a
          server secret that no account can read. It can&apos;t be turned back
          into an identity, including by us in normal operation.
        </P>
        <P>
          One honest limit: if you share an anonymous poll as an open link that
          guests can use without signing in, there is no reliable way to stop a
          determined person voting more than once. When one vote per person must
          be guaranteed, use verified voting below. Anonymity here means
          anonymous from the poll owner; access by the hosting provider or a
          database administrator is governed by this security policy, not by
          cryptographic anonymity.
        </P>
      </Section>

      <Section heading="How verified voting works">
        <P>
          Verified voting gives each member their own single-use link. Only those
          links can vote, and each one works once — so you can run an election or
          a motion with one vote per member. The link is the only key; no account
          or login is required to use it.
        </P>
        <P>
          You can see turnout — how many of the issued links have been used — but
          if the poll is also anonymous, you cannot see how any individual member
          voted, and their redemption time is never exposed. That combination is
          the secret ballot: a verifiable turnout with an unlinkable vote.
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

import type { Metadata } from "next";
import { LegalShell, Section, P, List } from "@/components/legal/Legal";

export const metadata: Metadata = {
  title: "Privacy Policy | TheJury",
  description: "What TheJury collects, why, and how we handle it.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "12 September 2026";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated={UPDATED}>
      <Section heading="Overview">
        <P>
          This policy explains what TheJury (thejury.app), our embeds, and our
          Discord bot collect, why, and who we share it with. We collect the
          minimum needed to run polls and keep the Service working.
        </P>
      </Section>

      <Section heading="What we collect">
        <List
          items={[
            "Account data: your email and username (via our authentication provider, Supabase), and your plan/subscription status.",
            "Poll data: the polls, questions, options, settings, and results you create.",
            "Voting data: the options a voter selects. To stop duplicate voting we store a voter identifier — a signed-in user’s account ID, or for anonymous voters a device fingerprint and/or IP address. Polls can be run as anonymous, in which case no identity is stored against a response.",
            "Discord data (bot only): the Discord server (guild) ID linked to your account, and the Discord user ID of anyone who votes via the bot (stored as the vote identifier). We don’t read message content.",
            "Billing data: handled by Stripe. We store your Stripe customer/subscription IDs and plan status, not your card number.",
            "Usage analytics: aggregate events (e.g. poll created, vote cast, upgrade clicked) via Google Analytics to understand how the Service is used.",
          ]}
        />
      </Section>

      <Section heading="How we use it">
        <List
          items={[
            "To provide the Service: create and run polls, tally votes, and show results.",
            "To prevent duplicate or fraudulent voting.",
            "To process payments and manage subscriptions.",
            "To operate, secure, and improve the Service, and to communicate about your account.",
          ]}
        />
      </Section>

      <Section heading="Who we share it with">
        <P>We don’t sell your data. We share it only with service providers that help us run TheJury:</P>
        <List
          items={[
            "Supabase — database, authentication, and hosting of poll data.",
            "Stripe — payment processing.",
            "Discord — when you use the bot (subject to Discord’s privacy policy).",
            "Google Analytics — aggregate usage analytics.",
            "Others where required by law, or to protect the rights, safety, and security of our users and the Service.",
          ]}
        />
      </Section>

      <Section heading="Retention">
        <P>
          We keep account and poll data while your account is active. You can
          delete polls at any time, which removes their votes. Delete your
          account to remove your personal data, subject to records we must keep
          for legal or accounting reasons (e.g. billing records).
        </P>
      </Section>

      <Section heading="Your rights">
        <P>
          Depending on where you live, you may have rights to access, correct,
          export, or delete your personal data, and to object to or restrict
          certain processing. To exercise them, email privacy@thejury.app.
        </P>
      </Section>

      <Section heading="Cookies & local storage">
        <P>
          We use essential cookies/local storage to keep you signed in and
          remember preferences, and analytics cookies via Google Analytics. You
          can control cookies in your browser settings.
        </P>
      </Section>

      <Section heading="Children">
        <P>
          The Service isn’t directed at children under 13 (or the minimum age in
          your country). We don’t knowingly collect their personal data.
        </P>
      </Section>

      <Section heading="Changes & contact">
        <P>
          We may update this policy; material changes will be signposted. For any
          privacy question or request, email privacy@thejury.app.
        </P>
      </Section>
    </LegalShell>
  );
}

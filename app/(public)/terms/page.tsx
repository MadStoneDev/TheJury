import type { Metadata } from "next";
import { LegalShell, Section, P, List } from "@/components/legal/Legal";

export const metadata: Metadata = {
  title: "Terms of Service | TheJury",
  description: "The terms that govern your use of TheJury.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "12 September 2026";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated={UPDATED}>
      <Section heading="1. Acceptance">
        <P>
          By using TheJury (the “Service”) at thejury.app, our embeds, or our
          Discord bot, you agree to these Terms. If you don’t agree, don’t use
          the Service.
        </P>
      </Section>

      <Section heading="2. The Service">
        <P>
          TheJury lets you create polls, collect votes, and view results. Some
          features require a paid plan. We may add, change, or remove features
          over time.
        </P>
      </Section>

      <Section heading="3. Accounts">
        <List
          items={[
            "You’re responsible for your account and for keeping your credentials secure.",
            "You must provide accurate information and be old enough to form a binding contract in your jurisdiction.",
            "You’re responsible for activity that happens under your account, including polls created via the Discord bot linked to it.",
          ]}
        />
      </Section>

      <Section heading="4. Acceptable use">
        <P>You agree not to use the Service to:</P>
        <List
          items={[
            "Break the law or infringe others’ rights.",
            "Run polls that harass, defame, or target private individuals, or that collect sensitive personal data without consent.",
            "Send spam, malware, or attempt to disrupt, overload, or reverse-engineer the Service.",
            "Manipulate results through automated or fraudulent voting.",
          ]}
        />
      </Section>

      <Section heading="5. Your content">
        <P>
          You keep ownership of the polls, questions, options, and responses you
          create (“Your Content”). You grant us a licence to host, process, and
          display Your Content solely to operate the Service. You’re responsible
          for Your Content and for having the rights to use it.
        </P>
      </Section>

      <Section heading="6. Plans, billing & refunds">
        <List
          items={[
            "The Free plan is available at no cost. Organisation is billed monthly or annually in AUD via Stripe. Council and Enterprise can be billed by invoice.",
            "Subscriptions renew automatically until cancelled; you can cancel any time and keep your paid features until the end of the paid period.",
            "Prices may change with notice; changes don’t affect the current paid period.",
            "Except where required by law, payments are non-refundable. If your subscription lapses, your polls stay live on the Free tier subject to its limits.",
          ]}
        />
      </Section>

      <Section heading="7. The Discord bot">
        <P>
          The bot creates polls under the TheJury account a server is linked to
          and stores votes against Discord user IDs. You’re responsible for how
          the bot is used in servers you administer. Use of Discord is also
          subject to Discord’s own terms.
        </P>
      </Section>

      <Section heading="8. Intellectual property">
        <P>
          TheJury, its branding, and the Service (excluding Your Content) are
          owned by us and our licensors. These Terms don’t grant you rights to
          our trademarks or software beyond using the Service as intended.
        </P>
      </Section>

      <Section heading="9. Disclaimers & liability">
        <P>
          The Service is provided “as is”, without warranties of any kind to the
          extent permitted by law. We don’t guarantee uninterrupted or
          error-free operation. To the maximum extent permitted by law, our
          liability is limited to the amount you paid us in the 12 months before
          the claim. Nothing in these Terms excludes rights you have under the
          Australian Consumer Law that can’t be excluded.
        </P>
      </Section>

      <Section heading="10. Termination">
        <P>
          You can stop using the Service at any time. We may suspend or terminate
          access if you breach these Terms or use the Service in a way that
          risks harm to others or to us.
        </P>
      </Section>

      <Section heading="11. Changes">
        <P>
          We may update these Terms. If we make material changes we’ll take
          reasonable steps to let you know. Continued use after changes take
          effect means you accept them.
        </P>
      </Section>

      <Section heading="12. Contact">
        <P>Questions about these Terms? Email support@thejury.app.</P>
      </Section>
    </LegalShell>
  );
}

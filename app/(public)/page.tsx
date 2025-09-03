// app/(public)/page.tsx
import { Hero } from "@/components/Hero";
import { Container } from "@/components/Container";

export default function Home() {
  return (
    <Container>
      <Hero />

      {/*<SectionTitle*/}
      {/*    preTitle="TheJury Benefits"*/}
      {/*    title="Why choose TheJury for your polling needs"*/}
      {/*>*/}
      {/*    TheJury is the most intuitive polling platform that makes decision-making*/}
      {/*    effortless. Create polls in minutes, share instantly, and get insights*/}
      {/*    that drive real results.*/}
      {/*</SectionTitle>*/}

      {/*<Benefits data={pollCreationBenefits} />*/}
      {/*<Benefits imgPos="right" data={pollSharingBenefits} />*/}

      {/*<SectionTitle*/}
      {/*    preTitle="See it in action"*/}
      {/*    title="Watch how easy it is to create your first poll"*/}
      {/*>*/}
      {/*    See how TheJury transforms decision-making in under 2 minutes.*/}
      {/*    From creation to results, everything is designed for simplicity*/}
      {/*    and maximum engagement.*/}
      {/*</SectionTitle>*/}

      {/*<Video videoId="YOUR_DEMO_VIDEO_ID" />*/}

      {/*<SectionTitle*/}
      {/*    preTitle="Customer Stories"*/}
      {/*    title="Here's what teams are saying about TheJury"*/}
      {/*>*/}
      {/*    Join thousands of teams who've transformed their decision-making*/}
      {/*    process with TheJury. See how faster consensus leads to better results.*/}
      {/*</SectionTitle>*/}

      {/*<Testimonials />*/}

      {/*<SectionTitle preTitle="FAQ" title="Frequently Asked Questions">*/}
      {/*    Got questions about TheJury? We've got answers. Learn how our*/}
      {/*    platform makes polling simple and secure for everyone.*/}
      {/*</SectionTitle>*/}

      {/*<Faq />*/}
      {/*<Cta />*/}
    </Container>
  );
}

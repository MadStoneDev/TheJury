import {
  IconMoodSmile,
  IconChartBar,
  IconClick,
  IconDeviceMobile,
  IconAdjustmentsHorizontal,
  IconSun,
} from "@tabler/icons-react";

// You'll need to add your poll creation mockup image
// import pollCreationImg from "@/public/img/poll-creation.png";
// You'll need to add your poll results/sharing mockup image
// import pollResultsImg from "@/public/img/poll-results.png";

export const pollCreationBenefits = {
  title: "Create polls that people actually want to answer",
  desc: "Our intuitive interface makes poll creation effortless. Choose from professional templates, customize your questions, and launch in minutes - no design skills required.",
  image: "",
  bullets: [
    {
      title: "Template Library",
      desc: "Start with proven templates for team decisions, customer feedback, event planning, and more.",
      icon: <IconAdjustmentsHorizontal />,
    },
    {
      title: "Smart Question Types",
      desc: "Multiple choice, ranking, rating scales, and open text - all optimized for maximum responses.",
      icon: <IconChartBar />,
    },
    {
      title: "Brand Customization",
      desc: "Add your logo, colors, and styling to make every poll feel professional and on-brand.",
      icon: <IconSun />,
    },
  ],
};

export const pollSharingBenefits = {
  title: "Share instantly, get results immediately",
  desc: "No registration barriers for your audience. Share via link, QR code, or embed directly. Watch responses pour in with real-time updates and beautiful analytics.",
  image: "",
  imgPos: "right",
  bullets: [
    {
      title: "Frictionless Participation",
      desc: "Respondents can vote instantly without creating accounts or downloading apps.",
      icon: <IconClick />,
    },
    {
      title: "Real-time Results",
      desc: "Watch votes come in live with beautiful charts and insights that update automatically.",
      icon: <IconChartBar />,
    },
    {
      title: "Mobile Optimized",
      desc: "Perfect experience on any device - desktop, tablet, or mobile. Your audience can participate anywhere.",
      icon: <IconDeviceMobile />,
    },
  ],
};

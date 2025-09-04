// app/answer/[pollCode]/layout.tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ pollCode: string }>;
  children: React.ReactNode;
};

// Create a server-side Supabase client specifically for metadata generation
async function getPollForMetadata(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select(
      `
      id,
      question,
      description,
      is_active
    `,
    )
    .eq("code", code)
    .single();

  if (error) {
    console.error("Error fetching poll for metadata:", error);
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { pollCode } = await params;
    const poll = await getPollForMetadata(pollCode);

    if (!poll) {
      return {
        title: "Poll Not Found - TheJury",
        description: "The requested poll could not be found.",
      };
    }

    // Truncate long questions for better title display
    const truncatedQuestion =
      poll.question.length > 60
        ? poll.question.substring(0, 57) + "..."
        : poll.question;

    return {
      title: `${truncatedQuestion} - TheJury`,
      description: poll.description || `Vote on: ${poll.question}`,
      openGraph: {
        title: poll.question,
        description: poll.description || `Vote on: ${poll.question}`,
        type: "website",
        siteName: "TheJury",
        images: [
          {
            url: "thejury-opengraph.jpg",
            width: 1200,
            height: 630,
            alt: "TheJury - Polling Platform",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: poll.question,
        description: poll.description || `Vote on: ${poll.question}`,
        images: ["thejury-opengraph.jpg"],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "TheJury - Polling Platform",
      description: "Create and participate in polls with TheJury",
    };
  }
}

export default function PollLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

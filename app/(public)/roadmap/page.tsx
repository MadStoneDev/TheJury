import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import RoadmapBoard, {
  type RoadmapItem,
  type Suggestion,
} from "@/components/roadmap/RoadmapBoard";

export const metadata: Metadata = {
  title: "Roadmap | TheJury",
  description:
    "What's planned, in progress and shipped for TheJury — vote on what you want next.",
  alternates: { canonical: "/roadmap" },
};

// Roadmap content is public but changes often; render fresh each request.
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function RoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public items.
  const { data: items } = await supabase
    .from("roadmap_items")
    .select("id, title, description, status, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const svc = service();

  // Vote counts (tally server-side; identities never reach the client).
  const { data: votes } = await svc.from("roadmap_votes").select("item_id, voter_key");
  const counts: Record<string, number> = {};
  const myVotes = new Set<string>();
  const myKey = user ? `user:${user.id}` : null;
  for (const v of votes ?? []) {
    counts[v.item_id] = (counts[v.item_id] ?? 0) + 1;
    if (myKey && v.voter_key === myKey) myVotes.add(v.item_id);
  }

  const roadmapItems: RoadmapItem[] = (items ?? []).map((it) => ({
    id: it.id,
    title: it.title,
    description: it.description,
    status: it.status as RoadmapItem["status"],
    votes: counts[it.id] ?? 0,
    votedByMe: myVotes.has(it.id),
  }));

  // Admin: load suggestions (write-only table; readable only via service role).
  let role = 3;
  let suggestions: Suggestion[] | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? 3;

    if (role >= 10) {
      const { data: rows } = await svc
        .from("roadmap_suggestions")
        .select("id, body, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
      const { data: profiles } = ids.length
        ? await svc.from("profiles").select("id, username").in("id", ids)
        : { data: [] as { id: string; username: string | null }[] };
      const names = new Map((profiles ?? []).map((p) => [p.id, p.username]));
      suggestions = (rows ?? []).map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.created_at,
        username: names.get(r.user_id) ?? "unknown",
      }));
    }
  }

  return (
    <RoadmapBoard
      items={roadmapItems}
      isLoggedIn={!!user}
      isAdmin={role >= 10}
      suggestions={suggestions}
    />
  );
}

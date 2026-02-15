import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TeamDashboard from "@/components/team/TeamDashboard";
import CreateTeamForm from "@/components/team/CreateTeamForm";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check subscription tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "team") {
    redirect("/pricing");
  }

  // Check if user is in a team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, owner_id, created_at)")
    .eq("user_id", user.id)
    .eq("invite_status", "accepted")
    .single();

  if (!membership) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CreateTeamForm userId={user.id} />
      </div>
    );
  }

  const team = membership.teams as unknown as { id: string; name: string; owner_id: string; created_at: string };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <TeamDashboard
        teamId={team.id}
        teamName={team.name}
        userRole={membership.role}
        userId={user.id}
      />
    </div>
  );
}

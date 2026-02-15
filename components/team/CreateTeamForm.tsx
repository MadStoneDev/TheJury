"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeInUp } from "@/lib/animations";
import { IconUsers } from "@tabler/icons-react";
import { toast } from "sonner";

interface CreateTeamFormProps {
  userId: string;
}

export default function CreateTeamForm({ userId }: CreateTeamFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = teamName.trim();
    if (!name) return;

    setLoading(true);

    try {
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name, owner_id: userId })
        .select("id")
        .single();

      if (teamError) throw teamError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.id,
          user_id: userId,
          role: "owner",
          invite_status: "accepted",
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      toast.success("Team created successfully!");
      router.refresh();
    } catch (err) {
      console.error("Failed to create team:", err);
      toast.error("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border bg-card p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center">
          <IconUsers size={24} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-display text-foreground">Create Your Team</h2>
          <p className="text-muted-foreground text-sm">
            Set up a workspace to collaborate with your team members.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label htmlFor="team-name" className="block text-sm font-medium text-foreground mb-1.5">
            Team Name
          </label>
          <Input
            id="team-name"
            type="text"
            placeholder="e.g. Marketing Team"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            maxLength={100}
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="w-full"
          disabled={loading || !teamName.trim()}
        >
          {loading ? "Creating..." : "Create Team"}
        </Button>
      </form>
    </motion.div>
  );
}

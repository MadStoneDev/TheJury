"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import {
  IconUsers,
  IconMail,
  IconTrash,
  IconCrown,
  IconShield,
  IconUser,
  IconChartBar,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

interface TeamDashboardProps {
  teamId: string;
  teamName: string;
  userRole: string;
  userId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  invite_status: string;
  invited_email: string | null;
  joined_at: string | null;
  profiles: {
    username: string | null;
    email: string | null;
  } | null;
}

interface TeamPoll {
  id: string;
  question: string;
  poll_code: string;
  is_active: boolean;
  created_at: string;
  votes: { count: number }[];
}

export default function TeamDashboard({
  teamId,
  teamName,
  userRole,
  userId,
}: TeamDashboardProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [polls, setPolls] = useState<TeamPoll[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(true);

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("id, user_id, role, invite_status, invited_email, joined_at, profiles(username, email)")
      .eq("team_id", teamId)
      .order("role", { ascending: true });

    if (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load team members.");
    } else {
      setMembers((data as unknown as TeamMember[]) || []);
    }
    setLoadingMembers(false);
  }, [teamId]);

  const fetchPolls = useCallback(async () => {
    setLoadingPolls(true);
    const { data, error } = await supabase
      .from("polls")
      .select("id, question, poll_code, is_active, created_at, votes(count)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch polls:", error);
      toast.error("Failed to load team polls.");
    } else {
      setPolls((data as unknown as TeamPoll[]) || []);
    }
    setLoadingPolls(false);
  }, [teamId]);

  useEffect(() => {
    fetchMembers();
    fetchPolls();
  }, [fetchMembers, fetchPolls]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviting(true);
    try {
      // Check if already a member by email
      const existing = members.find(
        (m) =>
          m.invited_email === email ||
          m.profiles?.email === email
      );
      if (existing) {
        toast.error("This person is already a member or has a pending invite.");
        setInviting(false);
        return;
      }

      const { error } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: userId, // placeholder - will be updated when user accepts
        role: "member",
        invited_email: email,
        invite_status: "pending",
        invited_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${email}`);
      setInviteEmail("");
      fetchMembers();
    } catch (err) {
      console.error("Failed to invite:", err);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberUserId: string) {
    if (memberUserId === userId) {
      toast.error("You cannot remove yourself from the team.");
      return;
    }

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member removed from team.");
      fetchMembers();
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error("Failed to remove member. Please try again.");
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "owner":
        return <IconCrown size={16} className="text-amber-500" />;
      case "admin":
        return <IconShield size={16} className="text-blue-500" />;
      default:
        return <IconUser size={16} className="text-muted-foreground" />;
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case "owner":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "admin":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center">
            <IconUsers size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-foreground">{teamName}</h1>
            <p className="text-muted-foreground text-sm">
              {members.filter((m) => m.invite_status === "accepted").length} member
              {members.filter((m) => m.invite_status === "accepted").length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Members Section */}
      <motion.div variants={staggerItem} className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
          <IconUsers size={20} />
          Team Members
        </h2>

        {loadingMembers ? (
          <p className="text-muted-foreground text-sm">Loading members...</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <motion.div
                key={member.id}
                variants={fadeInUp}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.invite_status === "pending"
                        ? member.invited_email
                        : member.profiles?.username || member.profiles?.email || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleBadgeClass(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                      {member.invite_status === "pending" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOwnerOrAdmin && member.user_id !== userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <IconTrash size={18} />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Invite Section */}
        {isOwnerOrAdmin && (
          <form onSubmit={handleInvite} className="mt-6 pt-6 border-t border-border">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Invite a Team Member
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconMail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={inviting}
                />
              </div>
              <Button
                type="submit"
                variant="brand"
                disabled={inviting || !inviteEmail.trim()}
              >
                <IconPlus size={18} />
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Team Polls Section */}
      <motion.div variants={staggerItem} className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display text-foreground flex items-center gap-2">
            <IconChartBar size={20} />
            Team Polls
          </h2>
          <Link href="/create">
            <Button variant="brand" size="sm">
              <IconPlus size={16} />
              New Poll
            </Button>
          </Link>
        </div>

        {loadingPolls ? (
          <p className="text-muted-foreground text-sm">Loading polls...</p>
        ) : polls.length === 0 ? (
          <div className="text-center py-8">
            <IconChartBar
              size={40}
              className="mx-auto text-muted-foreground/40 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              No team polls yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => (
              <motion.div
                key={poll.id}
                variants={fadeInUp}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {poll.question}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {poll.votes?.[0]?.count ?? 0} votes
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        poll.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {poll.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/results/${poll.poll_code}`}>
                  <Button variant="ghost" size="sm">
                    View Results
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

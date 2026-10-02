// utils/profileChecker.ts
import { Profile } from "@/lib/supabaseHelpers";
import { generateUniqueFantasyUsernameServer } from "@/utils/usernameGenerator";
import { createClient } from "@/lib/supabase/server";
import { timed } from "@/lib/perfLog";
import type { User } from "@supabase/supabase-js";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export const ensureUserHasProfile = async (
  // Callers that already authenticated can pass the user + client to avoid a
  // second getUser() round-trip.
  providedUser?: User,
  providedClient?: ServerClient,
): Promise<boolean> => {
  try {
    const supabase = providedClient ?? (await createClient());

    let resolvedUser = providedUser ?? null;
    if (!resolvedUser) {
      const { data, error: userError } = await timed(
        "ensureUserHasProfile.getUser",
        () => supabase.auth.getUser(),
      );
      if (userError || !data.user) return false;
      resolvedUser = data.user;
    }
    const user = resolvedUser;

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await timed(
      "ensureUserHasProfile.selectProfile",
      () => supabase.from("profiles").select("*").eq("id", user.id).single(),
    );

    // If profile exists, return true
    if (existingProfile && !profileError) return true;

    // No profile found, create one with fantasy username
    const username = await generateUniqueFantasyUsernameServer(supabase);

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: username,
      avatar_url: user.user_metadata?.avatar_url || null,
    });

    if (insertError) {
      console.error("Error creating missing profile:", insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error ensuring user has profile:", error);
    return false;
  }
};

// Alternative version that also returns the profile if you need it
export const ensureUserHasProfileAndReturn = async (
  // Callers that already authenticated can pass the user + client to avoid a
  // second getUser() round-trip.
  providedUser?: User,
  providedClient?: ServerClient,
): Promise<Profile | null> => {
    try {
      const supabase = providedClient ?? (await createClient());

      let resolvedUser = providedUser ?? null;
      if (!resolvedUser) {
        const { data, error: userError } = await timed(
          "ensureProfile.getUser",
          () => supabase.auth.getUser(),
        );
        if (userError || !data.user) return null;
        resolvedUser = data.user;
      }
      const user = resolvedUser;

      // Check if profile exists
      const { data: existingProfile, error: profileError } = await timed(
        "ensureProfile.selectProfile",
        () => supabase.from("profiles").select("*").eq("id", user.id).single(),
      );

      // If profile exists, return it
      if (existingProfile && !profileError) return existingProfile;

      // No profile found, create one
      const username = await generateUniqueFantasyUsernameServer(supabase);

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: username,
          avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating missing profile:", insertError);
        return null;
      }

      return newProfile;
    } catch (error) {
      console.error("Error ensuring user has profile:", error);
      return null;
    }
  };

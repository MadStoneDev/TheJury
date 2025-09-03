// utils/profileChecker.ts
import { Profile } from "@/lib/supabaseHelpers";
import { generateUniqueFantasyUsernameServer } from "@/utils/usernameGenerator";
import { createClient } from "@/lib/supabase/server";

export const ensureUserHasProfile = async (): Promise<boolean> => {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return false;

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

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
export const ensureUserHasProfileAndReturn =
  async (): Promise<Profile | null> => {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

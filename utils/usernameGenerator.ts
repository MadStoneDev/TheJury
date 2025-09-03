// utils/usernameGenerator.ts
import { checkUsernameAvailable } from "@/lib/supabaseHelpers";

const FANTASY_NOUNS = [
  "knight",
  "wizard",
  "mage",
  "archer",
  "ranger",
  "scout",
  "hunter",
  "guardian",
  "warrior",
  "champion",
  "hero",
  "adventurer",
  "explorer",
  "wanderer",
  "seeker",
  "finder",
  "scholar",
  "scribe",
  "sage",
  "mystic",
  "oracle",
  "seer",
  "prophet",
  "herald",
  "smith",
  "crafter",
  "builder",
  "maker",
  "forger",
  "artisan",
  "merchant",
  "trader",
  "keeper",
  "warden",
  "defender",
  "protector",
  "sentinel",
  "watcher",
  "guard",
  "shield",
  "rider",
  "traveler",
  "pilgrim",
  "voyager",
  "nomad",
  "drifter",
  "roamer",
  "walker",
  "healer",
  "medic",
  "cleric",
  "priest",
  "paladin",
  "templar",
  "crusader",
  "monk",
];

const FANTASY_ADJECTIVES = [
  "brave",
  "bold",
  "swift",
  "clever",
  "wise",
  "ancient",
  "noble",
  "fierce",
  "mighty",
  "strong",
  "gentle",
  "kind",
  "loyal",
  "true",
  "pure",
  "bright",
  "dark",
  "shadow",
  "silver",
  "golden",
  "crimson",
  "azure",
  "emerald",
  "crystal",
  "iron",
  "steel",
  "stone",
  "oak",
  "pine",
  "rose",
  "thorn",
  "flame",
  "frost",
  "storm",
  "thunder",
  "lightning",
  "wind",
  "earth",
  "water",
  "fire",
  "moon",
  "star",
  "sun",
  "dawn",
  "dusk",
  "twilight",
  "midnight",
  "morning",
  "wild",
  "free",
  "quiet",
  "silent",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomNumbers(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}

function createFantasyUsername(): string {
  const noun = getRandomElement(FANTASY_NOUNS);
  const adjective = getRandomElement(FANTASY_ADJECTIVES);
  const numbers = generateRandomNumbers();

  return `${noun}the${adjective}${numbers}`;
}

export const generateUniqueFantasyUsername = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const username = createFantasyUsername();

    try {
      const isAvailable = await checkUsernameAvailable(username);
      if (isAvailable) {
        return username;
      }
    } catch (error) {
      console.error("Error checking username availability:", error);
    }

    attempts++;
  }

  // Fallback to timestamp-based username if all attempts fail
  const timestamp = Date.now().toString();
  return `user${timestamp}`;
};

export const generateUniqueFantasyUsernameServer = async (
  supabase: any,
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const username = createFantasyUsername();

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!data) return username; // Username is available

    attempts++;
  }

  return `user${Date.now()}`;
};

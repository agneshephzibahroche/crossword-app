import { supabase } from "@/lib/supabase";
import { Puzzle } from "@/types/puzzle";

export async function getRandomPuzzle(): Promise<Puzzle | null> {
  const { data, error } = await supabase
    .from("puzzles")
    .select("puzzle");

  if (error || !data || data.length === 0) {
    console.error("Error fetching puzzles:", error);
    return null;
  }

  const randomIndex = Math.floor(Math.random() * data.length);

  return data[randomIndex].puzzle as Puzzle;
}
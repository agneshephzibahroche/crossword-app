import { supabase } from "@/lib/supabase";
import { Puzzle } from "@/types/puzzle";

export async function getTodayPuzzle(): Promise<Puzzle | null> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("puzzles")
    .select("puzzle")
    .eq("date", today)
    .single();

  if (error || !data) {
    console.error("Error fetching today's puzzle:", error);
    return null;
  }

  return data.puzzle as Puzzle;
}
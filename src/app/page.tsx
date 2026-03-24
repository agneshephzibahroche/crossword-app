export const dynamic = "force-dynamic";

import HomeClientWithPuzzle from "@/components/HomeClientWithPuzzle";
import { getRandomPuzzle } from "@/lib/getRandomPuzzle";

export default async function HomePage() {
  const puzzle = await getRandomPuzzle();

  if (!puzzle) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <h1 className="text-2xl font-bold">No puzzles available</h1>
      </main>
    );
  }

  return <HomeClientWithPuzzle puzzle={puzzle} />;
}
export const dynamic = "force-dynamic";

import HomeClientWithPuzzle from "@/components/HomeClientWithPuzzle";
import { generateCrossword } from "@/lib/generateCrossword";

export default function HomePage() {
  const puzzle = generateCrossword();
  return <HomeClientWithPuzzle puzzle={puzzle} />;
}
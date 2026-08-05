import CategoriesPageClient from "@/components/CategoriesPageClient";
import { getCategoriesForDate } from "@/lib/dailyCategories";
import { getTodayDateKey } from "@/lib/dailyPuzzle";
import { headers } from "next/headers";

export default async function CategoriesPage() {
  const headerStore = await headers();
  const timeZone =
    headerStore.get("x-vercel-ip-timezone") ??
    headerStore.get("x-time-zone") ??
    "UTC";
  const today = getTodayDateKey(timeZone);
  const puzzle = getCategoriesForDate(today);

  return <CategoriesPageClient puzzle={puzzle} />;
}

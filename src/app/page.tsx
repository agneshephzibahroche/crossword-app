import HomeClientWithPuzzle from "@/components/HomeClientWithPuzzle";
import {
  getPuzzleArchive,
  getPuzzleForDate,
  getTodayDateKey,
} from "@/lib/dailyPuzzle";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

const getCachedPageData = unstable_cache(
  async (today: string, selectedDate: string) => ({
    archive: getPuzzleArchive(selectedDate, 3, today),
    puzzle: getPuzzleForDate(selectedDate),
  }),
  ["letterbeat-page-data"],
  {
    revalidate: 3600,
  }
);

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const headerStore = await headers();
  const timeZone =
    headerStore.get("x-vercel-ip-timezone") ??
    headerStore.get("x-time-zone") ??
    "UTC";
  const today = getTodayDateKey(timeZone);
  const requestedDate = resolvedSearchParams?.date;
  const selectedDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : today;
  const { archive, puzzle } = await getCachedPageData(today, selectedDate);

  return (
    <HomeClientWithPuzzle
      archive={archive}
      puzzle={puzzle}
      isArchiveView={Boolean(requestedDate && selectedDate !== today)}
      today={today}
    />
  );
}

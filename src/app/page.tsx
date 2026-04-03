import HomeClientWithPuzzle from "@/components/HomeClientWithPuzzle";
import {
  getPuzzleArchive,
  getPuzzleForDate,
  getTodayDateKey,
} from "@/lib/dailyPuzzle";
import { headers } from "next/headers";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

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

  return (
    <HomeClientWithPuzzle
      archive={getPuzzleArchive(selectedDate, 3, today)}
      puzzle={getPuzzleForDate(selectedDate)}
      isArchiveView={Boolean(requestedDate && selectedDate !== today)}
      today={today}
    />
  );
}

export const revalidate = 3600;

import HomeClientWithPuzzle from "@/components/HomeClientWithPuzzle";
import {
  getPuzzleArchive,
  getPuzzleForDate,
  getTodayDateKey,
} from "@/lib/dailyPuzzle";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const today = getTodayDateKey();
  const requestedDate = resolvedSearchParams?.date;
  const selectedDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : today;

  return (
    <HomeClientWithPuzzle
      archive={getPuzzleArchive(selectedDate, 3)}
      puzzle={getPuzzleForDate(selectedDate)}
      today={today}
    />
  );
}

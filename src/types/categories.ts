export interface CategoryGroup {
  id: string;
  label: string;
  words: string[];
}

export interface CategoriesPuzzle {
  id: string;
  date: string;
  title: string;
  // The 3 correct groupings -- the answer key. words below is the display
  // order (shuffled); this is where each word actually belongs.
  categories: CategoryGroup[];
  // The 12 words in shuffled display order.
  words: string[];
}

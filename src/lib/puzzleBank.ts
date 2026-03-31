type RawClue = {
  number: number;
  row: number;
  col: number;
  answer: string;
  clues: string[];
};

type RawPuzzle = {
  id: string;
  date: string;
  title: string;
  rows: number;
  cols: number;
  grid: string[][];
  solution: string[][];
  clues: {
    across: RawClue[];
    down: RawClue[];
  };
};

export const PUZZLE_BANK: RawPuzzle[] = [
  {
    id: "daily-1",
    date: "2026-03-29",
    title: "Trail Mix",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
    solution: [
      ["A", "B", "#", "W", "E"],
      ["T", "R", "A", "I", "L"],
      ["#", "E", "N", "D", "#"],
      ["F", "A", "D", "E", "D"],
      ["A", "D", "#", "N", "O"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscles by the waist, informally", "Core muscles, casually"] },
        { number: 2, row: 0, col: 3, answer: "WE", clues: ["You and I", "Us, as subject"] },
        { number: 4, row: 1, col: 0, answer: "TRAIL", clues: ["Path through the woods", "Hiking route"] },
        { number: 6, row: 2, col: 1, answer: "END", clues: ["Finish", "Stopping point"] },
        { number: 7, row: 3, col: 0, answer: "FADED", clues: ["Lost its brightness", "No longer vivid"] },
        { number: 8, row: 4, col: 0, answer: "AD", clues: ["Promotional message", "Commercial notice"] },
        { number: 9, row: 4, col: 3, answer: "NO", clues: ["Opposite of yes", "Negative reply"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AT", clues: ["Located in", "At a place"] },
        { number: 2, row: 0, col: 1, answer: "BREAD", clues: ["Baked loaf", "Sandwich starter"] },
        { number: 3, row: 0, col: 3, answer: "WIDEN", clues: ["Make broader", "Spread out"] },
        { number: 4, row: 0, col: 4, answer: "EL", clues: ["Spanish article", "Spanish word for 'the'"] },
        { number: 5, row: 1, col: 2, answer: "AND", clues: ["Plus", "Joining word"] },
        { number: 7, row: 3, col: 0, answer: "FA", clues: ["A note after mi", "Do-re-mi syllable"] },
        { number: 9, row: 3, col: 4, answer: "DO", clues: ["Perform", "Carry out"] },
      ],
    },
  },
  {
    id: "daily-2",
    date: "2026-03-29",
    title: "Final Act",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
    solution: [
      ["A", "B", "#", "O", "N"],
      ["D", "A", "N", "C", "E"],
      ["#", "S", "U", "E", "#"],
      ["F", "I", "N", "A", "L"],
      ["A", "L", "#", "N", "O"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscles by the waist, informally", "Core muscles, casually"] },
        { number: 2, row: 0, col: 3, answer: "ON", clues: ["Activated", "Running, as a switch"] },
        { number: 4, row: 1, col: 0, answer: "DANCE", clues: ["Move to the music", "Do the tango, say"] },
        { number: 6, row: 2, col: 1, answer: "SUE", clues: ["Take to court", "Bring legal action"] },
        { number: 7, row: 3, col: 0, answer: "FINAL", clues: ["Last in a series", "Ultimate"] },
        { number: 8, row: 4, col: 0, answer: "AL", clues: ["Pacino of film", "Yankovic of parody"] },
        { number: 9, row: 4, col: 3, answer: "NO", clues: ["Opposite of yes", "Negative answer"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promotion, briefly", "Commercial message"] },
        { number: 2, row: 0, col: 1, answer: "BASIL", clues: ["Pesto herb", "Leafy seasoning"] },
        { number: 3, row: 0, col: 3, answer: "OCEAN", clues: ["Atlantic or Pacific", "Huge body of water"] },
        { number: 4, row: 0, col: 4, answer: "NE", clues: ["Compass point", "Upper-right map direction"] },
        { number: 5, row: 1, col: 2, answer: "NUN", clues: ["Convent resident", "Habit wearer"] },
        { number: 7, row: 3, col: 0, answer: "FA", clues: ["A note after mi", "Do-re-mi syllable"] },
        { number: 9, row: 3, col: 4, answer: "LO", clues: ["Opposite of hi", "Low, in a poetic phrase"] },
      ],
    },
  },
  {
    id: "daily-3",
    date: "2026-03-29",
    title: "Late Bloom",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
    solution: [
      ["A", "B", "#", "F", "A"],
      ["D", "E", "L", "A", "Y"],
      ["#", "R", "E", "D", "#"],
      ["O", "R", "D", "E", "R"],
      ["M", "Y", "#", "D", "E"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Waist muscles, casually", "Core muscles, in slang"] },
        { number: 2, row: 0, col: 3, answer: "FA", clues: ["Scale note", "Do-re-mi syllable"] },
        { number: 4, row: 1, col: 0, answer: "DELAY", clues: ["Postpone", "Put off until later"] },
        { number: 6, row: 2, col: 1, answer: "RED", clues: ["Stoplight color", "Rose shade"] },
        { number: 7, row: 3, col: 0, answer: "ORDER", clues: ["Restaurant request", "Sequence or arrangement"] },
        { number: 8, row: 4, col: 0, answer: "MY", clues: ["Belonging to me", "Mine, before a noun"] },
        { number: 9, row: 4, col: 3, answer: "DE", clues: ["'Of,' in some surnames", "Small preposition in names"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promo spot", "Commercial message"] },
        { number: 2, row: 0, col: 1, answer: "BERRY", clues: ["Small juicy fruit", "Strawberry, for one"] },
        { number: 3, row: 0, col: 3, answer: "FADED", clues: ["Lost color", "Became less vivid"] },
        { number: 4, row: 0, col: 4, answer: "AY", clues: ["Yes vote", "Affirmative in Parliament"] },
        { number: 5, row: 1, col: 2, answer: "LED", clues: ["Guided", "Was out in front"] },
        { number: 7, row: 3, col: 0, answer: "OM", clues: ["Meditation syllable", "Yoga chant"] },
        { number: 9, row: 3, col: 4, answer: "RE", clues: ["Regarding", "About"] },
      ],
    },
  },
  {
    id: "daily-4",
    date: "2026-03-29",
    title: "Wide Awake",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
    solution: [
      ["A", "B", "#", "F", "A"],
      ["D", "R", "E", "A", "M"],
      ["#", "A", "N", "D", "#"],
      ["W", "I", "D", "E", "N"],
      ["E", "N", "#", "D", "O"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Midsection muscle, informally", "One pack member, maybe"] },
        { number: 2, row: 0, col: 3, answer: "FA", clues: ["Scale note", "Do-re-mi syllable"] },
        { number: 4, row: 1, col: 0, answer: "DREAM", clues: ["Sleeping vision", "Big ambition"] },
        { number: 6, row: 2, col: 1, answer: "AND", clues: ["Plus", "Connector word"] },
        { number: 7, row: 3, col: 0, answer: "WIDEN", clues: ["Make broader", "Increase the width of"] },
        { number: 8, row: 4, col: 0, answer: "EN", clues: ["Printer's dash", "A dash shorter than an em"] },
        { number: 9, row: 4, col: 3, answer: "DO", clues: ["Carry out", "Perform"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promo", "Commercial message"] },
        { number: 2, row: 0, col: 1, answer: "BRAIN", clues: ["Thinking organ", "What you use to reason"] },
        { number: 3, row: 0, col: 3, answer: "FADED", clues: ["Lost brightness", "Washed out in color"] },
        { number: 4, row: 0, col: 4, answer: "AM", clues: ["Morning half of a day", "First-person form of 'be'"] },
        { number: 5, row: 1, col: 2, answer: "END", clues: ["Finish", "Conclusion"] },
        { number: 7, row: 3, col: 0, answer: "WE", clues: ["You and I", "Us, as subject"] },
        { number: 9, row: 3, col: 4, answer: "NO", clues: ["Opposite of yes", "Negative reply"] },
      ],
    },
  },
  {
    id: "daily-5",
    date: "2026-03-29",
    title: "Cloud Cover",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
    ],
    solution: [
      ["C", "L", "O", "U", "D"],
      ["L", "#", "C", "#", "A"],
      ["O", "C", "E", "A", "N"],
      ["U", "#", "A", "#", "C"],
      ["D", "A", "N", "C", "E"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "CLOUD", clues: ["Puffy thing in the sky", "Visible vapor mass"] },
        { number: 3, row: 2, col: 0, answer: "OCEAN", clues: ["Pacific or Atlantic", "Huge body of water"] },
        { number: 5, row: 4, col: 0, answer: "DANCE", clues: ["Move to music", "Do the salsa, say"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "CLOUD", clues: ["Sky-covering mass", "Gray thing before rain, maybe"] },
        { number: 2, row: 0, col: 2, answer: "OCEAN", clues: ["Sea on a grand scale", "Body of salt water"] },
        { number: 4, row: 0, col: 4, answer: "DANCE", clues: ["Move with rhythm", "Waltz, tango, or foxtrot"] },
      ],
    },
  },
  {
    id: "daily-6",
    date: "2026-03-29",
    title: "Stone Order",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
    ],
    solution: [
      ["S", "T", "O", "N", "E"],
      ["T", "#", "R", "#", "A"],
      ["O", "R", "D", "E", "R"],
      ["N", "#", "E", "#", "T"],
      ["E", "A", "R", "T", "H"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "STONE", clues: ["Small rock", "Pebble or boulder, broadly"] },
        { number: 3, row: 2, col: 0, answer: "ORDER", clues: ["Arrangement", "Restaurant request"] },
        { number: 5, row: 4, col: 0, answer: "EARTH", clues: ["Our planet", "World beneath our feet"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "STONE", clues: ["Rocky material", "What a sculptor may carve"] },
        { number: 2, row: 0, col: 2, answer: "ORDER", clues: ["Neat sequence", "Command or request"] },
        { number: 4, row: 0, col: 4, answer: "EARTH", clues: ["The planet we call home", "Soil, in another sense"] },
      ],
    },
  },
];

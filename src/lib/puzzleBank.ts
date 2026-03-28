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
    id: "bank-1",
    date: "2026-03-28",
    title: "Cross Mini 1",
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
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscle, informally", "Core muscle, casually"] },
        { number: 2, row: 0, col: 3, answer: "WE", clues: ["Us, as subject", "You and me"] },
        { number: 4, row: 1, col: 0, answer: "TRAIL", clues: ["Path through the woods", "Hiking route"] },
        { number: 6, row: 2, col: 1, answer: "END", clues: ["Finish", "Conclusion"] },
        { number: 7, row: 3, col: 0, answer: "FADED", clues: ["Lost color or brightness", "No longer vivid"] },
        { number: 8, row: 4, col: 0, answer: "AD", clues: ["Promotional notice, briefly", "Commercial insert, for short"] },
        { number: 9, row: 4, col: 3, answer: "NO", clues: ["Opposite of yes", "Negative reply"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AT", clues: ["Located at", "At a place"] },
        { number: 2, row: 0, col: 1, answer: "BREAD", clues: ["Baked staple food", "Sandwich base"] },
        { number: 3, row: 0, col: 3, answer: "WIDEN", clues: ["Make wider", "Broaden"] },
        { number: 4, row: 0, col: 4, answer: "EL", clues: ["Spanish article", "Spanish 'the'"] },
        { number: 5, row: 1, col: 2, answer: "AND", clues: ["Conjunction meaning plus", "Linker meaning also"] },
        { number: 7, row: 3, col: 0, answer: "FA", clues: ["A musical note", "Do-re-mi syllable"] },
        { number: 9, row: 3, col: 4, answer: "DO", clues: ["Perform", "Carry out"] },
      ],
    },
  },

  {
    id: "bank-2",
    date: "2026-03-28",
    title: "Cross Mini 2",
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
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscle, informally", "Core muscle, casually"] },
        { number: 2, row: 0, col: 3, answer: "ON", clues: ["Activated", "Running, as a switch"] },
        { number: 4, row: 1, col: 0, answer: "DANCE", clues: ["Move to the music", "Do the tango, say"] },
        { number: 6, row: 2, col: 1, answer: "SUE", clues: ["Take legal action", "Bring a case against"] },
        { number: 7, row: 3, col: 0, answer: "FINAL", clues: ["Last in a series", "Ultimate"] },
        { number: 8, row: 4, col: 0, answer: "AL", clues: ["Bizarre singer Yankovic", "First name of Pacino"] },
        { number: 9, row: 4, col: 3, answer: "NO", clues: ["Opposite of yes", "Negative reply"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promotional message", "Commercial, briefly"] },
        { number: 2, row: 0, col: 1, answer: "BASIL", clues: ["Herb used in pesto", "Leafy seasoning"] },
        { number: 3, row: 0, col: 3, answer: "OCEAN", clues: ["Big blue expanse", "Atlantic or Pacific"] },
        { number: 4, row: 0, col: 4, answer: "NE", clues: ["Compass direction", "Northeast, briefly"] },
        { number: 5, row: 1, col: 2, answer: "NUN", clues: ["Sister in a convent", "Habit wearer"] },
        { number: 7, row: 3, col: 0, answer: "FA", clues: ["A musical note", "Do-re-mi syllable"] },
        { number: 9, row: 3, col: 4, answer: "LO", clues: ["Opposite of hi", "Low, in music notation"] },
      ],
    },
  },

  {
    id: "bank-3",
    date: "2026-03-28",
    title: "Cross Mini 3",
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
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscle, informally", "Core muscle, casually"] },
        { number: 2, row: 0, col: 3, answer: "FA", clues: ["A musical note", "Do-re-mi syllable"] },
        { number: 4, row: 1, col: 0, answer: "DELAY", clues: ["Postpone", "Cause to happen later"] },
        { number: 6, row: 2, col: 1, answer: "RED", clues: ["Stop-sign color", "Rose hue"] },
        { number: 7, row: 3, col: 0, answer: "ORDER", clues: ["Request or arrangement", "Sequence for items"] },
        { number: 8, row: 4, col: 0, answer: "MY", clues: ["Belonging to me", "Mine, before a noun"] },
        { number: 9, row: 4, col: 3, answer: "DE", clues: ["'Of,' in some names", "French/Spanish preposition"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promotional message", "Commercial, briefly"] },
        { number: 2, row: 0, col: 1, answer: "BERRY", clues: ["Small juicy fruit", "Strawberry, e.g."] },
        { number: 3, row: 0, col: 3, answer: "FADED", clues: ["Lost color or brightness", "No longer vivid"] },
        { number: 4, row: 0, col: 4, answer: "AY", clues: ["Yes vote", "Affirmative in Parliament"] },
        { number: 5, row: 1, col: 2, answer: "LED", clues: ["Guided", "Was in front"] },
        { number: 7, row: 3, col: 0, answer: "OM", clues: ["Meditative syllable", "Yoga chant"] },
        { number: 9, row: 3, col: 4, answer: "RE", clues: ["About", "Regarding"] },
      ],
    },
  },

  {
    id: "bank-4",
    date: "2026-03-28",
    title: "Cross Mini 4",
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
        { number: 1, row: 0, col: 0, answer: "AB", clues: ["Muscle, informally", "Core muscle, casually"] },
        { number: 2, row: 0, col: 3, answer: "FA", clues: ["A musical note", "Do-re-mi syllable"] },
        { number: 4, row: 1, col: 0, answer: "DREAM", clues: ["Sleeping vision", "Ambition or aspiration"] },
        { number: 6, row: 2, col: 1, answer: "AND", clues: ["Plus", "Connector word"] },
        { number: 7, row: 3, col: 0, answer: "WIDEN", clues: ["Make broader", "Increase the width of"] },
        { number: 8, row: 4, col: 0, answer: "EN", clues: ["Printing dash", "Em's shorter cousin"] },
        { number: 9, row: 4, col: 3, answer: "DO", clues: ["Perform", "Carry out"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AD", clues: ["Promotional message", "Commercial, briefly"] },
        { number: 2, row: 0, col: 1, answer: "BRAIN", clues: ["Thinking organ", "What you use to reason"] },
        { number: 3, row: 0, col: 3, answer: "FADED", clues: ["Lost brightness", "Washed out in color"] },
        { number: 4, row: 0, col: 4, answer: "AM", clues: ["Morning abbreviation", "Exist, first person singular"] },
        { number: 5, row: 1, col: 2, answer: "END", clues: ["Finish", "Conclusion"] },
        { number: 7, row: 3, col: 0, answer: "WE", clues: ["Us, as subject", "You and I"] },
        { number: 9, row: 3, col: 4, answer: "NO", clues: ["Opposite of yes", "Negative reply"] },
      ],
    },
  },

  {
    id: "bank-5",
    date: "2026-03-28",
    title: "Micro 1",
    rows: 3,
    cols: 3,
    grid: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    solution: [
      ["A", "D", "D"],
      ["P", "E", "A"],
      ["E", "N", "D"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "ADD", clues: ["Increase by combining", "Join to"] },
        { number: 4, row: 1, col: 0, answer: "PEA", clues: ["Small green vegetable", "Pod veggie"] },
        { number: 5, row: 2, col: 0, answer: "END", clues: ["Finish", "Conclusion"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "APE", clues: ["Primate", "Gorilla or chimp, e.g."] },
        { number: 2, row: 0, col: 1, answer: "DEN", clues: ["Animal lair", "Cozy room"] },
        { number: 3, row: 0, col: 2, answer: "DAD", clues: ["Father", "Papa"] },
      ],
    },
  },

  {
    id: "bank-6",
    date: "2026-03-28",
    title: "Micro 2",
    rows: 3,
    cols: 3,
    grid: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    solution: [
      ["A", "C", "E"],
      ["D", "A", "Y"],
      ["O", "R", "E"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "ACE", clues: ["Top score", "A perfect tennis serve"] },
        { number: 4, row: 1, col: 0, answer: "DAY", clues: ["24-hour period", "Morning to night"] },
        { number: 5, row: 2, col: 0, answer: "ORE", clues: ["Rock with metal in it", "Miner's target"] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "ADO", clues: ["Fuss", "Commotion"] },
        { number: 2, row: 0, col: 1, answer: "CAR", clues: ["Vehicle", "Automobile"] },
        { number: 3, row: 0, col: 2, answer: "EYE", clues: ["Sight organ", "Thing you wink"] },
      ],
    },
  },

  {
    id: "bank-7",
    date: "2026-03-28",
    title: "Mini Zig",
    rows: 3,
    cols: 3,
    grid: [
      ["", "", "#"],
      ["", "", ""],
      ["#", "", ""],
    ],
    solution: [
      ["A", "S", "#"],
      ["T", "I", "E"],
      ["#", "R", "N"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 0, answer: "AS", clues: ["In the role of", "Acting as"] },
        { number: 3, row: 1, col: 0, answer: "TIE", clues: ["Equal score", "Necktie, e.g."] },
        { number: 5, row: 2, col: 1, answer: "RN", clues: ["Hospital worker, briefly", "Nurse: Abbr."] },
      ],
      down: [
        { number: 1, row: 0, col: 0, answer: "AT", clues: ["Located at", "At a place"] },
        { number: 2, row: 0, col: 1, answer: "SIR", clues: ["Formal address", "Knighted man"] },
        { number: 4, row: 1, col: 2, answer: "EN", clues: ["Printer's dash", "Dash relative"] },
      ],
    },
  },

  {
    id: "bank-8",
    date: "2026-03-28",
    title: "Mini Corner",
    rows: 3,
    cols: 3,
    grid: [
      ["#", "", ""],
      ["", "", ""],
      ["", "", "#"],
    ],
    solution: [
      ["#", "O", "N"],
      ["E", "R", "E"],
      ["A", "T", "#"],
    ],
    clues: {
      across: [
        { number: 1, row: 0, col: 1, answer: "ON", clues: ["Activated", "Running, as a switch"] },
        { number: 3, row: 1, col: 0, answer: "ERE", clues: ["Before, poetically", "Poetic 'before'"] },
        { number: 5, row: 2, col: 0, answer: "AT", clues: ["Located at", "At a place"] },
      ],
      down: [
        { number: 1, row: 0, col: 1, answer: "ORT", clues: ["Table scrap", "Leftover bit of food"] },
        { number: 2, row: 0, col: 2, answer: "NE", clues: ["Compass direction", "Northeast, briefly"] },
        { number: 3, row: 1, col: 0, answer: "EA", clues: ["Each: Abbr.", "Per-item abbreviation"] },
      ],
    },
  },
];
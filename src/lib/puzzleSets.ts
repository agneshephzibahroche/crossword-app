export type CategoryDefinition = {
  id: string;
  label: string;
  words: string[];
};

export type PuzzleSetDefinition = {
  id: string;
  categories: CategoryDefinition[];
};

// Unlike a flat pool of independent categories (the previous design), each
// set here is authored as a whole day: the 3 categories are picked together
// specifically so some words look like they belong to a *different* one of
// the day's 3 groups than their actual answer. That's the actual mechanic
// that makes Connections-style games non-trivial -- a flat pool where every
// category's words are globally unique can never produce that moment,
// which is why the first version played as pure pattern-matching. Within
// one set, all 12 words must be unique (a word can't be a tile twice); the
// same word repeating across *different* sets is fine since only one set
// is ever shown per day.
export const PUZZLE_SETS: PuzzleSetDefinition[] = [
  {
    id: "citrus-colors-cards",
    categories: [
      { id: "citrus-fruits", label: "Citrus Fruits", words: ["LEMON", "ORANGE", "GRAPEFRUIT", "TANGERINE"] },
      { id: "colors", label: "Colors", words: ["RED", "TEAL", "NAVY", "LIME"] },
      { id: "card-games", label: "Card Games", words: ["POKER", "BRIDGE", "RUMMY", "SOLITAIRE"] },
    ],
  },
  {
    id: "apple-dogs-boxing",
    categories: [
      { id: "apple-wordplay", label: "___ Apple", words: ["TOFFEE", "CANDY", "PINE", "CRAB"] },
      // BOXER reads as an obvious dog breed, but it's withheld here and
      // placed with Boxing Terms instead -- the dog-breed list is complete
      // without it (LAB fills the 4th slot).
      { id: "dog-breeds", label: "Dog Breeds", words: ["POODLE", "BEAGLE", "LAB", "HUSKY"] },
      { id: "boxing-terms", label: "Boxing Terms", words: ["BOXER", "JAB", "HOOK", "CROSS"] },
    ],
  },
  {
    id: "chess-birds-cards",
    categories: [
      // ROOK and KING/QUEEN are the two most obvious chess pieces, and
      // both are deliberately withheld: ROOK becomes a Bird (a real,
      // common name for the bird), and KING/QUEEN move to Face Cards.
      // CASTLE is a common informal name for the rook, so Chess Pieces
      // still reads as a clean, correct set of 4 once solved.
      { id: "chess-pieces", label: "Chess Pieces", words: ["BISHOP", "KNIGHT", "PAWN", "CASTLE"] },
      { id: "birds", label: "Birds", words: ["ROOK", "ROBIN", "WREN", "FINCH"] },
      { id: "face-cards", label: "Face Cards", words: ["JACK", "QUEEN", "KING", "ACE"] },
    ],
  },
  {
    id: "big-cats-cars-cocktails",
    categories: [
      { id: "big-cats", label: "Big Cats", words: ["LION", "LEOPARD", "CHEETAH", "PANTHER"] },
      { id: "car-brands", label: "Car Brands", words: ["JAGUAR", "MAZDA", "HONDA", "FERRARI"] },
      { id: "cocktails", label: "Cocktails", words: ["MOJITO", "MARTINI", "MARGARITA", "DAIQUIRI"] },
    ],
  },
  {
    id: "ball-zodiac-constellations",
    categories: [
      { id: "ball-wordplay", label: "___ Ball", words: ["BASKET", "FOOT", "BASE", "MEAT"] },
      { id: "zodiac-signs", label: "Zodiac Signs", words: ["ARIES", "LIBRA", "CANCER", "VIRGO"] },
      // Every zodiac sign is also an official constellation, so LEO reads
      // just as easily as a sign -- it's withheld from Zodiac Signs above
      // specifically to sit here instead.
      { id: "constellations", label: "Constellations", words: ["LEO", "ORION", "DRACO", "PHOENIX"] },
    ],
  },
  {
    id: "planets-roman-gods-currencies",
    categories: [
      { id: "planets", label: "Planets", words: ["MARS", "VENUS", "SATURN", "NEPTUNE"] },
      { id: "roman-gods", label: "Roman Gods", words: ["JUPITER", "MERCURY", "PLUTO", "VULCAN"] },
      { id: "currencies", label: "World Currencies", words: ["DOLLAR", "EURO", "PESO", "YEN"] },
    ],
  },
  {
    id: "greek-gods-constellations-cheese",
    categories: [
      { id: "greek-gods", label: "Greek Gods", words: ["ZEUS", "HERMES", "APOLLO", "ATHENA"] },
      // HERCULES is Greek mythology through and through, but he's a hero,
      // not one of the Olympian gods -- a subtler trap than a straight
      // word swap, since it hinges on that distinction rather than a
      // literal double meaning.
      { id: "constellations-2", label: "Constellations", words: ["ORION", "HERCULES", "LYRA", "DRACO"] },
      { id: "cheese-types", label: "Types of Cheese", words: ["CHEDDAR", "BRIE", "GOUDA", "FETA"] },
    ],
  },
  {
    id: "norse-gods-superheroes-spices",
    categories: [
      { id: "norse-gods", label: "Norse Gods", words: ["ODIN", "LOKI", "FREYA", "BALDER"] },
      { id: "superheroes", label: "Superheroes", words: ["THOR", "BATMAN", "HULK", "FLASH"] },
      { id: "spices", label: "Spices", words: ["CINNAMON", "NUTMEG", "PAPRIKA", "TURMERIC"] },
    ],
  },
  {
    id: "rings-boardgames-dance",
    categories: [
      { id: "rings-wordplay", label: "Things With Rings", words: ["ONION", "TREE", "BOXING", "SATURN"] },
      { id: "board-games", label: "Board Games", words: ["MONOPOLY", "SCRABBLE", "CLUEDO", "RISK"] },
      { id: "dance-styles", label: "Dance Styles", words: ["BALLET", "TANGO", "SALSA", "WALTZ"] },
    ],
  },
  {
    id: "garden-cardgames-weather",
    categories: [
      { id: "garden-tools", label: "Garden Tools", words: ["SPADE", "RAKE", "TROWEL", "PRUNER"] },
      { id: "card-games-2", label: "Card Games", words: ["POKER", "BRIDGE", "RUMMY", "CANASTA"] },
      { id: "weather-events", label: "Weather Events", words: ["STORM", "BLIZZARD", "HURRICANE", "DROUGHT"] },
    ],
  },
  {
    id: "gems-earthy-colors-punctuation",
    categories: [
      { id: "gemstones", label: "Gemstones", words: ["PEARL", "JADE", "OPAL", "TOPAZ"] },
      { id: "earthy-colors", label: "Colors", words: ["CORAL", "AMBER", "IVORY", "OLIVE"] },
      { id: "punctuation-marks", label: "Punctuation Marks", words: ["COMMA", "PERIOD", "SEMICOLON", "APOSTROPHE"] },
    ],
  },
  {
    id: "silentk-farm-icecream",
    categories: [
      { id: "silent-k", label: "Silent \"K\"", words: ["KNIFE", "KNOT", "KNEE", "KNIGHT"] },
      { id: "farm-animals", label: "Farm Animals", words: ["COW", "PIG", "SHEEP", "GOAT"] },
      { id: "ice-cream-flavors", label: "Ice Cream Flavors", words: ["VANILLA", "CHOCOLATE", "STRAWBERRY", "PISTACHIO"] },
    ],
  },
  {
    id: "space-cars-sandwiches",
    categories: [
      // METEOR was a real Ford/Mercury model name -- withheld from Space
      // Objects so it can trap as a car instead.
      { id: "space-objects", label: "Space Objects", words: ["COMET", "ASTEROID", "NEBULA", "PULSAR"] },
      { id: "classic-cars", label: "Classic Car Models", words: ["METEOR", "MUSTANG", "IMPALA", "CORVETTE"] },
      { id: "sandwiches", label: "Sandwiches", words: ["REUBEN", "PANINI", "BLT", "GYRO"] },
    ],
  },
  {
    id: "farm-wordplay-insects-veggies",
    categories: [
      { id: "farm-wordplay", label: "___ Farm", words: ["ANT", "FUNNY", "WIND", "STUD"] },
      { id: "insects", label: "Insects", words: ["WASP", "BEETLE", "MOTH", "MIDGE"] },
      { id: "root-vegetables-2", label: "Root Vegetables", words: ["CARROT", "POTATO", "BEET", "TURNIP"] },
    ],
  },
  {
    id: "yoga-reptiles-desserts",
    categories: [
      { id: "yoga-poses", label: "Yoga Poses", words: ["WARRIOR", "TRIANGLE", "LOTUS", "BRIDGE"] },
      { id: "reptiles", label: "Reptiles", words: ["COBRA", "IGUANA", "GECKO", "LIZARD"] },
      { id: "desserts", label: "Desserts", words: ["TIRAMISU", "BROWNIE", "CHEESECAKE", "MACARON"] },
    ],
  },
  {
    id: "letter-sounds-dinosaurs-partygames",
    categories: [
      { id: "letter-sounds", label: "Sounds Like a Letter", words: ["BEE", "SEA", "TEA", "ARE"] },
      { id: "dinosaurs", label: "Dinosaurs", words: ["TRICERATOPS", "STEGOSAURUS", "VELOCIRAPTOR", "BRONTOSAURUS"] },
      { id: "party-games", label: "Party Games", words: ["CHARADES", "PICTIONARY", "TWISTER", "JENGA"] },
    ],
  },
  {
    id: "keyboard-organs-sandwiches",
    categories: [
      { id: "keyboard-instruments", label: "Keyboard Instruments", words: ["PIANO", "ORGAN", "HARPSICHORD", "ACCORDION"] },
      { id: "body-parts", label: "Body Parts", words: ["HEART", "LIVER", "KIDNEY", "LUNG"] },
      { id: "sandwiches-2", label: "Sandwiches", words: ["BLT", "PANINI", "GYRO", "CLUB"] },
    ],
  },
  {
    id: "pixar-games-water",
    categories: [
      { id: "pixar-movies", label: "Pixar Movies", words: ["COCO", "BRAVE", "ONWARD", "LUCA"] },
      // POOL is a body of water just as much as it's a game -- withheld
      // from Bodies of Water below so it can trap here instead.
      { id: "tabletop-games", label: "Tabletop & Cue Games", words: ["POOL", "DARTS", "BINGO", "CHESS"] },
      { id: "bodies-of-water", label: "Bodies of Water", words: ["LAKE", "POND", "CREEK", "RIVER"] },
    ],
  },
  {
    id: "money-slang-male-animals-amphibians",
    categories: [
      // BUCK is the most obvious piece of money slang here, but it's held
      // back for Male Animal Names -- MOOLAH fills its spot.
      { id: "money-slang", label: "Money Slang", words: ["GRAND", "DOUGH", "BREAD", "MOOLAH"] },
      { id: "male-animals", label: "Male Animal Names", words: ["BUCK", "RAM", "BULL", "DRAKE"] },
      { id: "amphibians", label: "Amphibians", words: ["FROG", "TOAD", "NEWT", "SALAMANDER"] },
    ],
  },
  {
    id: "storm-wordplay-primates-shoes",
    categories: [
      { id: "storm-wordplay", label: "___ Storm", words: ["THUNDER", "SAND", "SNOW", "RAIN"] },
      { id: "primates", label: "Primates", words: ["GORILLA", "CHIMPANZEE", "ORANGUTAN", "BABOON"] },
      { id: "shoe-types", label: "Types of Shoes", words: ["SNEAKER", "SANDAL", "LOAFER", "BOOT"] },
    ],
  },
];

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
    id: "apple-dogs-ocean",
    categories: [
      { id: "apple-wordplay", label: "___ Apple", words: ["TOFFEE", "CANDY", "PINE", "CRAB"] },
      { id: "dog-breeds", label: "Dog Breeds", words: ["POODLE", "BEAGLE", "HUSKY", "BOXER"] },
      { id: "ocean-creatures", label: "Ocean Creatures", words: ["DOLPHIN", "OCTOPUS", "JELLYFISH", "STARFISH"] },
    ],
  },
  {
    id: "chess-cards-herbs",
    categories: [
      { id: "chess-pieces", label: "Chess Pieces", words: ["BISHOP", "KNIGHT", "ROOK", "PAWN"] },
      { id: "face-cards", label: "Face Cards", words: ["JACK", "QUEEN", "KING", "ACE"] },
      { id: "herbs", label: "Herbs", words: ["BASIL", "THYME", "OREGANO", "ROSEMARY"] },
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
    id: "ball-veggies-zodiac",
    categories: [
      { id: "ball-wordplay", label: "___ Ball", words: ["BASKET", "FOOT", "BASE", "MEAT"] },
      { id: "root-vegetables", label: "Root Vegetables", words: ["CARROT", "POTATO", "BEET", "TURNIP"] },
      { id: "zodiac-signs", label: "Zodiac Signs", words: ["ARIES", "LIBRA", "SCORPIO", "PISCES"] },
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
      { id: "constellations", label: "Constellations", words: ["ORION", "GEMINI", "LEO", "TAURUS"] },
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
    id: "space-reindeer-sandwiches",
    categories: [
      { id: "space-objects", label: "Space Objects", words: ["COMET", "ASTEROID", "METEOR", "NEBULA"] },
      { id: "reindeer-names", label: "Reindeer Names", words: ["DASHER", "PRANCER", "VIXEN", "CUPID"] },
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
    id: "pixar-continents-herbs",
    categories: [
      { id: "pixar-movies", label: "Pixar Movies", words: ["COCO", "BRAVE", "ONWARD", "LUCA"] },
      { id: "continents", label: "Continents", words: ["AFRICA", "ASIA", "EUROPE", "ANTARCTICA"] },
      { id: "herbs-2", label: "Herbs", words: ["THYME", "OREGANO", "ROSEMARY", "SAGE"] },
    ],
  },
  {
    id: "money-slang-currencies-amphibians",
    categories: [
      { id: "money-slang", label: "Money Slang", words: ["BUCK", "GRAND", "DOUGH", "BREAD"] },
      { id: "currencies-2", label: "World Currencies", words: ["DOLLAR", "EURO", "PESO", "YEN"] },
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

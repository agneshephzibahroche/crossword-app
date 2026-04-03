export type DictionaryEntry = {
  word: string;
  clue: string;
  clues: string[];
  quality: number;
  allowInDaily: boolean;
  tags: string[];
};

type RawDictionaryEntry = {
  word: string;
  clue: string;
};

type DictionaryOverride = {
  clues?: string[];
  quality?: number;
  allowInDaily?: boolean;
  tags?: string[];
};

const DICTIONARY_OVERRIDES: Record<string, DictionaryOverride> = {
  AD: {
    quality: 1,
    allowInDaily: false,
    tags: ["abbreviation", "crosswordese"],
  },
  EL: {
    quality: 1,
    allowInDaily: false,
    tags: ["foreign", "crosswordese"],
  },
  EN: {
    quality: 1,
    allowInDaily: false,
    tags: ["printing", "crosswordese"],
  },
  FA: {
    quality: 1,
    allowInDaily: false,
    tags: ["music", "crosswordese"],
  },
  NE: {
    quality: 1,
    allowInDaily: false,
    tags: ["abbreviation", "crosswordese"],
  },
  RE: {
    quality: 1,
    allowInDaily: false,
    tags: ["latin", "crosswordese"],
  },
  AB: {
    quality: 2,
    allowInDaily: false,
    tags: ["informal", "abbreviation"],
  },
  AM: {
    clues: ["Morning half of the day", "Hours before noon"],
    quality: 3,
  },
  AIR: {
    clues: ["What we breathe", "Invisible stuff all around us"],
    quality: 7,
  },
  AND: {
    clues: ["Plus", "Common joining word"],
    quality: 6,
  },
  ANT: {
    clues: ["Tiny hardworking insect", "Picnic pest, often"],
    quality: 7,
  },
  APPLE: {
    clues: ["Common orchard fruit", "Fruit in many lunchboxes"],
    quality: 10,
    tags: ["food", "fresh"],
  },
  BASIL: {
    clues: ["Pesto herb", "Leafy herb in pesto"],
    quality: 9,
    tags: ["food"],
  },
  BERRY: {
    clues: ["Small juicy fruit", "Blueberry or raspberry"],
    quality: 9,
    tags: ["food"],
  },
  BRAIN: {
    clues: ["Thinking organ", "The body's command center"],
    quality: 9,
  },
  BREAD: {
    clues: ["Baked loaf", "Sandwich base, often"],
    quality: 9,
    tags: ["food"],
  },
  CHAIR: {
    clues: ["Seat with a back", "Something you pull up to a table"],
    quality: 8,
  },
  CLOCK: {
    clues: ["It tells time", "Wall item with hands, maybe"],
    quality: 8,
  },
  CRISP: {
    clues: ["Pleasantly crunchy", "Fresh and snappy"],
    quality: 9,
  },
  CLOUD: {
    clues: ["Visible sky vapor", "Something drifting overhead"],
    quality: 8,
  },
  COAST: {
    clues: ["Edge of the sea", "Shoreline"],
    quality: 9,
  },
  CORAL: {
    clues: ["Reef material", "Pinkish-orange hue"],
    quality: 8,
  },
  DANCE: {
    clues: ["Move to the music", "Bust a move"],
    quality: 8,
  },
  DRIFT: {
    clues: ["Move slowly with the current", "Wander without direction"],
    quality: 8,
  },
  DREAM: {
    clues: ["Sleeping vision", "Hopeful goal"],
    quality: 8,
  },
  EARTH: {
    clues: ["Planet we live on", "The third planet from the sun"],
    quality: 8,
  },
  FLAME: {
    clues: ["Fire's visible part", "Flickering bit of a candle"],
    quality: 8,
  },
  FLOUR: {
    clues: ["Baking powder in a bag", "Ingredient in many breads"],
    quality: 9,
    tags: ["food"],
  },
  FROST: {
    clues: ["Icy morning coating", "Thin winter glaze"],
    quality: 8,
  },
  FRUIT: {
    clues: ["Apple or banana", "Sweet produce section item"],
    quality: 9,
    tags: ["food"],
  },
  GLASS: {
    clues: ["Window material", "Cup material, often"],
    quality: 8,
  },
  GLOVE: {
    clues: ["Warm hand covering", "Baseball mitt, for one"],
    quality: 8,
  },
  GROVE: {
    clues: ["Small stand of trees", "Cluster of orchard trees"],
    quality: 8,
  },
  HOUSE: {
    clues: ["Place to live", "Home building"],
    quality: 8,
  },
  JUICE: {
    clues: ["Freshly squeezed drink", "Orange drink, often"],
    quality: 9,
    tags: ["food"],
  },
  KNIFE: {
    clues: ["Kitchen cutting tool", "Blade on a dinner table"],
    quality: 8,
  },
  LATTE: {
    clues: ["Espresso drink with milk", "Foamy cafe order"],
    quality: 9,
    tags: ["food"],
  },
  LIGHT: {
    clues: ["Opposite of darkness", "Something a lamp provides"],
    quality: 8,
  },
  LINEN: {
    clues: ["Crisp tablecloth fabric", "Sheets and napkins, collectively"],
    quality: 8,
  },
  MAGIC: {
    clues: ["Stage illusion art", "Wizardly power"],
    quality: 9,
  },
  MAPLE: {
    clues: ["Tree used for syrup", "Leaf on Canada's flag"],
    quality: 9,
  },
  METAL: {
    clues: ["Steel or copper", "Material in many tools"],
    quality: 8,
  },
  MODEL: {
    clues: ["Miniature version", "Fashion runway walker"],
    quality: 7,
  },
  OLIVE: {
    clues: ["Martini garnish", "Small savory fruit"],
    quality: 9,
    tags: ["food"],
  },
  OCEAN: {
    clues: ["Atlantic or Pacific", "Vast body of salt water"],
    quality: 9,
  },
  ONION: {
    clues: ["Layered bulb in a kitchen", "Vegetable that may make you cry"],
    quality: 9,
    tags: ["food"],
  },
  OPERA: {
    clues: ["Grand theatrical music form", "Sung drama"],
    quality: 8,
  },
  PANEL: {
    clues: ["Section of a wall", "Group of judges or experts"],
    quality: 7,
  },
  PLANE: {
    clues: ["Flying vehicle", "Jet, for one"],
    quality: 8,
  },
  PLANT: {
    clues: ["Leafy living thing", "Houseplant, for example"],
    quality: 8,
  },
  PLATE: {
    clues: ["Dish for dinner", "What a meal may be served on"],
    quality: 8,
  },
  PORCH: {
    clues: ["Front stoop area", "Covered entrance platform"],
    quality: 8,
  },
  RADIO: {
    clues: ["Broadcast receiver", "Car stereo source, maybe"],
    quality: 8,
  },
  REACH: {
    clues: ["Stretch for", "Manage to touch"],
    quality: 7,
  },
  RIVER: {
    clues: ["Large natural stream", "Mississippi, for one"],
    quality: 9,
  },
  SALAD: {
    clues: ["Bowl of greens", "Lunch with lettuce, maybe"],
    quality: 9,
    tags: ["food"],
  },
  SAUCE: {
    clues: ["Pasta topper", "Something spooned over a dish"],
    quality: 9,
    tags: ["food"],
  },
  SHEEP: {
    clues: ["Woolly farm animal", "Animal counted to fall asleep"],
    quality: 8,
  },
  SHELL: {
    clues: ["Seashell, for one", "Outer layer of an egg"],
    quality: 8,
  },
  SMILE: {
    clues: ["Happy facial expression", "Grin"],
    quality: 9,
  },
  SPICE: {
    clues: ["Seasoning in a jar", "Cinnamon or cumin"],
    quality: 9,
    tags: ["food"],
  },
  STACK: {
    clues: ["Pile up neatly", "Tall pile"],
    quality: 7,
  },
  SOUND: {
    clues: ["What you hear", "Something picked up by the ears"],
    quality: 8,
  },
  SPOON: {
    clues: ["Soup utensil", "Cereal scooper"],
    quality: 8,
  },
  STONE: {
    clues: ["Small rock", "Hard thing you might skip on water"],
    quality: 8,
  },
  TABLE: {
    clues: ["Furniture with a flat top", "Dining-room surface"],
    quality: 9,
  },
  TOAST: {
    clues: ["Browned breakfast bread", "Raise a glass in honor of"],
    quality: 9,
    tags: ["food"],
  },
  THYME: {
    clues: ["Savory kitchen herb", "Herb with tiny leaves"],
    quality: 8,
    tags: ["food"],
  },
  TRAIL: {
    clues: ["Path through the woods", "Hiking route"],
    quality: 8,
  },
  TRAIN: {
    clues: ["Rail vehicle", "Locomotive and cars"],
    quality: 8,
  },
  TREAT: {
    clues: ["Special little reward", "Something sweet after dinner, maybe"],
    quality: 8,
  },
  URBAN: {
    clues: ["City-based", "Not rural"],
    quality: 7,
  },
  WATER: {
    clues: ["Liquid essential for life", "What fills a glass from the tap"],
    quality: 10,
  },
  WHEEL: {
    clues: ["Circular car part", "Round part of a bike"],
    quality: 8,
  },
  WORLD: {
    clues: ["The Earth and its people", "The whole planet"],
    quality: 9,
  },
};

const RAW_DICTIONARY: RawDictionaryEntry[] = [
  { word: "AB", clue: "Muscles by the waist, informally" },
  { word: "AD", clue: "Promotional message, briefly" },
  { word: "AM", clue: "Morning half of a day" },
  { word: "AN", clue: "Indefinite article" },
  { word: "AS", clue: "In the role of" },
  { word: "AT", clue: "In a particular place" },
  { word: "DO", clue: "Carry out" },
  { word: "EL", clue: "Spanish word for 'the'" },
  { word: "EN", clue: "Printer's dash" },
  { word: "FA", clue: "Scale note after mi" },
  { word: "GO", clue: "Move along" },
  { word: "HE", clue: "Male pronoun" },
  { word: "HI", clue: "Casual greeting" },
  { word: "IN", clue: "Fashionable" },
  { word: "IT", clue: "Thing just mentioned" },
  { word: "ME", clue: "Object form of 'I'" },
  { word: "MY", clue: "Belonging to me" },
  { word: "NE", clue: "Compass point" },
  { word: "NO", clue: "Opposite of yes" },
  { word: "OF", clue: "Belonging to" },
  { word: "ON", clue: "Activated" },
  { word: "OR", clue: "Either-choice conjunction" },
  { word: "OX", clue: "Field-plowing animal" },
  { word: "RE", clue: "About; regarding" },
  { word: "SO", clue: "Therefore" },
  { word: "TO", clue: "In the direction of" },
  { word: "US", clue: "You and me" },
  { word: "WE", clue: "You and I" },
  { word: "AIR", clue: "What we breathe" },
  { word: "AND", clue: "Plus" },
  { word: "ANT", clue: "Tiny hardworking insect" },
  { word: "ANY", clue: "No matter which" },
  { word: "ARE", clue: "Plural form of 'be'" },
  { word: "ART", clue: "Gallery fare" },
  { word: "ASH", clue: "Powdery fire residue" },
  { word: "ATE", clue: "Had dinner" },
  { word: "BAD", clue: "Not good" },
  { word: "BAG", clue: "Carryall with handles" },
  { word: "BAR", clue: "Pub counter" },
  { word: "BAY", clue: "Inlet of the sea" },
  { word: "BED", clue: "Place to sleep" },
  { word: "BEE", clue: "Honey-making insect" },
  { word: "BET", clue: "Wager" },
  { word: "BIN", clue: "Storage container" },
  { word: "BIT", clue: "Tiny amount" },
  { word: "BOX", clue: "Square container" },
  { word: "BOY", clue: "Young lad" },
  { word: "CAB", clue: "Taxi" },
  { word: "CAN", clue: "Be able to" },
  { word: "CAP", clue: "Baseball hat" },
  { word: "CAR", clue: "Road vehicle" },
  { word: "CAT", clue: "Purring pet" },
  { word: "COW", clue: "Milk-giving farm animal" },
  { word: "DAY", clue: "Twenty-four-hour span" },
  { word: "DEN", clue: "Cozy room" },
  { word: "DOG", clue: "Barking pet" },
  { word: "DOT", clue: "Tiny spot" },
  { word: "DRY", clue: "Not wet" },
  { word: "DUE", clue: "Owed" },
  { word: "EAR", clue: "Hearing organ" },
  { word: "EAT", clue: "Have a meal" },
  { word: "EEL", clue: "Slippery swimmer" },
  { word: "EGG", clue: "Breakfast shell item" },
  { word: "END", clue: "Finish" },
  { word: "ERA", clue: "Long span of history" },
  { word: "EYE", clue: "Seeing organ" },
  { word: "FAN", clue: "Devoted supporter" },
  { word: "FAR", clue: "Not near" },
  { word: "FED", clue: "Gave food to" },
  { word: "FIG", clue: "Jam fruit" },
  { word: "FIN", clue: "Fish appendage" },
  { word: "FIT", clue: "In good shape" },
  { word: "FOE", clue: "Enemy" },
  { word: "FOG", clue: "Low cloud" },
  { word: "FUN", clue: "Playful enjoyment" },
  { word: "FUR", clue: "Animal coat" },
  { word: "GAP", clue: "Empty space" },
  { word: "GAS", clue: "Fuel from a pump" },
  { word: "GET", clue: "Receive" },
  { word: "GUM", clue: "Chewy candy" },
  { word: "GUN", clue: "Pistol or rifle" },
  { word: "GUY", clue: "Man, informally" },
  { word: "HAT", clue: "Cap or fedora" },
  { word: "HAY", clue: "Dried horse feed" },
  { word: "HEN", clue: "Egg-laying bird" },
  { word: "HER", clue: "Female pronoun in object form" },
  { word: "HIT", clue: "Strike successfully" },
  { word: "HOT", clue: "Not cold" },
  { word: "ICE", clue: "Frozen water" },
  { word: "INK", clue: "Pen filler" },
  { word: "JAM", clue: "Sweet fruit spread" },
  { word: "JAR", clue: "Glass container" },
  { word: "JET", clue: "Fast aircraft" },
  { word: "JOB", clue: "Paid work" },
  { word: "JOY", clue: "Great delight" },
  { word: "KEY", clue: "Door opener" },
  { word: "KID", clue: "Youngster" },
  { word: "KIT", clue: "Set of tools" },
  { word: "LAB", clue: "Science room" },
  { word: "LAP", clue: "Circuit around a track" },
  { word: "LAW", clue: "Rule of the land" },
  { word: "LEG", clue: "Limb for walking" },
  { word: "LID", clue: "Top of a pot" },
  { word: "LIP", clue: "Part of the mouth" },
  { word: "LOG", clue: "Wooden trunk section" },
  { word: "MAP", clue: "Guide to roads" },
  { word: "MAT", clue: "Welcome-rug item" },
  { word: "MEN", clue: "Adult males" },
  { word: "MIX", clue: "Blend together" },
  { word: "MOP", clue: "Floor-cleaning tool" },
  { word: "MUD", clue: "Wet dirt" },
  { word: "MUG", clue: "Coffee cup" },
  { word: "NET", clue: "Soccer goal mesh" },
  { word: "NOD", clue: "Head bob of agreement" },
  { word: "NOT", clue: "Negative word" },
  { word: "NUN", clue: "Convent resident" },
  { word: "NUT", clue: "Hard-shelled snack" },
  { word: "OAK", clue: "Tree that yields acorns" },
  { word: "OAR", clue: "Rowing tool" },
  { word: "ODD", clue: "Not even" },
  { word: "OIL", clue: "Cooking or motor liquid" },
  { word: "OLD", clue: "No longer young" },
  { word: "ONE", clue: "Single unit" },
  { word: "ORE", clue: "Metal-bearing rock" },
  { word: "OWL", clue: "Nocturnal bird" },
  { word: "PAD", clue: "Notebook sheet holder" },
  { word: "PAN", clue: "Skillet" },
  { word: "PEN", clue: "Writing tool" },
  { word: "PET", clue: "Beloved animal companion" },
  { word: "PIG", clue: "Farm oinker" },
  { word: "PIN", clue: "Small fastener" },
  { word: "PIT", clue: "Seed in a peach" },
  { word: "POD", clue: "Pea container" },
  { word: "POT", clue: "Cooking vessel" },
  { word: "RAG", clue: "Old cloth" },
  { word: "RAM", clue: "Male sheep" },
  { word: "RAN", clue: "Moved quickly on foot" },
  { word: "RAP", clue: "Talk sharply to" },
  { word: "RAT", clue: "Long-tailed rodent" },
  { word: "RED", clue: "Stoplight color" },
  { word: "RIM", clue: "Edge of a cup" },
  { word: "RIP", clue: "Tear apart" },
  { word: "ROD", clue: "Fishing pole, briefly" },
  { word: "RUG", clue: "Floor covering" },
  { word: "RUN", clue: "Move quickly" },
  { word: "SAD", clue: "Unhappy" },
  { word: "SAG", clue: "Droop" },
  { word: "SAP", clue: "Tree fluid" },
  { word: "SAT", clue: "Took a seat" },
  { word: "SAW", clue: "Tool with teeth" },
  { word: "SEA", clue: "Saltwater expanse" },
  { word: "SET", clue: "Put in place" },
  { word: "SEW", clue: "Stitch fabric" },
  { word: "SHY", clue: "Timid" },
  { word: "SIN", clue: "Moral wrong" },
  { word: "SIP", clue: "Small drink" },
  { word: "SIR", clue: "Formal address" },
  { word: "SKY", clue: "What is overhead" },
  { word: "SON", clue: "Boy child" },
  { word: "SOW", clue: "Plant as seeds" },
  { word: "SUN", clue: "Daytime star" },
  { word: "TAN", clue: "Brown in the sun" },
  { word: "TAP", clue: "Light knock" },
  { word: "TAR", clue: "Road-covering goo" },
  { word: "TEA", clue: "Earl Grey, for one" },
  { word: "TEN", clue: "Double five" },
  { word: "TIN", clue: "Can metal" },
  { word: "TIP", clue: "Gratuity" },
  { word: "TOE", clue: "Foot digit" },
  { word: "TON", clue: "Two thousand pounds" },
  { word: "TOP", clue: "Highest point" },
  { word: "TOY", clue: "Plaything" },
  { word: "URN", clue: "Decorative vase" },
  { word: "USE", clue: "Put to work" },
  { word: "VAN", clue: "Large family vehicle" },
  { word: "WAR", clue: "Armed conflict" },
  { word: "WAS", clue: "Past form of 'is'" },
  { word: "WAY", clue: "Method or route" },
  { word: "WEB", clue: "Spider's trap" },
  { word: "WET", clue: "Covered in water" },
  { word: "WIN", clue: "Come out on top" },
  { word: "YAK", clue: "Shaggy Himalayan animal" },
  { word: "YAM", clue: "Orange-fleshed tuber" },
  { word: "YEN", clue: "Strong desire" },
  { word: "YES", clue: "Affirmative reply" },
  { word: "YET", clue: "Up to now" },
  { word: "APPLE", clue: "Common orchard fruit" },
  { word: "BASIL", clue: "Pesto herb" },
  { word: "BERRY", clue: "Small juicy fruit" },
  { word: "BRAIN", clue: "Thinking organ" },
  { word: "BREAD", clue: "Baked loaf" },
  { word: "BRICK", clue: "Rectangular building block" },
  { word: "CHAIR", clue: "Seat with a back" },
  { word: "CLOCK", clue: "It tells time" },
  { word: "CLOUD", clue: "Visible sky vapor" },
  { word: "DANCE", clue: "Move to the music" },
  { word: "DELAY", clue: "Postpone" },
  { word: "DREAM", clue: "Sleeping vision" },
  { word: "EARTH", clue: "Planet we live on" },
  { word: "FADED", clue: "Lost its brightness" },
  { word: "FINAL", clue: "Last in a series" },
  { word: "GRASS", clue: "Lawn cover" },
  { word: "HOUSE", clue: "Place to live" },
  { word: "LIGHT", clue: "Opposite of darkness" },
  { word: "MOUSE", clue: "Small rodent" },
  { word: "OCEAN", clue: "Atlantic or Pacific" },
  { word: "ORDER", clue: "Arrangement or request" },
  { word: "PLANE", clue: "Flying vehicle" },
  { word: "PLANT", clue: "Leafy living thing" },
  { word: "PLATE", clue: "Dish for dinner" },
  { word: "RIVER", clue: "Large natural stream" },
  { word: "SHEEP", clue: "Woolly farm animal" },
  { word: "SHINE", clue: "Give off light" },
  { word: "SMILE", clue: "Happy facial expression" },
  { word: "SNAKE", clue: "Legless reptile" },
  { word: "SOUND", clue: "What you hear" },
  { word: "SPOON", clue: "Soup utensil" },
  { word: "STONE", clue: "Small rock" },
  { word: "STORE", clue: "Retail shop" },
  { word: "TABLE", clue: "Furniture with a flat top" },
  { word: "THYME", clue: "Savory kitchen herb" },
  { word: "TRAIL", clue: "Path through the woods" },
  { word: "TRAIN", clue: "Rail vehicle" },
  { word: "WATER", clue: "Liquid essential for life" },
  { word: "WHEEL", clue: "Circular car part" },
  { word: "WHITE", clue: "Color of fresh snow" },
  { word: "WIDEN", clue: "Make broader" },
  { word: "WORLD", clue: "The Earth and its people" },
  { word: "BEACH", clue: "Sandy ocean spot" },
  { word: "BISON", clue: "Shaggy plains animal" },
  { word: "BLOOM", clue: "Flower fully" },
  { word: "BOARD", clue: "Flat piece of wood" },
  { word: "BRAID", clue: "Plait of hair" },
  { word: "BRINE", clue: "Salty preserving liquid" },
  { word: "BROTH", clue: "Soup base" },
  { word: "BUNCH", clue: "Cluster of things" },
  { word: "BURST", clue: "Sudden pop of energy" },
  { word: "CABLE", clue: "Thick wire" },
  { word: "CANDY", clue: "Sweet treat" },
  { word: "CANOE", clue: "Paddled narrow boat" },
  { word: "CEDAR", clue: "Aromatic wood tree" },
  { word: "CHILI", clue: "Spicy stew or pepper" },
  { word: "CLOVE", clue: "Aromatic spice bud" },
  { word: "COAST", clue: "Shoreline" },
  { word: "CORAL", clue: "Reef builder" },
  { word: "CRISP", clue: "Pleasantly crunchy" },
  { word: "CROWN", clue: "Royal headwear" },
  { word: "DAISY", clue: "Simple white-petaled flower" },
  { word: "DELTA", clue: "River-mouth landform" },
  { word: "DINER", clue: "Casual roadside restaurant" },
  { word: "DROPS", clue: "Falls in little bits" },
  { word: "DRIFT", clue: "Float slowly" },
  { word: "FERNS", clue: "Frilly green plants" },
  { word: "FIELD", clue: "Wide grassy area" },
  { word: "FLORA", clue: "Plant life" },
  { word: "FLAME", clue: "Candle tip, often" },
  { word: "FLOUR", clue: "Baking pantry staple" },
  { word: "FROST", clue: "Icy window coating" },
  { word: "FRUIT", clue: "Apple or pear" },
  { word: "GLADE", clue: "Open space in a forest" },
  { word: "GLASS", clue: "Window material" },
  { word: "GLOVE", clue: "Hand warmer" },
  { word: "GRAPE", clue: "Vineyard fruit" },
  { word: "GROVE", clue: "Small group of trees" },
  { word: "HERON", clue: "Long-legged wading bird" },
  { word: "HONEY", clue: "Sweet syrup from bees" },
  { word: "IVORY", clue: "Creamy white color" },
  { word: "JUICE", clue: "Freshly squeezed drink" },
  { word: "KNEAD", clue: "Work dough by hand" },
  { word: "KNIFE", clue: "Sharp kitchen tool" },
  { word: "LATTE", clue: "Milky espresso drink" },
  { word: "LILAC", clue: "Purple flowering shrub" },
  { word: "LEMON", clue: "Sour yellow citrus" },
  { word: "LINEN", clue: "Cloth for sheets or napkins" },
  { word: "LODGE", clue: "Rustic vacation cabin" },
  { word: "MAGIC", clue: "Wizardly wonder" },
  { word: "MANGO", clue: "Tropical orange fruit" },
  { word: "MAPLE", clue: "Tree tied to syrup" },
  { word: "MARSH", clue: "Boggy wetland" },
  { word: "MELON", clue: "Big juicy summer fruit" },
  { word: "METAL", clue: "Steel or iron" },
  { word: "MODEL", clue: "Miniature version" },
  { word: "MUSIC", clue: "Organized sound" },
  { word: "NOBLE", clue: "Having high character" },
  { word: "OLIVE", clue: "Savory martini garnish" },
  { word: "ONION", clue: "Vegetable with layers" },
  { word: "OPERA", clue: "Sung stage drama" },
  { word: "ORBIT", clue: "Path around a planet" },
  { word: "PANEL", clue: "Flat section or group of judges" },
  { word: "PASTA", clue: "Noodles for dinner" },
  { word: "PECAN", clue: "Buttery pie nut" },
  { word: "PEACH", clue: "Fuzzy stone fruit" },
  { word: "PEARL", clue: "Gem from an oyster" },
  { word: "PETAL", clue: "Part of a flower" },
  { word: "PIZZA", clue: "Cheesy pie slice source" },
  { word: "PLAZA", clue: "Open public square" },
  { word: "PORCH", clue: "Front stoop" },
  { word: "PRISM", clue: "Light-splitting solid" },
  { word: "QUART", clue: "Two-pint measure" },
  { word: "RADIO", clue: "Broadcast receiver" },
  { word: "REACH", clue: "Stretch toward" },
  { word: "REEDY", clue: "Full of marsh plants" },
  { word: "ROBIN", clue: "Orange-breasted bird" },
  { word: "ROAST", clue: "Cook in the oven" },
  { word: "SALON", clue: "Haircut business" },
  { word: "SALAD", clue: "Bowl of greens" },
  { word: "SAUCE", clue: "Pasta topper" },
  { word: "SCALE", clue: "Bathroom weight checker" },
  { word: "SCARF", clue: "Winter neck wrap" },
  { word: "SHELL", clue: "Outer covering" },
  { word: "SHORE", clue: "Land by the water" },
  { word: "SPICE", clue: "Seasoning in a rack" },
  { word: "STACK", clue: "Pile up" },
  { word: "STEAM", clue: "Mist from a hot mug" },
  { word: "STORM", clue: "Wild weather event" },
  { word: "SUNNY", clue: "Bright and cheerful" },
  { word: "SWEET", clue: "Sugary" },
  { word: "TIGER", clue: "Striped big cat" },
  { word: "TOAST", clue: "Browned breakfast bread" },
  { word: "TREAT", clue: "Little reward" },
  { word: "TULIP", clue: "Cup-shaped spring flower" },
  { word: "TUNER", clue: "Radio dial component" },
  { word: "URBAN", clue: "City-based" },
  { word: "VENUE", clue: "Place for an event" },
  { word: "WAVES", clue: "Ocean rollers" },
  { word: "WHEAT", clue: "Grain used in flour" },
  { word: "WHISK", clue: "Kitchen tool for beating eggs" },
  { word: "WOODS", clue: "Forest area" },
  { word: "WOVEN", clue: "Made on a loom" },
  { word: "YEAST", clue: "Bread-rising ingredient" },
];

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function inferQuality(word: string) {
  if (word.length >= 5) {
    return 8;
  }

  if (word.length === 4) {
    return 7;
  }

  if (word.length === 3) {
    return 6;
  }

  return 3;
}

function buildTags(word: string, override?: DictionaryOverride) {
  const tags = new Set<string>(override?.tags ?? []);

  if (word.length <= 2) {
    tags.add("short-fill");
  }

  return [...tags];
}

export const DICTIONARY: DictionaryEntry[] = RAW_DICTIONARY.map((entry) => {
  const override = DICTIONARY_OVERRIDES[entry.word];
  const clues = Array.from(
    new Set([...(override?.clues ?? []), entry.clue])
  );

  return {
    word: entry.word,
    clue: clues[0],
    clues,
    quality: override?.quality ?? inferQuality(entry.word),
    allowInDaily: override?.allowInDaily ?? true,
    tags: buildTags(entry.word, override),
  };
});

export function getEntryClue(entry: DictionaryEntry, seed: string) {
  const index = hashString(`${seed}:${entry.word}`) % entry.clues.length;
  return entry.clues[index] ?? entry.clue;
}

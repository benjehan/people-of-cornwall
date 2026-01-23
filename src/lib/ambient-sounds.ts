/**
 * Ambient Sounds for Stories
 * 
 * These sounds enhance the reading experience with atmospheric background audio.
 * 
 * SETUP REQUIRED:
 * 1. Create a bucket called "ambient-sounds" in Supabase Storage
 * 2. Make it PUBLIC
 * 3. Download royalty-free ambient sounds from:
 *    - https://freesound.org (free, attribution required)
 *    - https://pixabay.com/sound-effects/ (free, no attribution)
 *    - https://mixkit.co/free-sound-effects/ (free, no attribution)
 * 4. Upload MP3 files named: waves.mp3, rain.mp3, harbour.mp3, etc.
 * 5. Update SUPABASE_URL below with your project URL
 */

// UPDATE THIS with your Supabase project URL
const SUPABASE_URL = "https://qigfvouunlunkconlcqk.supabase.co";
const SOUNDS_BUCKET = "ambient-sounds";

// Helper to build Supabase Storage URL
const soundUrl = (filename: string) => 
  `${SUPABASE_URL}/storage/v1/object/public/${SOUNDS_BUCKET}/${filename}`;

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "coastal" | "weather" | "nature" | "indoor" | "village";
  url: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  // COASTAL
  {
    id: "waves",
    name: "Ocean Waves",
    description: "Gentle waves lapping on a Cornish shore",
    icon: "🌊",
    category: "coastal",
    url: soundUrl("waves.mp3"),
  },
  {
    id: "harbour",
    name: "Harbour",
    description: "Boats creaking, water lapping, distant seagulls",
    icon: "⚓",
    category: "coastal",
    url: soundUrl("harbour.mp3"),
  },
  {
    id: "seagulls",
    name: "Seagulls & Sea",
    description: "Coastal birds calling over the waves",
    icon: "🐦",
    category: "coastal",
    url: soundUrl("seagulls.mp3"),
  },
  {
    id: "beach",
    name: "Beach Ambience",
    description: "Sandy shore with gentle surf and breeze",
    icon: "🏖️",
    category: "coastal",
    url: soundUrl("beach.mp3"),
  },
  {
    id: "cliff",
    name: "Clifftop Wind",
    description: "Wind and waves from high above the sea",
    icon: "🪨",
    category: "coastal",
    url: soundUrl("cliff.mp3"),
  },
  
  // WEATHER
  {
    id: "rain",
    name: "Soft Rain",
    description: "Rain falling on a cottage roof",
    icon: "🌧️",
    category: "weather",
    url: soundUrl("rain.mp3"),
  },
  {
    id: "storm",
    name: "Distant Storm",
    description: "Thunder rolling over the Atlantic",
    icon: "⛈️",
    category: "weather",
    url: soundUrl("storm.mp3"),
  },
  {
    id: "wind",
    name: "Moorland Wind",
    description: "Wind sweeping across Bodmin Moor",
    icon: "💨",
    category: "weather",
    url: soundUrl("wind.mp3"),
  },
  {
    id: "heavyrain",
    name: "Heavy Rain",
    description: "A proper Cornish downpour",
    icon: "☔",
    category: "weather",
    url: soundUrl("heavyrain.mp3"),
  },
  
  // NATURE
  {
    id: "birds",
    name: "Countryside Birds",
    description: "Morning birdsong in the hedgerows",
    icon: "🐤",
    category: "nature",
    url: soundUrl("birds.mp3"),
  },
  {
    id: "stream",
    name: "Babbling Stream",
    description: "A Cornish brook flowing through woodland",
    icon: "💧",
    category: "nature",
    url: soundUrl("stream.mp3"),
  },
  {
    id: "forest",
    name: "Woodland",
    description: "Trees rustling, birds singing, peaceful forest",
    icon: "🌲",
    category: "nature",
    url: soundUrl("forest.mp3"),
  },
  {
    id: "night",
    name: "Night Sounds",
    description: "Owls, crickets, and nocturnal nature",
    icon: "🦉",
    category: "nature",
    url: soundUrl("night.mp3"),
  },
  
  // INDOOR
  {
    id: "fire",
    name: "Crackling Fire",
    description: "A warm hearth in an old cottage",
    icon: "🔥",
    category: "indoor",
    url: soundUrl("fire.mp3"),
  },
  {
    id: "pub",
    name: "Cosy Pub",
    description: "Gentle chatter, glasses clinking, warm atmosphere",
    icon: "🍺",
    category: "indoor",
    url: soundUrl("pub.mp3"),
  },
  {
    id: "kitchen",
    name: "Farmhouse Kitchen",
    description: "Kettle, clock ticking, homely sounds",
    icon: "🫖",
    category: "indoor",
    url: soundUrl("kitchen.mp3"),
  },
  
  // VILLAGE
  {
    id: "church",
    name: "Church Bells",
    description: "Bells echoing across the village",
    icon: "🔔",
    category: "village",
    url: soundUrl("church.mp3"),
  },
  {
    id: "market",
    name: "Market Day",
    description: "Busy village market with chatter and activity",
    icon: "🏪",
    category: "village",
    url: soundUrl("market.mp3"),
  },
  {
    id: "fishing",
    name: "Fishing Village",
    description: "Nets, boats, fishermen calling",
    icon: "🎣",
    category: "village",
    url: soundUrl("fishing.mp3"),
  },
  {
    id: "rugby",
    name: "Rugby Match",
    description: "Cheering crowds, whistles, the roar of the game",
    icon: "🏉",
    category: "village",
    url: soundUrl("rugby.mp3"),
  },
  {
    id: "drip",
    name: "Old House Dripping",
    description: "Water dripping in a damp old cottage",
    icon: "💧",
    category: "indoor",
    url: soundUrl("drip.mp3"),
  },
];

// Group sounds by category for the dropdown
export const SOUND_CATEGORIES = {
  coastal: { label: "🌊 Coastal", sounds: AMBIENT_SOUNDS.filter(s => s.category === "coastal") },
  weather: { label: "🌧️ Weather", sounds: AMBIENT_SOUNDS.filter(s => s.category === "weather") },
  nature: { label: "🌲 Nature", sounds: AMBIENT_SOUNDS.filter(s => s.category === "nature") },
  indoor: { label: "🏠 Indoor", sounds: AMBIENT_SOUNDS.filter(s => s.category === "indoor") },
  village: { label: "🏘️ Village", sounds: AMBIENT_SOUNDS.filter(s => s.category === "village") },
};

export function getAmbientSound(id: string | null): AmbientSound | null {
  if (!id) return null;
  return AMBIENT_SOUNDS.find(sound => sound.id === id) || null;
}

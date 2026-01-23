/**
 * Ambient Sounds for Stories
 * 
 * These royalty-free ambient sounds can be used to enhance the reading experience.
 * All sounds should be loopable, calming, and appropriate for the Cornish heritage theme.
 */

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  icon: string;
  // Using royalty-free ambient sounds from Pixabay (free for commercial use)
  // Replace these URLs with your own hosted files for production reliability
  url: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "waves",
    name: "Ocean Waves",
    description: "Gentle waves lapping on a Cornish shore",
    icon: "🌊",
    url: "https://cdn.pixabay.com/audio/2022/05/16/audio_946dd954d1.mp3", // Calm ocean waves
  },
  {
    id: "rain",
    name: "Soft Rain",
    description: "Rain falling on a cottage roof",
    icon: "🌧️",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_a580f95a60.mp3", // Gentle rain
  },
  {
    id: "harbour",
    name: "Harbour",
    description: "Boats, seagulls, and gentle water",
    icon: "⚓",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_ccc2ef6d99.mp3", // Harbour ambiance
  },
  {
    id: "seagulls",
    name: "Seagulls",
    description: "Coastal birds and sea breeze",
    icon: "🐦",
    url: "https://cdn.pixabay.com/audio/2021/09/06/audio_0a243dd3d2.mp3", // Seagulls
  },
  {
    id: "wind",
    name: "Moorland Wind",
    description: "Wind sweeping across Bodmin Moor",
    icon: "💨",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_3e1d815df7.mp3", // Wind
  },
  {
    id: "fire",
    name: "Crackling Fire",
    description: "A warm hearth in an old cottage",
    icon: "🔥",
    url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3", // Fireplace
  },
  {
    id: "storm",
    name: "Distant Storm",
    description: "Thunder rolling over the Atlantic",
    icon: "⛈️",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_9e1e6c89fe.mp3", // Thunder
  },
  {
    id: "birds",
    name: "Countryside Birds",
    description: "Morning birdsong in the hedgerows",
    icon: "🐤",
    url: "https://cdn.pixabay.com/audio/2022/03/09/audio_79be0ec7ee.mp3", // Birds
  },
  {
    id: "church",
    name: "Church Bells",
    description: "Bells echoing across the village",
    icon: "🔔",
    url: "https://cdn.pixabay.com/audio/2022/11/17/audio_8a43a26c99.mp3", // Church bells
  },
  {
    id: "stream",
    name: "Babbling Stream",
    description: "A Cornish brook flowing through woodland",
    icon: "💧",
    url: "https://cdn.pixabay.com/audio/2022/02/22/audio_a1bd436d72.mp3", // Stream
  },
];

export function getAmbientSound(id: string | null): AmbientSound | null {
  if (!id) return null;
  return AMBIENT_SOUNDS.find(sound => sound.id === id) || null;
}

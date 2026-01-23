"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { getAmbientSound } from "@/lib/ambient-sounds";

interface AmbientPlayerProps {
  soundId: string | null;
}

export function AmbientPlayer({ soundId }: AmbientPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Start at 30% volume
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const sound = getAmbientSound(soundId);
  
  useEffect(() => {
    // Create audio element
    if (sound && !audioRef.current) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = volume;
      audio.preload = "metadata";
      
      audio.addEventListener("canplaythrough", () => {
        setIsLoaded(true);
      });
      
      audioRef.current = audio;
    }
    
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound, volume]);
  
  useEffect(() => {
    // Update volume when slider changes
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (volume > 0) {
      setVolume(0);
      audioRef.current.volume = 0;
    } else {
      setVolume(0.3);
      audioRef.current.volume = 0.3;
    }
  };
  
  if (!sound) return null;
  
  return (
    <div className="mb-8 rounded-xl bg-gradient-to-r from-slate/10 to-granite/10 border border-bone p-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={togglePlayback}
          disabled={!isLoaded}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-granite text-parchment hover:bg-slate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isPlaying ? "Pause ambience" : "Play ambience"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
        
        {/* Sound info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sound.icon}</span>
            <span className="font-medium text-granite">{sound.name}</span>
          </div>
          <p className="text-sm text-stone">
            {isPlaying ? "Playing..." : "Enhance your reading with ambient sound"}
          </p>
        </div>
        
        {/* Volume control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-stone hover:text-granite transition-colors"
            title={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-2 bg-bone rounded-lg appearance-none cursor-pointer accent-granite"
            title="Volume"
          />
        </div>
      </div>
      
      {!isLoaded && (
        <p className="mt-2 text-xs text-silver">Loading audio...</p>
      )}
    </div>
  );
}

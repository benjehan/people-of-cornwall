"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, X, ChevronDown, Music } from "lucide-react";
import { AMBIENT_SOUNDS, SOUND_CATEGORIES, getAmbientSound } from "@/lib/ambient-sounds";

interface AmbientSoundSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function AmbientSoundSelector({ value, onChange }: AmbientSoundSelectorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedSound = getAmbientSound(value);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const playPreview = (soundId: string) => {
    const sound = getAmbientSound(soundId);
    if (!sound) return;
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (value === soundId && isPlaying) {
      setIsPlaying(false);
      return;
    }
    
    setLoadError(null);
    
    // Play new sound
    const audio = new Audio(sound.url);
    audio.volume = 0.3;
    
    audio.onerror = () => {
      setLoadError("Sound not uploaded yet. See setup instructions.");
      setIsPlaying(false);
    };
    
    audio.play().then(() => {
      setIsPlaying(true);
      // Stop after 8 seconds (preview)
      setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
      }, 8000);
    }).catch(() => {
      setLoadError("Could not play sound. Check if file exists.");
      setIsPlaying(false);
    });
    
    audioRef.current = audio;
  };
  
  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };
  
  const handleSelect = (soundId: string) => {
    onChange(soundId);
    setIsOpen(false);
    playPreview(soundId);
  };
  
  const handleRemove = () => {
    stopPreview();
    onChange(null);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-granite font-medium flex items-center gap-2">
          <Music className="h-4 w-4" />
          Ambient Sound
          <span className="font-normal text-stone text-sm">(optional)</span>
        </Label>
      </div>
      
      <p className="text-sm text-stone">
        Add atmospheric background sound for readers to enjoy while reading your story.
      </p>
      
      {/* Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-bone bg-parchment px-4 py-3 text-left transition-colors hover:border-granite focus:outline-none focus:ring-2 focus:ring-granite focus:ring-offset-2"
        >
          {selectedSound ? (
            <span className="flex items-center gap-3">
              <span className="text-xl">{selectedSound.icon}</span>
              <span>
                <span className="font-medium text-granite">{selectedSound.name}</span>
                <span className="text-sm text-stone ml-2">— {selectedSound.description}</span>
              </span>
            </span>
          ) : (
            <span className="text-stone">Choose an ambient sound...</span>
          )}
          <ChevronDown className={`h-5 w-5 text-stone transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-bone bg-parchment shadow-lg max-h-80 overflow-y-auto">
            {Object.entries(SOUND_CATEGORIES).map(([key, category]) => (
              <div key={key}>
                {/* Category Header */}
                <div className="sticky top-0 bg-cream px-4 py-2 text-sm font-medium text-granite border-b border-bone">
                  {category.label}
                </div>
                
                {/* Sound Options */}
                {category.sounds.map((sound) => (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleSelect(sound.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream ${
                      value === sound.id ? "bg-granite/5" : ""
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{sound.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-granite">{sound.name}</span>
                      <span className="block text-sm text-stone truncate">{sound.description}</span>
                    </span>
                    {value === sound.id && (
                      <span className="text-xs bg-granite text-parchment px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Sound Preview */}
      {selectedSound && (
        <div className="rounded-lg bg-gradient-to-r from-granite/10 to-slate/10 border border-bone p-4">
          <div className="flex items-center gap-4">
            {/* Play/Preview button */}
            <button
              type="button"
              onClick={() => playPreview(selectedSound.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-granite text-parchment hover:bg-slate transition-colors flex-shrink-0"
              title={isPlaying ? "Stop preview" : "Preview sound"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            
            {/* Sound info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedSound.icon}</span>
                <span className="font-medium text-granite">{selectedSound.name}</span>
              </div>
              <p className="text-xs text-stone truncate">{selectedSound.description}</p>
            </div>
            
            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 text-stone hover:text-red-600 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Playing indicator */}
          {isPlaying && (
            <div className="mt-3 flex items-center gap-2 text-xs text-granite">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-granite rounded-full animate-pulse" />
                <div className="w-1 h-3 bg-granite rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
                <div className="w-1 h-3 bg-granite rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              </div>
              <span>Playing preview (8 seconds)...</span>
            </div>
          )}
          
          {/* Error message */}
          {loadError && (
            <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              ⚠️ {loadError}
            </p>
          )}
        </div>
      )}
      
      {/* Setup notice */}
      <p className="text-xs text-silver">
        💡 Sounds need to be uploaded to your Supabase Storage "ambient-sounds" bucket.
      </p>
    </div>
  );
}

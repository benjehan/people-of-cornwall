"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, X } from "lucide-react";
import { AMBIENT_SOUNDS, type AmbientSound } from "@/lib/ambient-sounds";

interface AmbientSoundSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function AmbientSoundSelector({ value, onChange }: AmbientSoundSelectorProps) {
  const [previewSound, setPreviewSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const selectedSound = AMBIENT_SOUNDS.find(s => s.id === value);
  
  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const playPreview = (sound: AmbientSound) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (previewSound === sound.id && isPlaying) {
      // Stop if clicking same sound
      setIsPlaying(false);
      setPreviewSound(null);
      return;
    }
    
    // Play new sound
    const audio = new Audio(sound.url);
    audio.volume = 0.3;
    audio.play().catch(console.error);
    
    // Stop after 5 seconds (preview)
    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
      setPreviewSound(null);
    }, 5000);
    
    audioRef.current = audio;
    setPreviewSound(sound.id);
    setIsPlaying(true);
  };
  
  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPreviewSound(null);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-granite font-medium">
          🎧 Ambient Sound <span className="font-normal text-stone">(optional)</span>
        </Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopPreview();
              onChange(null);
            }}
            className="h-7 text-xs text-stone hover:text-granite gap-1"
          >
            <X className="h-3 w-3" />
            Remove
          </Button>
        )}
      </div>
      
      <p className="text-sm text-stone">
        Add atmospheric background sound for readers to enjoy while reading your story.
      </p>
      
      {/* Selected sound display */}
      {selectedSound && (
        <div className="rounded-lg bg-gradient-to-r from-granite/10 to-slate/10 border border-bone p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedSound.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-granite">{selectedSound.name}</p>
              <p className="text-xs text-stone">{selectedSound.description}</p>
            </div>
            <button
              type="button"
              onClick={() => playPreview(selectedSound)}
              className="p-2 rounded-full hover:bg-bone transition-colors"
              title="Preview"
            >
              {previewSound === selectedSound.id && isPlaying ? (
                <Pause className="h-4 w-4 text-granite" />
              ) : (
                <Volume2 className="h-4 w-4 text-stone" />
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Sound grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {AMBIENT_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            type="button"
            onClick={() => {
              onChange(sound.id);
              playPreview(sound);
            }}
            className={`
              relative flex flex-col items-center gap-1 rounded-lg border p-3 transition-all
              ${value === sound.id 
                ? "border-granite bg-granite/5" 
                : "border-bone bg-parchment hover:border-slate hover:bg-cream"
              }
            `}
          >
            <span className="text-xl">{sound.icon}</span>
            <span className="text-xs font-medium text-granite text-center leading-tight">
              {sound.name}
            </span>
            
            {/* Playing indicator */}
            {previewSound === sound.id && isPlaying && (
              <div className="absolute top-1 right-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-granite rounded-full animate-pulse" />
                  <div className="w-1 h-3 bg-granite rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-granite rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

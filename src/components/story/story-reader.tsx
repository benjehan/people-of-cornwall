"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Headphones,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmbientSound } from "@/lib/ambient-sounds";

interface StoryReaderProps {
  storyBody: string;
  storyTitle: string;
  voicePreference: "male" | "female";
  ambientSoundId?: string | null;
  className?: string;
}

export function StoryReader({ 
  storyBody, 
  storyTitle,
  voicePreference = "male",
  ambientSoundId,
  className,
}: StoryReaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const textChunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined" && !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      setError("Text-to-speech is not supported in your browser");
    }
  }, []);

  // Clean text from HTML and prepare for reading
  const prepareText = useCallback((html: string): string[] => {
    // Create a temporary div to parse HTML
    const div = document.createElement("div");
    div.innerHTML = html;
    
    // Get text content, preserving paragraph breaks
    const text = div.innerText || div.textContent || "";
    
    // Split into sentences/chunks for better progress tracking
    const chunks = text.split(/(?<=[.!?])\s+/).filter(chunk => chunk.trim().length > 0);
    return chunks;
  }, []);

  // Initialize text chunks
  useEffect(() => {
    textChunksRef.current = prepareText(storyBody);
  }, [storyBody, prepareText]);

  // Get preferred voice
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    // Prioritize UK English voices for Cornish stories
    const preferredVoices = voicePreference === "female" 
      ? ["Google UK English Female", "Microsoft Hazel Desktop", "Karen", "Samantha", "Fiona"]
      : ["Google UK English Male", "Microsoft George Desktop", "Daniel", "Oliver", "Alex"];
    
    // Try to find a preferred voice
    for (const name of preferredVoices) {
      const voice = voices.find(v => v.name.includes(name));
      if (voice) return voice;
    }
    
    // Fallback to any English voice of the right gender
    const genderFilter = voicePreference === "female" 
      ? (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Fiona"))
      : (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("female");
    
    const filteredVoice = voices.find(genderFilter);
    if (filteredVoice) return filteredVoice;
    
    // Fallback to first English voice
    return voices.find(v => v.lang.startsWith("en")) || voices[0] || null;
  }, [voicePreference]);

  // Start playing
  const handlePlay = useCallback(async () => {
    if (!speechSupported) return;
    
    setError(null);
    setIsLoading(true);

    // Wait for voices to load
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise(resolve => {
        window.speechSynthesis.onvoiceschanged = resolve;
        setTimeout(resolve, 1000); // Fallback timeout
      });
    }

    const voice = getVoice();
    if (!voice) {
      setError("No voice available for reading");
      setIsLoading(false);
      return;
    }

    // Create full text
    const fullText = `${storyTitle}. ${textChunksRef.current.join(" ")}`;
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.voice = voice;
    utterance.rate = 0.9; // Slightly slower for storytelling
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : volume;
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoading(false);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      
      // Stop ambient sound when speech ends
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
    };
    
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setError("Failed to read story. Please try again.");
      setIsPlaying(false);
      setIsLoading(false);
    };

    // Track progress
    utterance.onboundary = (event) => {
      if (event.charIndex) {
        const progressPercent = (event.charIndex / fullText.length) * 100;
        setProgress(progressPercent);
      }
    };

    utteranceRef.current = utterance;
    
    // Start speech
    window.speechSynthesis.speak(utterance);
    
    // Start ambient sound if available
    if (ambientSoundId && ambientAudioRef.current) {
      console.log("[StoryReader] Starting ambient sound...");
      ambientAudioRef.current.volume = (isMuted ? 0 : volume) * 0.3; // Lower volume for ambient
      ambientAudioRef.current.play()
        .then(() => console.log("[StoryReader] Ambient sound playing"))
        .catch((err) => console.error("[StoryReader] Ambient sound failed:", err));
    }
  }, [speechSupported, getVoice, storyTitle, isMuted, volume, ambientSoundId]);

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (!isPlaying) return;
    
    if (isPaused) {
      window.speechSynthesis.resume();
      if (ambientAudioRef.current) {
        ambientAudioRef.current.play().catch(console.error);
      }
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  // Stop
  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  // Update volume
  useEffect(() => {
    if (utteranceRef.current) {
      // Note: Can't change volume mid-speech, this is for next utterance
    }
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = isMuted ? 0 : volume * 0.3;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
    };
  }, []);

  // Load ambient audio
  useEffect(() => {
    if (ambientSoundId) {
      const sound = getAmbientSound(ambientSoundId);
      if (sound) {
        console.log("[StoryReader] Loading ambient sound:", sound.name, sound.url);
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.preload = "auto";
        
        audio.oncanplaythrough = () => {
          console.log("[StoryReader] Ambient sound ready to play");
        };
        
        audio.onerror = (e) => {
          console.error("[StoryReader] Ambient sound failed to load:", e);
        };
        
        ambientAudioRef.current = audio;
      }
    }
    
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, [ambientSoundId]);

  if (!speechSupported) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={cn(
          "gap-2 border-granite text-granite hover:bg-granite hover:text-parchment",
          className
        )}
      >
        <Headphones className="h-4 w-4" />
        Listen to this story
      </Button>
    );
  }

  return (
    <div className={cn(
      "rounded-lg bg-gradient-to-r from-granite to-slate p-4 text-parchment shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          <span className="font-medium">Story Reader</span>
          {voicePreference === "female" && (
            <span className="text-xs bg-parchment/20 px-2 py-0.5 rounded-full">Female Voice</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            handleStop();
            setIsOpen(false);
          }}
          className="h-8 w-8 text-parchment hover:bg-parchment/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded bg-red-500/20 p-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 w-full rounded-full bg-parchment/20 overflow-hidden">
          <div 
            className="h-full bg-parchment transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          {!isPlaying ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlay}
              disabled={isLoading}
              className="h-10 w-10 rounded-full bg-parchment text-granite hover:bg-parchment/90"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePauseResume}
              className="h-10 w-10 rounded-full bg-parchment text-granite hover:bg-parchment/90"
            >
              {isPaused ? (
                <Play className="h-5 w-5 ml-0.5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Stop */}
          {isPlaying && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStop}
              className="h-8 w-8 text-parchment hover:bg-parchment/20"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 text-parchment hover:bg-parchment/20"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[isMuted ? 0 : volume]}
            onValueChange={(val) => setVolume(val[0])}
            className="w-20"
          />
        </div>
      </div>

      {/* Ambient sound indicator */}
      {ambientSoundId && (
        <div className="mt-3 pt-3 border-t border-parchment/20 text-xs text-parchment/70">
          🎧 Playing with ambient background sound
        </div>
      )}
    </div>
  );
}

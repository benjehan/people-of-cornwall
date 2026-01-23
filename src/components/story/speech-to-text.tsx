"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertCircle, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onAudioRecorded?: (url: string, duration: number) => void;
  storyId?: string;
  className?: string;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function SpeechToText({ 
  onTranscript, 
  onInterimTranscript, 
  onAudioRecorded,
  storyId,
  className 
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [savedClips, setSavedClips] = useState<{url: string, duration: number}[]>([]);
  
  const MAX_RECORDING_SECONDS = 600; // 10 minutes
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setHasRecording(audioChunksRef.current.length > 0);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      // Track duration with auto-stop at limit
      recordingStartRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        setRecordingDuration(elapsed);
        
        // Auto-stop at 10 minutes
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopListening();
          setError(`Recording limit reached (${MAX_RECORDING_SECONDS / 60} minutes). Save your clip and record another if needed.`);
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error starting audio recording:", err);
      // Continue with speech recognition even if recording fails
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB"; // British English for Cornwall!

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Update interim display
      setInterimText(interimTranscript);
      if (onInterimTranscript) {
        onInterimTranscript(interimTranscript);
      }

      // Send final transcript
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "network") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onTranscript, onInterimTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    // Stop duration tracking
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setIsListening(false);
    setInterimText("");
  }, []);

  // Upload the recorded audio
  const uploadRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || !storyId) {
      setError("No recording to save or story not saved yet");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Create blob from chunks
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const extension = mimeType === "audio/webm" ? "webm" : "mp4";
      
      // Generate filename
      const filename = `voice-recordings/${storyId}/${Date.now()}.${extension}`;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(filename, audioBlob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("story-media")
        .getPublicUrl(filename);

      // Add to saved clips list
      setSavedClips(prev => [...prev, { url: publicUrl, duration: recordingDuration }]);

      // Notify parent component
      if (onAudioRecorded) {
        onAudioRecorded(publicUrl, recordingDuration);
      }

      // Clear the recording for next one
      audioChunksRef.current = [];
      setHasRecording(false);
      setRecordingDuration(0);
      setError(null);

    } catch (err) {
      console.error("Error uploading recording:", err);
      setError("Failed to save recording. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [storyId, recordingDuration, onAudioRecorded]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-silver", className)}>
        <AlertCircle className="h-3 w-3" />
        <span>Voice input not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={toggleListening}
          className={cn(
            "gap-2 transition-all",
            isListening && "animate-pulse bg-red-600 hover:bg-red-700"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Narrate Your Story
            </>
          )}
        </Button>

        {isListening && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            <span className="text-sm text-stone">
              {formatDuration(recordingDuration)} / {formatDuration(MAX_RECORDING_SECONDS)}
            </span>
            {recordingDuration > MAX_RECORDING_SECONDS - 60 && (
              <span className="text-xs text-amber-600">⚠️ Approaching limit</span>
            )}
          </div>
        )}

        {/* Save recording button */}
        {hasRecording && !isListening && storyId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={uploadRecording}
            disabled={isUploading}
            className="gap-2 border-copper text-copper hover:bg-copper hover:text-parchment"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Voice...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Original Voice ({formatDuration(recordingDuration)})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Interim transcript preview */}
      {interimText && (
        <div className="rounded-md bg-cream border border-bone p-3 text-sm text-stone italic">
          <span className="text-silver">Hearing: </span>
          {interimText}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Usage hint */}
      {!isListening && !error && !hasRecording && (
        <p className="text-xs text-silver">
          💡 Tip: Click to start speaking. Your words will appear in the editor as you talk.
          {storyId && " Your voice is also recorded — save it so readers can hear your actual voice!"}
        </p>
      )}

      {/* Recording saved hint */}
      {hasRecording && !isListening && !storyId && (
        <p className="text-xs text-amber-600">
          ⚠️ Save your story draft first to keep your voice recording.
        </p>
      )}

      {/* Saved clips list */}
      {savedClips.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-granite">
            🎙️ Saved Voice Clips ({savedClips.length})
          </p>
          {savedClips.map((clip, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-2 rounded-md bg-cream border border-bone"
            >
              <span className="text-xs text-stone">Clip {index + 1}</span>
              <audio 
                controls 
                src={clip.url} 
                className="h-8 flex-1"
                preload="metadata"
              />
              <span className="text-xs text-silver">{formatDuration(clip.duration)}</span>
            </div>
          ))}
          <p className="text-xs text-stone">
            ✨ These clips are saved. Record more if needed (max 10 min each).
          </p>
        </div>
      )}
    </div>
  );
}

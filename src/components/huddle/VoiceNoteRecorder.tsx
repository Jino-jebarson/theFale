import { useState, useRef, useEffect, useCallback } from "react";
import {
  HiOutlineMicrophone,
  HiOutlineStop,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiPlay,
  HiPause,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceNoteRecorderProps {
  onRecorded: (audioData: { audioUrl: string; duration: number }) => void;
  onDiscard: () => void;
  existingAudio?: { audioUrl: string; duration: number } | null;
  autoStart?: boolean;
}

export function VoiceNoteRecorder({
  onRecorded,
  onDiscard,
  existingAudio,
  autoStart = false,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(
    existingAudio?.audioUrl || null
  );
  const [recordedDuration, setRecordedDuration] = useState<number>(
    existingAudio?.duration || 0
  );

  // Preview playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);

  const MAX_SECONDS = 60; // 1-Minute Hard Limit

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    stopTracks();
  }, [stopTracks]);

  // 1-minute auto stop
  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) {
      toast.info("1-minute voice note limit reached.", {
        description: "Voice note automatically saved at 60 seconds.",
      });
      stopRecording();
    }
  }, [seconds, isRecording, stopRecording]);

  const startRecording = async () => {
    if (isStartingRef.current || isRecording) return;
    isStartingRef.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
        onDiscard();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Detect supported mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        const elapsedSecs = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        const duration = Math.min(Math.max(elapsedSecs, 1), MAX_SECONDS);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioUrl(base64Audio);
          setRecordedDuration(duration);
          onRecorded({ audioUrl: base64Audio, duration });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(250); // Emit chunk every 250ms
      setIsRecording(true);
      setRecordedAudioUrl(null);

      // Real wall-clock timestamp based timer (immune to render loops / double intervals)
      startTimeRef.current = Date.now();
      setSeconds(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 250);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast.error("Microphone permission denied", {
        description:
          "Please allow microphone access in your browser settings to record voice notes.",
      });
      onDiscard();
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    if (autoStart && !isRecording && !recordedAudioUrl) {
      startRecording();
    }
  }, [autoStart]);

  const handleDiscard = () => {
    if (isRecording) {
      stopRecording();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    setRecordedAudioUrl(null);
    setRecordedDuration(0);
    setSeconds(0);
    onDiscard();
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => setIsPlayingPreview(false));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, [stopTracks]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // State 1: Active recording UI (Project Primary Orange theme, balanced alignment)
  if (isRecording) {
    const remaining = MAX_SECONDS - seconds;
    return (
      <div className="rounded-2xl border border-primary/25 bg-primary-soft/30 p-3 sm:p-3.5 my-2 animate-in fade-in duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Style tag for dynamic beat waves */}
        <style>{`
          @keyframes recorderBeatWave {
            0% { transform: scaleY(0.25); }
            50% { transform: scaleY(1.2); }
            100% { transform: scaleY(0.35); }
          }
        `}</style>

        {/* Left: Recording Indicator & Sound Waves */}
        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <span className="text-xs font-bold text-foreground truncate">
              Recording Clinical Voice Note...
            </span>
          </div>

          {/* Dynamic dancing beat waves animation */}
          <div className="flex items-center gap-1 h-5 shrink-0 px-1">
            {[45, 85, 55, 100, 65, 90, 75, 40, 80, 60].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary origin-bottom"
                style={{
                  height: `${h}%`,
                  animation: `recorderBeatWave ${0.45 + (i % 3) * 0.12}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 75}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Timer & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t border-primary/15 sm:border-0">
          <span className="font-mono text-xs font-black text-primary bg-background/90 px-2.5 py-1 rounded-xl border border-primary/20 shadow-2xs shrink-0">
            {formatTimer(seconds)} / 01:00
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
            >
              <HiOutlineTrash className="h-4 w-4 mr-1 text-muted-foreground" /> Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={stopRecording}
              className="h-8 px-3.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer gap-1.5 transition-all"
            >
              <HiOutlineStop className="h-4 w-4" /> Stop ({remaining}s left)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Recorded audio preview UI
  if (recordedAudioUrl) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-primary/25 bg-primary-soft/20 my-2 animate-in fade-in duration-200">
        <audio
          ref={previewAudioRef}
          src={recordedAudioUrl}
          onEnded={() => setIsPlayingPreview(false)}
        />
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={togglePreviewPlay}
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-2xs hover:bg-primary-hover transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            {isPlayingPreview ? (
              <HiPause className="h-4 w-4 fill-current" />
            ) : (
              <HiPlay className="h-4 w-4 fill-current translate-x-0.5" />
            )}
          </button>
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Voice Note Recorded</span>
              <span className="font-mono text-[11px] text-primary font-black bg-primary-soft border border-primary/20 px-2 py-0.5 rounded-md">
                {formatTimer(recordedDuration)}
              </span>
            </p>
            {isPlayingPreview ? (
              <div className="flex items-center gap-2 text-[11px] text-primary font-bold mt-1">
                <div className="flex items-center gap-0.5 h-3.5">
                  {[40, 90, 60, 100, 75, 45, 80, 50].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-primary origin-bottom"
                      style={{
                        height: `${h}%`,
                        animation: `recorderBeatWave 0.5s ease-in-out infinite alternate`,
                        animationDelay: `${i * 70}ms`,
                      }}
                    />
                  ))}
                </div>
                <span>Playing voice note preview...</span>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ready to attach to your Huddle discussion
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={startRecording}
            className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1 cursor-pointer border-border/80 hover:bg-muted"
          >
            <HiOutlineArrowPath className="h-3.5 w-3.5" /> Re-record
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDiscard}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // State 3: Normal trigger button (shown next to Photo)
  return (
    <button
      type="button"
      onClick={startRecording}
      className="h-9 cursor-pointer px-3 rounded-xl text-xs font-semibold border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
      title="Record up to 1-minute audio pearl"
    >
      <HiOutlineMicrophone className="h-4 w-4 text-primary shrink-0" />
      <span>Voice Note (1m)</span>
    </button>
  );
}


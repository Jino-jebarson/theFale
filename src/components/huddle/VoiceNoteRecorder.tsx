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
}

export function VoiceNoteRecorder({
  onRecorded,
  onDiscard,
  existingAudio,
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
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
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
        const duration = Math.min(seconds || 1, MAX_SECONDS);

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
      setSeconds(0);
      setRecordedAudioUrl(null);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast.error("Microphone permission denied", {
        description:
          "Please allow microphone access in your browser settings to record voice notes.",
      });
    }
  };

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

  // State 1: Active recording UI
  if (isRecording) {
    const remaining = MAX_SECONDS - seconds;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 my-2 animate-in fade-in duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
          </span>
          <span className="text-xs font-bold text-foreground">
            Recording Clinical Voice Note...
          </span>
          <span className="font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-background/80 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/60 shadow-2xs">
            {formatTimer(seconds)} / 01:00
          </span>
        </div>

        {/* Dynamic sound bars animation */}
        <div className="flex items-center gap-1 h-4">
          {[60, 100, 40, 80, 50, 90, 70, 30].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-rose-500/70 animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 120}ms`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDiscard}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-600 cursor-pointer"
          >
            <HiOutlineTrash className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={stopRecording}
            className="h-8 px-3.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer gap-1.5"
          >
            <HiOutlineStop className="h-4 w-4" /> Stop ({remaining}s left)
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Recorded audio preview UI
  if (recordedAudioUrl) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-primary/25 bg-primary/5 my-2 animate-in fade-in duration-200">
        <audio
          ref={previewAudioRef}
          src={recordedAudioUrl}
          onEnded={() => setIsPlayingPreview(false)}
        />
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={togglePreviewPlay}
            className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white shadow-2xs hover:bg-primary-hover transition-transform active:scale-95 cursor-pointer shrink-0"
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
              <span className="font-mono text-[11px] text-primary font-extrabold bg-primary/10 px-1.5 py-0.2 rounded-md">
                {formatTimer(recordedDuration)}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isPlayingPreview ? "Playing back preview..." : "Ready to attach to your Huddle discussion"}
            </p>
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
            className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
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


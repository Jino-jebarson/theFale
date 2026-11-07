import { useState, useRef, useEffect } from "react";
import { HiPlay, HiPause, HiOutlineSpeakerWave } from "react-icons/hi2";
import { cn } from "@/lib/utils";

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  authorRole?: string;
  className?: string;
}

export function VoiceNotePlayer({
  audioUrl,
  duration = 0,
  authorRole = "Clinician",
  className,
}: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [actualDuration, setActualDuration] = useState<number>(duration);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setActualDuration(Math.round(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalDuration = actualDuration > 0 ? actualDuration : (duration || 60);
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 p-3 sm:p-3.5 my-2.5 shadow-2xs transition-all",
        className
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
            <HiOutlineSpeakerWave className="h-3 w-3" />
          </span>
          <span className="text-[11px] font-bold text-foreground truncate">
            Clinical Voice Note
          </span>
          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
            • {authorRole}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleSpeed}
          className="rounded-lg bg-background/80 hover:bg-background border border-border/60 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
          title="Playback Speed"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Main player controls + waveform scrubber */}
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          {isPlaying ? (
            <HiPause className="h-5 w-5 fill-current" />
          ) : (
            <HiPlay className="h-5 w-5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Waveform / Scrubber & Time */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Animated sound wave bars or scrubber */}
          <div className="relative flex items-center h-5">
            {/* Visual audio bars */}
            <div className="absolute inset-0 flex items-center justify-between gap-0.5 px-0.5 pointer-events-none opacity-40">
              {[40, 75, 55, 90, 60, 30, 85, 100, 70, 45, 95, 60, 40, 80, 50, 70, 90, 65, 45, 85, 60, 35, 75, 95, 50].map(
                (h, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "w-1 rounded-full transition-all duration-300",
                      (idx / 25) * 100 <= progressPercent
                        ? "bg-primary"
                        : "bg-muted-foreground/30",
                      isPlaying && "animate-pulse"
                    )}
                    style={{
                      height: `${isPlaying ? Math.max(20, (h * (idx % 2 === 0 ? 1 : 0.8))) : h * 0.7}%`,
                    }}
                  />
                )
              )}
            </div>

            {/* Range input for seeking */}
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Time indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


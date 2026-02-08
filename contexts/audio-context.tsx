import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import React, { useCallback, createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AudioPlayer } from 'expo-audio';

type AudioContextValue = {
  currentUri: string | null;
  currentTrackTitle: string | null;
  setTrack: (uri: string | null) => void;
  setTrackAndPlay: (uri: string, options?: { title?: string; postId?: number }) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  seekBack: () => void;
  seekForward: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  progress: number;
  player: AudioPlayer | null;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SEEK_STEP = 10;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(null);
  const player = useAudioPlayer(currentUri ? { uri: currentUri } : null, {
    updateInterval: 250,
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUri && player) {
      player.replace({ uri: currentUri });
    }
  }, [currentUri, player]);

  const isPlaying = status.playing;
  const isLoading = !status.isLoaded || status.isBuffering;
  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const setTrack = useCallback((uri: string | null) => {
    setCurrentUri(uri);
    if (!uri) setCurrentTrackTitle(null);
  }, []);

  const pendingPlayRef = React.useRef(false);
  const setTrackAndPlay = useCallback((uri: string, options?: { title?: string; postId?: number }) => {
    // Cache-bust by post id so we always load this post's audio (avoids playing wrong/cached track)
    const separator = uri.includes('?') ? '&' : '?';
    const resolvedUri = options?.postId != null ? `${uri}${separator}post=${options.postId}` : uri;
    setCurrentUri(resolvedUri);
    setCurrentTrackTitle(options?.title ?? null);
    pendingPlayRef.current = true;
  }, []);

  useEffect(() => {
    if (currentUri && player) {
      player.replace({ uri: currentUri });
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        player.play();
      }
    }
  }, [currentUri, player]);

  const play = useCallback(() => player.play(), [player]);
  const pause = useCallback(() => player.pause(), [player]);
  const toggle = useCallback(() => {
    if (isLoading) return;
    if (isPlaying) player.pause();
    else player.play();
  }, [isLoading, isPlaying, player]);
  const seekTo = useCallback((seconds: number) => player.seekTo(seconds), [player]);
  const seekBack = useCallback(
    () => player.seekTo(Math.max(0, currentTime - SEEK_STEP)),
    [currentTime, player]
  );
  const seekForward = useCallback(
    () => player.seekTo(Math.min(duration, currentTime + SEEK_STEP)),
    [currentTime, duration, player]
  );

  const value: AudioContextValue = {
    currentUri,
    currentTrackTitle,
    setTrack,
    setTrackAndPlay,
    play,
    pause,
    toggle,
    seekTo,
    seekBack,
    seekForward,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    player: currentUri ? player : null,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export { formatTime, SEEK_STEP };

"use client";

import { useCallback, useRef, useState } from "react";

export type RecordingStatus = "idle" | "requesting" | "recording" | "interrupted" | "denied";

// Upload in bounded chunks instead of one blob at submit time — a single multi-minute
// recording can exceed serverless request-body limits (e.g. Vercel's ~4.5MB) and fail
// silently since fetch() doesn't throw on 4xx/5xx. Capping bitrate + chunk length keeps
// each upload well under that ceiling and means earlier segments survive even if a later
// chunk fails.
const CHUNK_MS = 20_000;
const VIDEO_BITS_PER_SECOND = 1_000_000;

/**
 * Manages one screen-recording "segment" at a time via getDisplayMedia + MediaRecorder.
 * If the candidate revokes screen-share mid-session (browser's native "Stop sharing"),
 * the in-flight segment is uploaded immediately and status flips to "interrupted" so the
 * caller can re-prompt via start() again — producing a second row in `recordings` for the
 * same session, matching the multi-segment behavior described in the spec.
 */
export function useScreenRecorder(uploadFn: (blob: Blob, durationSeconds: number) => Promise<void>) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkStartRef = useRef(0);
  const stopDeferredRef = useRef<(() => void) | null>(null);
  const pendingUploadsRef = useRef<Promise<void>[]>([]);

  const start = useCallback(async () => {
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
        (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      });

      chunkStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size === 0) return;
        const durationSeconds = (Date.now() - chunkStartRef.current) / 1000;
        chunkStartRef.current = Date.now();
        const upload = uploadFn(e.data, durationSeconds).catch((err) => {
          console.error("Failed to upload recording segment:", err);
        });
        pendingUploadsRef.current.push(upload);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await Promise.all(pendingUploadsRef.current);
        pendingUploadsRef.current = [];

        stopDeferredRef.current?.();
        stopDeferredRef.current = null;
      };

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
        setStatus("interrupted");
      });

      recorderRef.current = recorder;
      recorder.start(CHUNK_MS);
      setStatus("recording");
    } catch {
      setStatus("denied");
    }
  }, [uploadFn]);

  const stopAndUpload = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve();
        return;
      }
      stopDeferredRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { status, start, stopAndUpload };
}

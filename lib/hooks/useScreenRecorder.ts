"use client";

import { useCallback, useRef, useState } from "react";

export type RecordingStatus = "idle" | "requesting" | "recording" | "interrupted" | "denied";

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
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const stopDeferredRef = useRef<(() => void) | null>(null);

  const start = useCallback(async () => {
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      chunksRef.current = [];

      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
        (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        chunksRef.current = [];
        const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((t) => t.stop());

        try {
          if (blob.size > 0) await uploadFn(blob, durationSeconds);
        } catch (e) {
          console.error("Failed to upload recording segment:", e);
        }

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
      startTimeRef.current = Date.now();
      recorder.start();
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

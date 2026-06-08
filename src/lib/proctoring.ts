import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProctorSeverity = "info" | "warning" | "high";

export type ProctorEvent = {
  event_type: string;
  message?: string;
  severity?: ProctorSeverity;
};

export async function logProctoringEvent(registrationId: string, evt: ProctorEvent): Promise<void> {
  const { error } = await supabase.from("proctoring_events").insert({
    registration_id: registrationId,
    event_type: evt.event_type,
    message: evt.message ?? null,
    severity: evt.severity ?? "info",
  });
  if (error) console.warn("proctoring log failed", error.message);
}

export type ProctorState = {
  tabSwitches: number;
  fullscreenExits: number;
  copyAttempts: number;
  pasteAttempts: number;
  contextMenuBlocks: number;
  devToolsBlocks: number;
  printBlocks: number;
  faceStatus: "unknown" | "present" | "absent" | "multiple";
  webcamActive: boolean;
  micActive: boolean;
  webcamError: string | null;
};

// ── Face detection ─────────────────────────────────────────────────────────────
// Uses the browser's FaceDetector API (Chrome/Edge 83+) when available.
// Falls back gracefully — no external API key required.
declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect(source: ImageBitmapSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

async function detectFaces(video: HTMLVideoElement): Promise<number | null> {
  if (!window.FaceDetector) return null;
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
    const faces = await detector.detect(video);
    return faces.length;
  } catch {
    return null;
  }
}

/**
 * Proctoring hook: requests camera+mic, watches tab visibility, fullscreen,
 * copy/paste/right-click, and logs every signal to proctoring_events.
 */
export function useProctoring(registrationId: string | null, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled !== false && !!registrationId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [state, setState] = useState<ProctorState>({
    tabSwitches: 0,
    fullscreenExits: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    contextMenuBlocks: 0,
    devToolsBlocks: 0,
    printBlocks: 0,
    faceStatus: "unknown",
    webcamActive: false,
    micActive: false,
    webcamError: null,
  });

  // Acquire media stream
  useEffect(() => {
    if (!enabled || !registrationId) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        // Audio level monitor (light)
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new Ctx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          src.connect(analyser);
        } catch {
          // noop
        }
        setState((s) => ({ ...s, webcamActive: true, micActive: true, webcamError: null }));
        await logProctoringEvent(registrationId, { event_type: "session.start", message: "Camera + mic acquired", severity: "info" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera access denied";
        setState((s) => ({ ...s, webcamError: msg }));
        await logProctoringEvent(registrationId, { event_type: "media.denied", message: msg, severity: "high" });
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [enabled, registrationId]);

  // Tab visibility
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const handler = () => {
      if (document.hidden) {
        setState((s) => ({ ...s, tabSwitches: s.tabSwitches + 1 }));
        void logProctoringEvent(registrationId, { event_type: "tab.switch", message: "Candidate left the exam tab", severity: "warning" });
      } else {
        void logProctoringEvent(registrationId, { event_type: "tab.return", message: "Candidate returned to exam tab", severity: "info" });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enabled, registrationId]);

  // Window blur (alt-tab on some OS doesn't fire visibilitychange)
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const onBlur = () => void logProctoringEvent(registrationId, { event_type: "window.blur", message: "Window lost focus", severity: "warning" });
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [enabled, registrationId]);

  // Fullscreen exit
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const handler = () => {
      if (!document.fullscreenElement) {
        setState((s) => ({ ...s, fullscreenExits: s.fullscreenExits + 1 }));
        void logProctoringEvent(registrationId, { event_type: "fullscreen.exit", message: "Candidate exited fullscreen", severity: "warning" });
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [enabled, registrationId]);

  // Copy / paste / context menu
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setState((s) => ({ ...s, copyAttempts: s.copyAttempts + 1 }));
      void logProctoringEvent(registrationId, { event_type: "clipboard.copy", message: "Copy blocked", severity: "warning" });
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setState((s) => ({ ...s, pasteAttempts: s.pasteAttempts + 1 }));
      void logProctoringEvent(registrationId, { event_type: "clipboard.paste", message: "Paste blocked", severity: "warning" });
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      setState((s) => ({ ...s, contextMenuBlocks: s.contextMenuBlocks + 1 }));
      void logProctoringEvent(registrationId, { event_type: "contextmenu.block", message: "Right-click blocked", severity: "info" });
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
    };
  }, [enabled, registrationId]);

  // Keyboard shortcut blocking (dev tools, view source, print, save)
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const BLOCKED: Array<{ key?: string; ctrlKey?: boolean; shiftKey?: boolean; code?: string }> = [
      { code: "F12" },                            // Dev tools
      { key: "I", ctrlKey: true, shiftKey: true }, // Ctrl+Shift+I
      { key: "J", ctrlKey: true, shiftKey: true }, // Ctrl+Shift+J (console)
      { key: "C", ctrlKey: true, shiftKey: true }, // Ctrl+Shift+C (inspector)
      { key: "U", ctrlKey: true },                 // View source
      { key: "S", ctrlKey: true },                 // Save page
      { key: "P", ctrlKey: true },                 // Print
    ];
    const onKey = (e: KeyboardEvent) => {
      const match = BLOCKED.some(
        (b) =>
          (b.code ? e.code === b.code : e.key === b.key) &&
          (b.ctrlKey === undefined || e.ctrlKey === b.ctrlKey) &&
          (b.shiftKey === undefined || e.shiftKey === b.shiftKey),
      );
      if (match) {
        e.preventDefault();
        e.stopPropagation();
        setState((s) => ({ ...s, devToolsBlocks: s.devToolsBlocks + 1 }));
        void logProctoringEvent(registrationId, {
          event_type: "devtools.blocked",
          message: `Blocked: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key || e.code}`,
          severity: "warning",
        });
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [enabled, registrationId]);

  // Print blocking
  useEffect(() => {
    if (!enabled || !registrationId) return;
    const onBeforePrint = () => {
      setState((s) => ({ ...s, printBlocks: s.printBlocks + 1 }));
      void logProctoringEvent(registrationId, { event_type: "print.blocked", message: "Print dialog blocked", severity: "warning" });
    };
    window.addEventListener("beforeprint", onBeforePrint);
    // CSS-level: hide content when printing
    const style = document.createElement("style");
    style.id = "orcalis-no-print";
    style.textContent = "@media print { body { display: none !important; } }";
    document.head.appendChild(style);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      document.getElementById("orcalis-no-print")?.remove();
    };
  }, [enabled, registrationId]);

  // Periodic face detection (every 10 s, requires FaceDetector API in browser)
  const runFaceCheck = useCallback(async () => {
    if (!enabled || !registrationId || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return; // video not ready
    const count = await detectFaces(video);
    if (count === null) return; // API not available — skip silently
    if (count === 0) {
      setState((s) => ({ ...s, faceStatus: "absent" }));
      void logProctoringEvent(registrationId, { event_type: "face.not_visible", message: "No face detected in webcam feed", severity: "warning" });
    } else if (count > 1) {
      setState((s) => ({ ...s, faceStatus: "multiple" }));
      void logProctoringEvent(registrationId, { event_type: "face.multiple", message: `${count} faces detected`, severity: "high" });
    } else {
      setState((s) => ({ ...s, faceStatus: "present" }));
      void logProctoringEvent(registrationId, { event_type: "face.present", message: "Face confirmed", severity: "info" });
    }
  }, [enabled, registrationId]);

  useEffect(() => {
    if (!enabled || !registrationId) return;
    // Initial check after 3 s, then every 10 s
    const initial = setTimeout(() => void runFaceCheck(), 3000);
    const interval = setInterval(() => void runFaceCheck(), 10_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [enabled, registrationId, runFaceCheck]);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore
    }
  };

  const endSession = async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (registrationId) {
      await logProctoringEvent(registrationId, { event_type: "session.end", message: "Session ended by candidate", severity: "info" });
    }
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  };

  return { videoRef, state, requestFullscreen, endSession, runFaceCheck };
}

"use client";

import { useRef, useEffect, useCallback } from "react";
import SignaturePadLib from "signature_pad";

type Props = {
  onSign: (base64Png: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function SignaturePad({ onSign, onClear, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio ?? 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);
    // Clear after resize to avoid distortion
    padRef.current?.clear();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLib(canvas, {
      penColor: "#1B2541",
      minWidth: 1,
      maxWidth: 2.5,
      velocityFilterWeight: 0.7,
    });

    pad.addEventListener("endStroke", () => {
      if (!pad.isEmpty()) {
        onSign(pad.toDataURL("image/png"));
      }
    });

    padRef.current = pad;
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      pad.off();
    };
  }, [onSign, resizeCanvas]);

  useEffect(() => {
    if (padRef.current) {
      disabled ? padRef.current.off() : padRef.current.on();
    }
  }, [disabled]);

  function handleClear() {
    padRef.current?.clear();
    onClear();
  }

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid #EDE8DF",
          background: "#FFFDF8",
          touchAction: "none",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: 160, display: "block" }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] font-medium" style={{ color: "#9B8E7B" }}>
          Teken uw handtekening hierboven
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F3EC]"
          style={{ color: "#9B8E7B" }}
        >
          Wissen
        </button>
      </div>
    </div>
  );
}

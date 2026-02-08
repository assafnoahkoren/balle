import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface BallOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function BallOtpInput({
  value,
  onChange,
  length = 9,
  disabled = false,
}: BallOtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clamped]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d$/.test(digit)) return;

      const chars = value.split("");
      // Fill any gaps with empty strings
      while (chars.length < length) chars.push("");
      chars[index] = digit;
      onChange(chars.join(""));

      if (index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, length, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const chars = value.split("");
        while (chars.length < length) chars.push("");

        if (chars[index]) {
          chars[index] = "";
          onChange(chars.join(""));
        } else if (index > 0) {
          chars[index - 1] = "";
          onChange(chars.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [value, onChange, length, focusInput]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted);
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [onChange, length, focusInput]
  );

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2.5" dir="ltr">
      {Array.from({ length }).map((_, i) => {
        const filled = !!value[i];
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={disabled}
              value={value[i] || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 1) {
                  // Handle autofill
                  const digits = v.replace(/\D/g, "");
                  if (digits.length > 1) {
                    onChange(digits.slice(0, length));
                    focusInput(Math.min(digits.length, length - 1));
                    return;
                  }
                }
                handleChange(i, v);
              }}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={cn(
                "ball-cell",
                "size-[34px] sm:size-11 rounded-full text-center text-sm sm:text-lg font-bold",
                "bg-[var(--cell-bg)] border-2 border-[var(--cell-border)]",
                "outline-none transition-all duration-200",
                "focus:border-[var(--accent-orange)] focus:shadow-[0_0_16px_var(--accent-orange-glow)]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                filled && "ball-cell-filled border-[var(--accent-orange)] text-[var(--accent-orange)]",
                !filled && "text-[var(--text-muted)]"
              )}
              style={{
                animationDelay: filled ? "0ms" : undefined,
              }}
            />
            {/* Decorative shine on filled cells */}
            {filled && (
              <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-full bg-white/15 pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}

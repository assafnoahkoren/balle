import { cn } from "@/lib/utils";

interface BallOtpInputProps {
  value: string;
  length?: number;
  disabled?: boolean;
  skipEntryAnimation?: boolean;
}

export function BallOtpInput({
  value,
  length = 9,
  disabled = false,
  skipEntryAnimation = false,
}: BallOtpInputProps) {
  // Current fill position for cursor indicator
  const cursorIndex = value.replace(/\s/g, "").length;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2.5" dir="ltr">
      {Array.from({ length }).map((_, i) => {
        const filled = !!value[i];
        const isCursor = i === cursorIndex && cursorIndex < length;
        return (
          <div key={i} className="relative">
            <div
              className={cn(
                !skipEntryAnimation && "ball-cell",
                "size-[34px] sm:size-11 rounded-full text-center text-sm sm:text-lg font-bold",
                "bg-[var(--cell-bg)] border-2 border-[var(--cell-border)]",
                "transition-all duration-200",
                "flex items-center justify-center",
                "select-none",
                disabled && "opacity-40",
                filled && "ball-cell-filled border-[var(--accent-orange)] text-[var(--accent-orange)]",
                !filled && "text-[var(--text-muted)]",
                isCursor && !filled && "border-[var(--accent-orange)] shadow-[0_0_16px_var(--accent-orange-glow)]"
              )}
            >
              <span className="font-display">{value[i] || ""}</span>
              {isCursor && !filled && (
                <div className="absolute inset-0 rounded-full animate-pulse border-2 border-[var(--accent-orange)] opacity-40 pointer-events-none" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

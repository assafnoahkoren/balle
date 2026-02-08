import { useEffect, useState, useRef } from "react";

type Phase = "shine" | "rollout" | "shift" | "fadeout" | "complete";

interface DispenseAnimationProps {
  digits: string;
  onComplete: () => void;
}

export function DispenseAnimation({ digits, onComplete }: DispenseAnimationProps) {
  const [phase, setPhase] = useState<Phase>("shine");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("rollout"), 1000);
    const t2 = setTimeout(() => setPhase("shift"), 1550);
    const t3 = setTimeout(() => setPhase("fadeout"), 1950);
    const t4 = setTimeout(() => {
      setPhase("complete");
      onCompleteRef.current();
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const allDigits = digits.slice(0, 9).split("");

  // Phases: shine & rollout — all 9 balls visible
  if (phase === "shine" || phase === "rollout") {
    return (
      <div
        className="flex items-center justify-center gap-1 sm:gap-2.5 overflow-visible"
        dir="ltr"
      >
        {allDigits.map((digit, i) => (
          <div
            key={i}
            className={[
              "dispense-ball relative",
              "size-[34px] sm:size-11 rounded-full border-2",
              "flex items-center justify-center",
              "font-display text-sm sm:text-lg font-bold",
              "border-[var(--accent-orange)] text-[var(--accent-orange)]",
              "bg-[rgba(255,122,47,0.08)]",
              phase === "shine" ? "anim-shine" : "",
              phase === "rollout" && i === 8 ? "anim-rollout" : "",
            ].join(" ")}
            style={{
              animationDelay:
                phase === "shine" ? `${i * 90}ms` : undefined,
            }}
          >
            {digit}
          </div>
        ))}
      </div>
    );
  }

  // Phase: shift — [new_empty, digits 0-7] sliding into new positions
  // Phase: fadeout — all 9 cells fade to empty state (matches BallOtpInput empty)
  const isFadeout = phase === "fadeout" || phase === "complete";

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-2.5 overflow-visible"
      dir="ltr"
    >
      {/* New empty ball entering from the left */}
      <div
        className={[
          "dispense-ball",
          phase === "shift" ? "anim-new-ball" : "",
          "size-[34px] sm:size-11 rounded-full border-2",
          "border-[var(--cell-border)] bg-[var(--cell-bg)]",
          "flex items-center justify-center",
        ].join(" ")}
      />

      {/* Remaining 8 balls shift right, then fade to empty */}
      {allDigits.slice(0, 8).map((digit, i) => (
        <div
          key={`s-${i}`}
          className={[
            "dispense-ball",
            phase === "shift" ? "anim-shift" : "",
            isFadeout ? "anim-fadeout" : "",
            "size-[34px] sm:size-11 rounded-full border-2",
            "flex items-center justify-center",
            "font-display text-sm sm:text-lg font-bold",
            isFadeout
              ? "border-[var(--cell-border)] bg-[var(--cell-bg)] text-transparent"
              : "border-[var(--accent-orange)] text-[var(--accent-orange)] bg-[rgba(255,122,47,0.08)]",
          ].join(" ")}
        >
          {digit}
        </div>
      ))}
    </div>
  );
}

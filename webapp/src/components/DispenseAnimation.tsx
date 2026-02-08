import { useEffect, useState, useRef } from "react";

type Phase = "shine" | "rollout" | "shift" | "complete";

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
    const t3 = setTimeout(() => {
      setPhase("complete");
      onCompleteRef.current();
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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
            {/* Shine highlight */}
            <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-full bg-white/15 pointer-events-none" />
          </div>
        ))}
      </div>
    );
  }

  // Phase: shift — [new_empty, digits 0-7] sliding into new positions
  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-2.5 overflow-visible"
      dir="ltr"
    >
      {/* New empty ball entering from the left */}
      <div
        className={[
          "dispense-ball anim-new-ball",
          "size-[34px] sm:size-11 rounded-full border-2",
          "border-[var(--cell-border)] bg-[var(--cell-bg)]",
          "flex items-center justify-center",
        ].join(" ")}
      />

      {/* Remaining 8 balls shift right */}
      {allDigits.slice(0, 8).map((digit, i) => (
        <div
          key={`s-${i}`}
          className={[
            "dispense-ball anim-shift",
            "size-[34px] sm:size-11 rounded-full border-2",
            "flex items-center justify-center",
            "font-display text-sm sm:text-lg font-bold",
            "border-[var(--accent-orange)] text-[var(--accent-orange)]",
            "bg-[rgba(255,122,47,0.08)]",
          ].join(" ")}
        >
          {digit}
        </div>
      ))}
    </div>
  );
}

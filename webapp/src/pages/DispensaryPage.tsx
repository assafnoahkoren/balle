import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { BallOtpInput } from "@/components/BallOtpInput";
import { DispenseAnimation } from "@/components/DispenseAnimation";
import { CircleDot, Undo2, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";
type Action = "dispense" | "return";

interface ResultState {
  status: Status;
  action?: Action;
  message?: string;
}

export default function DispensaryPage() {
  const { dispensaryId } = useParams<{ dispensaryId: string }>();
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<ResultState>({ status: "idle" });
  const [isAnimating, setIsAnimating] = useState(false);

  // Store the pending result to show after animation completes
  const pendingResultRef = useRef<ResultState | null>(null);

  const isIdComplete = userId.replace(/\s/g, "").length === 9;
  const isLoading = result.status === "loading";

  const handleAction = useCallback(
    async (action: Action) => {
      if (!isIdComplete || !dispensaryId) return;

      setResult({ status: "loading", action });

      try {
        const response = await fetch(`/api/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dispensaryId,
            userId: userId.trim(),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || `Request failed`);
        }

        const data = await response.json();
        const successResult: ResultState = {
          status: "success",
          action,
          message:
            data.message ||
            (action === "dispense"
              ? "Ball dispensed!"
              : "Ball returned!"),
        };

        // For dispense success, play the animation first
        if (action === "dispense") {
          pendingResultRef.current = successResult;
          setResult({ status: "idle" }); // hide loading state during animation
          setIsAnimating(true);
        } else {
          setResult(successResult);
        }
      } catch (err) {
        setResult({
          status: "error",
          action,
          message:
            err instanceof Error
              ? err.message
              : "Something went wrong",
        });
      }
    },
    [isIdComplete, dispensaryId, userId]
  );

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setUserId("");
    if (pendingResultRef.current) {
      setResult(pendingResultRef.current);
      pendingResultRef.current = null;
    }
  }, []);

  return (
    <div className="dispensary-page min-h-dvh flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative floating balls — hidden on small screens */}
      <div className="floating-ball floating-ball-1 hidden sm:block" />
      <div className="floating-ball floating-ball-2 hidden sm:block" />
      <div className="floating-ball floating-ball-3 hidden sm:block" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="balle-logo flex items-center gap-2">
            <CircleDot className="size-8 text-[var(--accent-orange)]" strokeWidth={2.5} />
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              balle
            </h1>
          </div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] font-medium">
            Machine {dispensaryId || "---"}
          </p>
        </div>

        {/* ID Entry / Animation */}
        <div className="w-full flex flex-col items-center gap-3">
          <label className="text-sm font-semibold text-[var(--text-secondary)] tracking-wide">
            {isAnimating ? "Dispensing..." : "Enter your ID"}
          </label>

          {isAnimating ? (
            <DispenseAnimation
              digits={userId}
              onComplete={handleAnimationComplete}
            />
          ) : (
            <BallOtpInput
              value={userId}
              onChange={setUserId}
              length={9}
              disabled={isLoading}
            />
          )}

          <p className="text-xs text-[var(--text-muted)]">
            {isAnimating ? "\u00A0" : "9-digit member number"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => handleAction("dispense")}
            disabled={!isIdComplete || isLoading || isAnimating}
            className="action-btn action-btn-dispense group"
          >
            {isLoading && result.action === "dispense" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <CircleDot className="size-5 transition-transform group-hover:scale-110" />
            )}
            <span>Dispense Ball</span>
          </button>

          <button
            onClick={() => handleAction("return")}
            disabled={!isIdComplete || isLoading || isAnimating}
            className="action-btn action-btn-return group"
          >
            {isLoading && result.action === "return" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Undo2 className="size-5 transition-transform group-hover:scale-110" />
            )}
            <span>Return Ball</span>
          </button>
        </div>

      </div>
    </div>
  );
}

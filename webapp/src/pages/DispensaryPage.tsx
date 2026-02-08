import { useState, useCallback } from "react";
import { useParams } from "react-router";
import { BallOtpInput } from "@/components/BallOtpInput";
import { CircleDot, Undo2, RotateCcw, Loader2 } from "lucide-react";

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
        setResult({
          status: "success",
          action,
          message:
            data.message ||
            (action === "dispense"
              ? "Ball dispensed!"
              : "Ball returned!"),
        });
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

  const handleReset = useCallback(() => {
    setUserId("");
    setResult({ status: "idle" });
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

        {/* ID Entry */}
        <div className="w-full flex flex-col items-center gap-3">
          <label className="text-sm font-semibold text-[var(--text-secondary)] tracking-wide">
            Enter your ID
          </label>
          <BallOtpInput
            value={userId}
            onChange={setUserId}
            length={9}
            disabled={isLoading}
          />
          <p className="text-xs text-[var(--text-muted)]">
            9-digit member number
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => handleAction("dispense")}
            disabled={!isIdComplete || isLoading}
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
            disabled={!isIdComplete || isLoading}
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

        {/* Result feedback */}
        {result.status !== "idle" && result.status !== "loading" && (
          <div
            className={`result-banner w-full rounded-2xl px-5 py-4 text-center ${
              result.status === "success"
                ? "result-success"
                : "result-error"
            }`}
          >
            <p className="text-sm font-bold mb-0.5">
              {result.status === "success" ? "Done!" : "Oops!"}
            </p>
            <p className="text-xs opacity-80">{result.message}</p>
            <button
              onClick={handleReset}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
            >
              <RotateCcw className="size-3" />
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

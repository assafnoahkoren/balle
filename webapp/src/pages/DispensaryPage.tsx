import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { BallOtpInput } from "@/components/BallOtpInput";
import { NumericKeyboard } from "@/components/NumericKeyboard";
import { DispenseAnimation } from "@/components/DispenseAnimation";
import { isValidIsraeliId } from "@/lib/israeliId";
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
  const [machineLabel, setMachineLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!dispensaryId) return;
    fetch(`/api/devices/${dispensaryId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.label) setMachineLabel(d.label); })
      .catch(() => {});
  }, [dispensaryId]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [skipEntryAnim, setSkipEntryAnim] = useState(false);

  // Store the pending result to show after animation completes
  const pendingResultRef = useRef<ResultState | null>(null);

  const trimmedId = userId.replace(/\s/g, "");
  const isIdComplete = trimmedId.length === 9;
  const isIdValid = isIdComplete && isValidIsraeliId(trimmedId);
  const isLoading = result.status === "loading";

  const handleDigit = useCallback(
    (digit: string) => {
      setUserId((prev) => {
        const trimmed = prev.replace(/\s/g, "");
        if (trimmed.length >= 9) return prev;
        setSkipEntryAnim(false);
        return trimmed + digit;
      });
    },
    []
  );

  const handleBackspace = useCallback(() => {
    setUserId((prev) => {
      const trimmed = prev.replace(/\s/g, "");
      if (trimmed.length === 0) return prev;
      return trimmed.slice(0, -1);
    });
  }, []);

  const handleAction = useCallback(
    async (action: Action) => {
      if (!isIdValid || !dispensaryId) return;

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

        // Play animation, then show result after it completes
        pendingResultRef.current = successResult;
        setResult({ status: "idle" });
        setIsAnimating(true);
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
    [isIdValid, dispensaryId, userId]
  );

  const handleAnimationComplete = useCallback(() => {
    setSkipEntryAnim(true);
    setIsAnimating(false);
    setUserId("");
    if (pendingResultRef.current) {
      setResult(pendingResultRef.current);
      pendingResultRef.current = null;
    }
  }, []);

  return (
    <div className="dispensary-page min-h-dvh flex flex-col relative overflow-hidden">
      {/* Decorative floating balls — hidden on small screens */}
      <div className="floating-ball floating-ball-1 hidden sm:block" />
      <div className="floating-ball floating-ball-2 hidden sm:block" />
      <div className="floating-ball floating-ball-3 hidden sm:block" />

      {/* Main content — centered above the keyboard */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 pb-[calc(var(--numpad-h)+1rem)]">
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="balle-logo flex items-center gap-2">
              <CircleDot className="size-8 text-[var(--accent-orange)]" strokeWidth={2.5} />
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                balle
              </h1>
            </div>
            <p dir="rtl" className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] font-medium">
              {machineLabel ?? `מכונה ${dispensaryId || "---"}`}
            </p>
          </div>

          {/* ID Entry / Animation */}
          <div className="w-full flex flex-col items-center gap-3">
            <label className="text-sm font-semibold text-[var(--text-secondary)] tracking-wide">
              {isAnimating ? "מחלק..." : "הזן תעודת זהות"}
            </label>

            {isAnimating ? (
              <DispenseAnimation
                digits={userId}
                onComplete={handleAnimationComplete}
              />
            ) : (
              <BallOtpInput
                value={userId}
                length={9}
                disabled={isLoading}
                skipEntryAnimation={skipEntryAnim}
              />
            )}

            <p className={`text-xs ${isIdComplete && !isIdValid ? "text-[var(--error-red)]" : "text-[var(--text-muted)]"}`}>
              {isAnimating
                ? "\u00A0"
                : isIdComplete && !isIdValid
                  ? "מספר תעודת זהות לא תקין"
                  : "מספר תעודת זהות בן 9 ספרות"}
            </p>
          </div>

        </div>
      </div>

      {/* Sticky bottom keyboard with action buttons */}
      {!isAnimating && (
        <NumericKeyboard
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={isLoading}
          actionRow={
            <>
              <button dir="rtl"
                onClick={() => handleAction("return")}
                disabled={isLoading}
                className="numpad-action numpad-action-return"
              >
                <div className="text-lg flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    {isLoading && result.action === "return" ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Undo2 className="size-5" />
                    )}
                    <span>החזרה</span>
                  </div>
                  <span className="text-[14px] font-normal opacity-60">החזרת כדור למכונה</span>
                </div>
              </button>
              <button dir="rtl"
                onClick={() => handleAction("dispense")}
                disabled={isLoading}
                className="numpad-action numpad-action-dispense"
              >
                <div className="text-lg flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    {isLoading && result.action === "dispense" ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <CircleDot className="size-5" />
                    )}
                    <span>שחרור</span>
                  </div>
                  <span className="text-[14px] font-normal opacity-60">קבלת כדור מהמכונה</span>
                </div>
              </button>
            </>
          }
        />
      )}
    </div>
  );
}

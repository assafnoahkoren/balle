import { useCallback, useRef, type ReactNode } from "react";
import { Delete } from "lucide-react";

interface NumericKeyboardProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  actionRow?: ReactNode;
}

const KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  null, "0", "back",
] as const;

export function NumericKeyboard({
  onDigit,
  onBackspace,
  disabled = false,
  actionRow,
}: NumericKeyboardProps) {
  const holdTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval>>(null);


  const handlePress = useCallback(
    (key: string) => {
      if (disabled) return;
      if (key === "back") {
        onBackspace();
      } else {
        onDigit(key);
      }
    },
    [disabled, onDigit, onBackspace]
  );

  const startHoldDelete = useCallback(() => {
    if (disabled) return;
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(() => {
        onBackspace();
      }, 50);
    }, 500);
  }, [disabled, onBackspace]);

  const stopHoldDelete = useCallback(() => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
  }, []);

  return (
    <div className="numpad-dock">
      <div className="numpad-grid">
        {KEYS.map((key, i) => {
          if (key === null) {
            return <div key={i} />;
          }

          const isBack = key === "back";

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePress(key);
                if (isBack) startHoldDelete();
              }}
              {...(isBack ? {
                onPointerUp: stopHoldDelete,
                onPointerLeave: stopHoldDelete,
              } : {})}
              style={{ touchAction: "manipulation" }}
              className={[
                "numpad-key",
                isBack ? "numpad-key-back" : "numpad-key-digit",
              ].join(" ")}
            >
              {isBack ? <Delete className="size-6" /> : key}
            </button>
          );
        })}
      </div>
      {actionRow && (
        <div className="numpad-actions">{actionRow}</div>
      )}
    </div>
  );
}

/**
 * Validates an Israeli ID number (Teudat Zehut).
 * Uses the Luhn-like check digit algorithm:
 * - Pad to 9 digits
 * - Multiply digits alternately by 1 and 2
 * - If product > 9, subtract 9
 * - Sum must be divisible by 10
 */
export function isValidIsraeliId(id: string): boolean {
  const digits = id.replace(/\D/g, "");
  if (digits.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = Number(digits[i]) * ((i % 2) + 1);
    if (val > 9) val -= 9;
    sum += val;
  }

  return sum % 10 === 0;
}

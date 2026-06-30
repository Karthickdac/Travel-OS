/**
 * FASTag bank-SMS parser.
 *
 * Indian FASTag issuing banks send an SMS on every toll deduction and every
 * recharge. These messages reliably contain the *available balance* after the
 * transaction. By parsing that SMS we can keep the stored balance up to date in
 * near-realtime without needing a NETC/bank API partnership.
 *
 * The parser is intentionally tolerant of the many phrasings used by different
 * banks (HDFC, ICICI, SBI, Paytm, Axis, etc.).
 */

export type FastagSmsDirection = "debit" | "credit";

export interface ParsedFastagSms {
  /** Available balance reported in the SMS, if present. */
  availableBalance: number | null;
  /** Transaction amount (the toll deducted or amount recharged), if present. */
  amount: number | null;
  /** Whether this SMS represents a deduction or a top-up. */
  direction: FastagSmsDirection | null;
  /** Vehicle registration number found in the SMS, normalized (no spaces, upper). */
  vehicleNumber: string | null;
  /** Last 4 digits of the FASTag / wallet account, if present (e.g. "XXXX1234"). */
  tagLast4: string | null;
}

function toNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Normalize an Indian plate: strip spaces/dashes, uppercase. */
export function normalizeVehicleNumber(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

const CURRENCY = String.raw`(?:rs\.?|inr|₹)\s*`;
const NUM = String.raw`([\d,]+(?:\.\d{1,2})?)`;

// Balance phrasings: "Avl Bal", "Avbl Bal", "Available balance", "A/c Bal",
// "bal is", "balance:", etc. followed by an optional currency token + number.
const BALANCE_RE = new RegExp(
  String.raw`(?:avl|avbl|avail(?:able)?|a\/?c|account|current)?\.?\s*bal(?:ance)?\s*(?:is|:|-)?\s*` +
    CURRENCY +
    `?` +
    NUM,
  "i",
);

// Any currency-prefixed amount in the message.
const ANY_AMOUNT_RE = new RegExp(CURRENCY + NUM, "ig");

// Indian vehicle registration plate.
const VEHICLE_RE = /\b([A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{3,4})\b/i;

// Masked account/tag tail e.g. "a/c XXXX1234" or "tag ****5678".
const TAG_LAST4_RE = /(?:x{2,}|\*{2,})\s*(\d{4})\b/i;

const DEBIT_RE = /(debit|deduct|toll|spent|paid|charged|usage)/i;
const CREDIT_RE = /(recharg|credit|added|top\s*-?\s*up|loaded|received)/i;

/**
 * Parse a FASTag bank SMS into structured fields. Returns best-effort values;
 * callers should treat all fields as optional and validate before use.
 */
export function parseFastagSms(message: string): ParsedFastagSms {
  const msg = (message ?? "").trim();

  // Available balance.
  const balMatch = msg.match(BALANCE_RE);
  const availableBalance = toNumber(balMatch?.[1]);

  // Direction. Check credit first: words like "recharged" contain the substring
  // "charged" (a debit keyword), so credit phrasings must win.
  let direction: FastagSmsDirection | null = null;
  if (CREDIT_RE.test(msg)) direction = "credit";
  else if (DEBIT_RE.test(msg)) direction = "debit";

  // Transaction amount: the first currency amount that is NOT the balance figure.
  let amount: number | null = null;
  const balanceStr = balMatch?.[0];
  for (const m of msg.matchAll(ANY_AMOUNT_RE)) {
    // Skip the amount that belongs to the balance phrase.
    if (balanceStr && balanceStr.includes(m[0])) continue;
    const n = toNumber(m[1]);
    if (n != null) {
      amount = n;
      break;
    }
  }

  // Vehicle number.
  const vehMatch = msg.match(VEHICLE_RE);
  const vehicleNumber = vehMatch ? normalizeVehicleNumber(vehMatch[1]) : null;

  // Tag last 4.
  const tagMatch = msg.match(TAG_LAST4_RE);
  const tagLast4 = tagMatch?.[1] ?? null;

  return { availableBalance, amount, direction, vehicleNumber, tagLast4 };
}

/**
 * Given the parsed SMS and the tag's current balance, compute the new balance.
 * Prefers the explicit available balance; otherwise applies the transaction
 * amount to the current balance based on direction.
 */
export function computeNewBalance(
  parsed: ParsedFastagSms,
  currentBalance: number,
): number | null {
  if (parsed.availableBalance != null) return parsed.availableBalance;
  if (parsed.amount != null && parsed.direction === "debit") {
    return Math.max(0, currentBalance - parsed.amount);
  }
  if (parsed.amount != null && parsed.direction === "credit") {
    return currentBalance + parsed.amount;
  }
  return null;
}

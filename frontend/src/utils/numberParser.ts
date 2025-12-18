export interface ParseOptions {
  minRequired?: number;   // default 5
  maxValue?: number;      // default 99
  unique?: boolean;       // default true
}

export interface ParseResult {
  ok: boolean;
  numbers: number[];
  error?: string;
}

export function parseNumberList(
  input: string,
  opts: ParseOptions = {}
): ParseResult {
  const {
    minRequired = 5,
    maxValue = 99,
    unique = true,
  } = opts;

  if (!input || !input.trim()) {
    return { ok: false, numbers: [], error: "Input is empty." };
  }

  // extract all integers
  const raw = input.match(/\d+/g);
  if (!raw) {
    return { ok: false, numbers: [], error: "No numbers found." };
  }

  let nums = raw.map((x) => parseInt(x, 10)).filter((n) => n > 0);

  if (unique) {
    nums = Array.from(new Set(nums));
  }

  if (nums.some((n) => n > maxValue)) {
    return {
      ok: false,
      numbers: [],
      error: `Numbers must be ≤ ${maxValue}.`,
    };
  }

  if (nums.length < minRequired) {
    return {
      ok: false,
      numbers: [],
      error: `Enter at least ${minRequired} unique numbers.`,
    };
  }

  nums.sort((a, b) => a - b);

  return { ok: true, numbers: nums };
}

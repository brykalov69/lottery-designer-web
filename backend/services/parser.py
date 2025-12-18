# parser.py

from __future__ import annotations
from typing import List, Tuple
import re
from datetime import datetime

# ============================================================
# DATE PARSER
# ============================================================

DATE_FORMATS = [
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%d/%m/%Y",
    "%d-%m-%Y",
]

def try_parse_date(text: str) -> Tuple[str | None, int | None]:
    text = text.strip()
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(text, fmt)
            return dt.strftime("%Y-%m-%d"), dt.year
        except Exception:
            pass
    return None, None


# ============================================================
# SPLIT MAIN / EXTRA
# ============================================================

def split_main_extra(nums: List[int], main_count: int, extra_count: int):
    main = nums[:main_count]
    extra = nums[main_count:main_count + extra_count] if extra_count > 0 else []
    return main, extra


# ============================================================
# TXT / CSV PARSER (ROBUST & DETERMINISTIC)
# ============================================================

def parse_history(content: str, filetype: str, main_count: int, extra_count: int):
    lines = content.replace("\r", "").split("\n")
    out = []

    for raw in lines:
        raw = raw.strip()
        if not raw:
            continue

        raw_lower = raw.lower()

        # Skip non-draw rows / metadata
        if any(k in raw_lower for k in (
            "double draw",
            "double",
            "powerplay",
            "power play",
            "multiplier",
            "bonus",
        )):
            continue

        if raw_lower.startswith(("date", "draw", "drawdate")):
            continue

        tokens = re.split(r"[,\t;| ]+", raw)

        date = None
        year = None
        date_index = None

        # Detect date position
        for i, t in enumerate(tokens):
            d, y = try_parse_date(t)
            if d:
                date = d
                year = y
                date_index = i
                break

        num_tokens = tokens[date_index + 1 :] if date_index is not None else tokens

        # Collect all numeric tokens (raw)
        nums: List[int] = []
        for t in num_tokens:
            t = t.strip()
            if re.fullmatch(r"\d+", t):
                n = int(t)
                if n < 100:
                    nums.append(n)

        # Need at least main_count numbers to form a draw
        if len(nums) < main_count:
            continue

        # 👇 Save raw count BEFORE any cleanup
        raw_count = len(nums)

        # Remove duplicates but KEEP ORDER
        nums = list(dict.fromkeys(nums))

        # Split main / extra (extra is optional)
        main, extra = split_main_extra(nums, main_count, extra_count)

        # If we still can't form main balls → skip
        if len(main) != main_count:
            continue

        out.append({
            "date": date,
            "year": year,
            "main": sorted(main),
            "extra": sorted(extra),
            "_raw_count": raw_count,   # 🔑 real raw size before trimming
        })

    return out

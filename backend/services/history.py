from itertools import combinations
from collections import Counter
from typing import List, Dict, Any
import base64

from services.parser import parse_history
from services.parser_excel import parse_excel_history

# ============================================================
# GLOBAL HISTORY STORAGE
# ============================================================

_HISTORY: List[Dict[str, Any]] = []


def load_history_from_parsed(rows: List[Dict[str, Any]]):
    global _HISTORY
    _HISTORY = rows


def get_history() -> List[Dict[str, Any]]:
    return _HISTORY


# ============================================================
# APPLY HISTORY (USED BY /history/apply)
# ============================================================

def apply_history(
    *,
    text: str | None,
    file_b64: str | None,
    filetype: str,
    main_count: int,
    extra_count: int,
    has_extra: bool,  # 👈 ВАЖНО: явная модель данных
):
    if filetype == "XLSX":
        if not file_b64:
            raise ValueError("XLSX file requires file_b64")

        binary = base64.b64decode(file_b64)
        rows = parse_excel_history(binary, main_count, extra_count)

    else:
        if not text:
            raise ValueError("Text content is required for CSV/TXT history")

        rows = parse_history(text, filetype, main_count, extra_count)

    # --- SMART validation: extra-ball consistency ---
    possible_extra = False

    # ⚠️ WARNING возможен ТОЛЬКО если пользователь сказал "Extra = NO"
    if not has_extra:
        for r in rows:
            raw = r.get("_raw_count")
            if raw is not None and raw > main_count:
                possible_extra = True
                break

    load_history_from_parsed(rows)

    return {
        "rows": rows,
        "stats": {
            "accepted": len(rows),
            "main_count": main_count,
            "extra_count": extra_count,
            "filetype": filetype,
            "warnings": {
                "possible_extra_ball": possible_extra
            }
        }
    }
# ============================================================
# SHARED FILTER
# ============================================================

def filter_history(
    draws: List[Dict[str, Any]] | None = None,
    min_num: int | None = None,
    max_num: int | None = None,
    last_n: int | None = None,
    years: List[int] | None = None,
):
    if draws is None:
        draws = _HISTORY

    out = draws

    if years:
        out = [d for d in out if d.get("year") in years]

    if last_n:
        out = out[-last_n:]

    if min_num is not None:
        out = [d for d in out if all(n >= min_num for n in d.get("main", []))]

    if max_num is not None:
        out = [d for d in out if all(n <= max_num for n in d.get("main", []))]

    return out


# ============================================================
# ANALYTICS (COMBINATORICS)
# ============================================================

def build_analysis(
    min_num: int | None = None,
    max_num: int | None = None,
    last_n: int | None = None,
    years: List[int] | None = None,
):
    draws = filter_history(
        _HISTORY,
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
    )

    if not draws:
        return {"error": "No history loaded"}

    triplet_counts = Counter()
    quad_counts = Counter()
    quint_counts = Counter()

    for draw in draws:
        nums = draw.get("main", [])
        if len(nums) < 3:
            continue

        nums = sorted(nums)

        for c in combinations(nums, 3):
            triplet_counts[c] += 1
        for c in combinations(nums, 4):
            quad_counts[c] += 1
        for c in combinations(nums, 5):
            quint_counts[c] += 1

    return {
        "total_draws": len(draws),
        "triples": [(c, n) for c, n in triplet_counts.items() if n >= 2],
        "quads":   [(c, n) for c, n in quad_counts.items() if n >= 2],
        "quints":  [(c, n) for c, n in quint_counts.items() if n >= 2],
    }


# ============================================================
# AI INSIGHTS (GLOBAL FREQUENCY)
# ============================================================

def ai_insights(
    mode: str = "global",
    min_num: int | None = None,
    max_num: int | None = None,
    last_n: int | None = None,
    years: List[int] | None = None,
):
    draws = filter_history(
        _HISTORY,
        min_num=min_num,
        max_num=max_num,
        last_n=last_n,
        years=years,
    )

    if not draws:
        return {"error": "No history loaded"}

    freq = Counter()
    for d in draws:
        for n in d.get("main", []):
            freq[n] += 1

    return {
        "mode": mode,
        "frequencies": dict(freq),
        "total_draws": len(draws),
    }


# ============================================================
# HEATMAP
# ============================================================

def compute_heatmap(draws: List[Dict[str, Any]]):
    if not draws:
        return {"error": "No history loaded"}

    all_nums = [n for d in draws for n in d.get("main", [])]
    if not all_nums:
        return {"error": "No main numbers"}

    min_n = min(all_nums)
    max_n = max(all_nums)

    segments = 5
    width = (max_n - min_n + 1) / segments

    ranges = []
    start = min_n
    for i in range(segments):
        end = int(round(min_n + (i + 1) * width)) - 1
        if i == segments - 1:
            end = max_n
        ranges.append((start, end))
        start = end + 1

    counts = [0] * segments
    for n in all_nums:
        for i, (a, b) in enumerate(ranges):
            if a <= n <= b:
                counts[i] += 1
                break

    max_c = max(counts)
    min_c = min(counts)

    def norm(v: int):
        return 0.5 if max_c == min_c else (v - min_c) / (max_c - min_c)

    return {
        "segments": [
            {
                "id": i + 1,
                "range": [a, b],
                "count": counts[i],
                "score": round(norm(counts[i]), 3),
            }
            for i, (a, b) in enumerate(ranges)
        ],
        "min_value": min_n,
        "max_value": max_n,
    }


# ============================================================
# ADJACENCY ANALYSIS (🔥 ВОССТАНОВЛЕНО)
# ============================================================

def compute_adjacency_analysis(draws: List[Dict[str, Any]]):
    if not draws or len(draws) < 2:
        return {"error": "Not enough history for adjacency analysis"}

    adjacency = Counter()

    for prev, curr in zip(draws[:-1], draws[1:]):
        prev_set = set(prev.get("main", []))
        curr_set = set(curr.get("main", []))

        for p in prev_set:
            for c in curr_set:
                adjacency[(p, c)] += 1

    last_draw = draws[-1].get("main", [])

    return {
        "last_draw": last_draw,
        "likely_followers": [
            {"from": a, "to": b, "count": cnt}
            for (a, b), cnt in adjacency.most_common(20)
        ],
    }


# ============================================================
# AI TIPS
# ============================================================

def compute_ai_tips(draws: List[Dict[str, Any]], heatmap: Dict[str, Any]):
    if not draws:
        return {"error": "No history loaded"}

    tips = []

    for seg in heatmap.get("segments", []):
        if seg.get("count", 0) < 3:
            a, b = seg.get("range", [None, None])
            tips.append(f"Numbers {a}–{b} appear rarely.")

    return {"tips": tips}

# ============================================================
# History for standart
# ============================================================

def normalize_history_rows(rows, source):
    normalized = []

    for r in rows:
        draw_date = r.get("date")
        year = r.get("year")

        if draw_date and not year:
            try:
                year = int(draw_date[:4])
            except Exception:
                year = None

        normalized.append({
            "draw_date": draw_date,
            "year": year,
            "main": r.get("main", []),
            "extra": r.get("extra", []),
            "source": source.lower(),
        })

    return normalized


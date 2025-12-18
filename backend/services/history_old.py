from __future__ import annotations
from typing import List, Dict, Optional

# ==========================================================
# INTERNAL STORAGE
# ==========================================================

_history_storage: List[Dict] = []


# ==========================================================
# LOAD / GET
# ==========================================================

def load_history_from_parsed(records: List[Dict]):
    global _history_storage
    _history_storage = list(records)


def get_history() -> List[Dict]:
    return _history_storage


# ==========================================================
# FILTERING ENGINE
# ==========================================================

def filter_history(
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None
) -> List[Dict]:

    data = _history_storage

    if years:
        data = [d for d in data if d.get("year") in years]

    if last_n and last_n > 0:
        data = data[-last_n:]

    if min_num is not None:
        data = [d for d in data if all(n >= min_num for n in d["main"])]

    if max_num is not None:
        data = [d for d in data if all(n <= max_num for n in d["main"])]

    return data


# ==========================================================
# GLOBAL ANALYSIS
# ==========================================================

def build_analysis(
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None
) -> Dict:

    from itertools import combinations

    draws = filter_history(min_num, max_num, last_n, years)

    frequencies: Dict[int, int] = {}
    triplet_counts: Dict[tuple, int] = {}
    quad_counts: Dict[tuple, int] = {}

    for d in draws:
        main = d["main"]

        for n in main:
            frequencies[n] = frequencies.get(n, 0) + 1

        for tri in combinations(main, 3):
            tri = tuple(sorted(tri))
            triplet_counts[tri] = triplet_counts.get(tri, 0) + 1

        for quad in combinations(main, 4):
            quad = tuple(sorted(quad))
            quad_counts[quad] = quad_counts.get(quad, 0) + 1

    return {
        "balls": frequencies,
        "total_draws": len(draws),
        "top_numbers": sorted(frequencies.items(), key=lambda x: x[1], reverse=True)[:20],
        "top_triplets": sorted(triplet_counts.items(), key=lambda x: x[1], reverse=True)[:20],
        "top_quads": sorted(quad_counts.items(), key=lambda x: x[1], reverse=True)[:20],
    }


# ==========================================================
# ADJACENCY ANALYSIS ENGINE
# ==========================================================

def compute_adjacency_analysis(draws):
    from collections import defaultdict

    total_draws = len(draws)
    if total_draws < 2:
        return {"error": "Not enough draws for adjacency analysis"}

    repeat_count = defaultdict(int)
    appear_count = defaultdict(int)
    neighbor_count = defaultdict(int)

    for i in range(1, total_draws):
        prev = set(draws[i-1].get("main", []))
        curr = set(draws[i].get("main", []))

        for n in curr:
            appear_count[n] += 1

            if n in prev:
                repeat_count[n] += 1

            if (n-1) in prev or (n+1) in prev:
                neighbor_count[n] += 1

    repeat_rate = {n: repeat_count[n] / appear_count[n] for n in appear_count}
    neighbor_rate = {n: neighbor_count[n] / appear_count[n] for n in appear_count}

    def normalize(d):
        vals = list(d.values())
        mn, mx = min(vals), max(vals)
        if mn == mx:
            return {k: 0.5 for k in d}
        return {k: (d[k] - mn) / (mx - mn) for k in d}

    norm_repeat = normalize(repeat_rate)
    norm_neighbor = normalize(neighbor_rate)

    adjacency_index = {
        n: 0.5 * norm_repeat[n] + 0.5 * norm_neighbor[n]
        for n in appear_count
    }

    last_draw = set(draws[-1].get("main", []))

    likely = []
    ext = []

    for n, idx in adjacency_index.items():
        if n in last_draw or any((n-1)==x or (n+1)==x for x in last_draw):
            likely.append((n, idx))
        ext.append((n, idx))

    likely = sorted(likely, key=lambda x: x[1], reverse=True)[:10]
    ext = sorted(ext, key=lambda x: x[1], reverse=True)[:20]

    return {
        "repeat_rate": repeat_rate,
        "neighbor_rate": neighbor_rate,
        "adjacency_index": adjacency_index,
        "likely_followers": likely,
        "extended_candidates": ext,
        "draws_used": total_draws,
        "last_draw": list(last_draw)
    }


# ==========================================================
# AI INSIGHTS ENGINE (GLOBAL / PER-BALL / COMBINED)
# ==========================================================

def ai_insights(
    mode: str = "global",
    min_num: Optional[int] = None,
    max_num: Optional[int] = None,
    last_n: Optional[int] = None,
    years: Optional[List[int]] = None
) -> Dict:

    from itertools import combinations
    from collections import defaultdict

    draws = filter_history(min_num, max_num, last_n, years)
    if not draws:
        return {"error": "No history available for AI analysis."}

    main_draws = [d["main"] for d in draws if d.get("main")]
    if not main_draws:
        return {"error": "History exists, but contains no MAIN numbers."}

    BALL_COUNT = len(main_draws[0])

    # ---------------------- GLOBAL ----------------------
    if mode == "global":
        freq = {}
        trip = {}

        for arr in main_draws:
            for n in arr:
                freq[n] = freq.get(n, 0) + 1
            for tri in combinations(arr, 3):
                tri = tuple(sorted(tri))
                trip[tri] = trip.get(tri, 0) + 1

        return {
            "mode": "global",
            "balls": freq,
            "top_triplets": sorted(trip.items(), key=lambda x: x[1], reverse=True)[:10],
            "draws_used": len(main_draws),
        }

    # ---------------------- PER-BALL ----------------------
    if mode == "per_ball":
        per = [dict() for _ in range(BALL_COUNT)]

        for arr in main_draws:
            if len(arr) != BALL_COUNT:
                continue
            for pos in range(BALL_COUNT):
                n = arr[pos]
                per[pos][n] = per[pos].get(n, 0) + 1

        out = {}

        for pos in range(BALL_COUNT):
            freq_map = per[pos]
            if not freq_map:
                continue

            sorted_nums = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)
            nums = sorted(freq_map.keys())

            hot = sorted_nums[:3]
            band = [min(x[0] for x in hot), max(x[0] for x in hot)]

            rng = [nums[0], nums[-1]]
            total = sum(freq_map.values())
            top5 = sum(x[1] for x in sorted_nums[:5])

            out[pos] = {
                "range": rng,
                "hot_band": band,
                "confidence": round(100 * top5 / total, 2),
                "freq": freq_map,
            }

        return {
            "mode": "per_ball",
            "per_ball": out,
            "draws_used": len(main_draws),
        }

    # ---------------------- COMBINED ----------------------
    if mode == "combined":
        freq = defaultdict(int)
        last_seen = {}

        for idx, arr in enumerate(main_draws):
            for n in arr:
                freq[n] += 1
                last_seen[n] = idx

        nums = sorted(freq.keys())
        if not nums:
            return {"error": "No numbers available for combined AI."}

        def norm(v, mn, mx):
            if mx == mn:
                return 0.5
            return (v - mn) / (mx - mn)

        fvals = [freq[n] for n in nums]
        fmin, fmax = min(fvals), max(fvals)

        score = {}
        total_draws = len(main_draws)

        for n in nums:
            hot = norm(freq[n], fmin, fmax)
            rarity = 1 / (1 + freq[n])
            rec = (last_seen[n] + 1) / total_draws

            score[n] = 0.4*hot + 0.3*rec + 0.3*rarity

        sorted_nums = sorted(nums, key=lambda n: score[n], reverse=True)

        out = []
        seen = set()

        for i in range(0, len(sorted_nums) - BALL_COUNT + 1):
            window = tuple(sorted(sorted_nums[i:i+BALL_COUNT]))
            if window in seen:
                continue
            seen.add(window)

            avg = sum(score[n] for n in window) / BALL_COUNT
            out.append({"combo": list(window), "score": round(avg, 3)})

            if len(out) >= 15:
                break

        return {
            "mode": "combined",
            "combos": out,
            "draws_used": len(main_draws),
        }

    return {"error": f"Unknown mode '{mode}'"}

# ==========================================================
# HEATMAP REGIONS (DYNAMIC SEGMENTS)
# ==========================================================

def _auto_segment_count(max_n: int) -> int:
    """
    Decide how many segments to use based on max number.
    """
    if max_n <= 40:
        return 5
    if max_n <= 60:
        return 6
    if max_n <= 80:
        return 7
    return 10  # very large pools


def compute_heatmap(draws, segments: int | None = None) -> Dict:
    """
    Build dynamic heatmap by splitting number range into equal segments.
    Returns segments with:
      - label: "Segment k (a-b)"
      - range: [a, b]
      - count: how many numbers fell in this range
      - score: normalized [0..1] intensity
    """

    if not draws:
        return {"error": "No history for heatmap analysis."}

    # Collect all MAIN numbers
    all_nums = []
    for d in draws:
        main = d.get("main", [])
        all_nums.extend(main)

    if not all_nums:
        return {"error": "History has no MAIN numbers for heatmap."}

    max_n = max(all_nums)
    min_n = min(all_nums)

    if max_n <= 0:
        return {"error": "Invalid number range for heatmap."}

    if segments is None:
        segments = _auto_segment_count(max_n)

    # Build ranges
    width = (max_n - min_n + 1) / segments
    ranges = []
    start = min_n

    for i in range(segments):
        end = int(round(min_n + (i + 1) * width)) - 1
        if i == segments - 1:
            end = max_n
        if end < start:
            end = start
        ranges.append((start, end))
        start = end + 1

    # Count numbers in each segment
    seg_counts = [0] * segments
    for n in all_nums:
        for i, (a, b) in enumerate(ranges):
            if a <= n <= b:
                seg_counts[i] += 1
                break

    total = sum(seg_counts)
    if total == 0:
        return {"error": "Heatmap counts are zero."}

    # Normalize to [0..1]
    max_c = max(seg_counts)
    min_c = min(seg_counts)

    def norm(v: float) -> float:
        if max_c == min_c:
            return 0.5
        return (v - min_c) / (max_c - min_c)

    segments_out = []
    for i, (a, b) in enumerate(ranges):
        count = seg_counts[i]
        score = norm(count)
        segments_out.append({
            "id": i + 1,
            "label": f"Segment {i+1} ({a}-{b})",
            "range": [a, b],
            "count": count,
            "score": round(score, 3),
        })

    return {
        "segments": segments_out,
        "total_numbers": total,
        "min_value": min_n,
        "max_value": max_n,
    }


# ==========================================================
# AI SMART TIPS (BASED ON HEATMAP)
# ==========================================================

def compute_ai_tips(draws, heatmap: Dict) -> Dict:
    """
    Produce human-readable AI tips based on heatmap data.
    """
    if "segments" not in heatmap:
        return {"tips": []}

    segments = heatmap["segments"]
    if not segments:
        return {"tips": []}

    tips: List[str] = []

    # 1) Most active segment
    hottest = max(segments, key=lambda s: s["score"])
    if hottest["score"] > 0.7:
        tips.append(
            f"{hottest['label']} is very active compared to other regions. "
            f"Numbers in this range may currently be in a 'hot' cycle."
        )

    # 2) Least active segment
    coldest = min(segments, key=lambda s: s["score"])
    if coldest["score"] < 0.3:
        tips.append(
            f"{coldest['label']} shows suppressed activity. "
            f"This region behaves as a 'cold' zone in the recent history."
        )

    # 3) Mid segments (neutral / balanced)
    middle = [s for s in segments if 0.4 <= s["score"] <= 0.6]
    if middle:
        mid_labels = ", ".join(s["label"] for s in middle[:3])
        tips.append(
            f"{mid_labels} behave as neutral or balanced regions, "
            f"without strong hot/cold bias."
        )

    # 4) Trend commentary (simple heuristic)
    # if top and bottom are far apart → strong polarization
    if hottest["score"] - coldest["score"] > 0.5:
        tips.append(
            "The distribution is polarized: some segments are clearly hot while others are cold. "
            "A mixed strategy (using both hot and neutral zones) can reduce risk."
        )

    # 5) Fallback if no tips
    if not tips:
        tips.append(
            "No strong regional anomalies detected. The number activity is relatively uniform across segments."
        )

    return {"tips": tips}


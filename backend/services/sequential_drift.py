from __future__ import annotations
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime


def _try_parse_iso_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except Exception:
        return None


def _get_ordered_draw_sets(history_rows: List[Dict[str, Any]]) -> Tuple[List[set[int]], List[Dict[str, Any]]]:
    """
    Returns:
      - list of sets of main numbers (draws ordered by time ascending if possible)
      - ordered rows (same order) for metadata / ranges
    """
    if not history_rows:
        return [], []

    # If we can parse dates for most rows -> sort by date ascending
    dated = []
    undated = []
    for r in history_rows:
        dt = _try_parse_iso_date(r.get("date"))
        if dt:
            dated.append((dt, r))
        else:
            undated.append(r)

    # If at least 70% rows have valid dates, we sort by date.
    if len(dated) >= int(0.7 * len(history_rows)):
        dated.sort(key=lambda x: x[0])
        ordered_rows = [r for _, r in dated] + undated
    else:
        # keep file order (best effort)
        ordered_rows = history_rows

    draw_sets: List[set[int]] = []
    for r in ordered_rows:
        nums = r.get("main", []) or []
        draw_sets.append(set(int(x) for x in nums if isinstance(x, int) or str(x).isdigit()))

    return draw_sets, ordered_rows


def compute_sequential_drift(
    history_rows: List[Dict[str, Any]],
    *,
    min_length: int = 3,
    last_n: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Finds directional drift chains across consecutive draws.

    Ascending example: 15 -> 16 -> 17 (across draw i, i+1, i+2)
    Descending example: 28 -> 27 -> 26

    Returns aggregated patterns with:
      - chain
      - length
      - observed (how many times seen)
      - examples (ranges of draw indices, plus dates if available)
    """
    if min_length < 3:
        min_length = 3

    draw_sets, ordered_rows = _get_ordered_draw_sets(history_rows)

    if last_n and last_n > 0 and len(draw_sets) > last_n:
        draw_sets = draw_sets[-last_n:]
        ordered_rows = ordered_rows[-last_n:]

    n = len(draw_sets)
    if n < min_length:
        return {"error": "Not enough history for sequential drift analysis."}

    # Key: (dir, chain_tuple) -> aggregated info
    agg: Dict[Tuple[int, Tuple[int, ...]], Dict[str, Any]] = {}

    def add_pattern(direction: int, chain: List[int], start_i: int, end_i: int):
        key = (direction, tuple(chain))
        if key not in agg:
            agg[key] = {
                "direction": "ascending" if direction > 0 else "descending",
                "chain": chain,
                "length": len(chain),
                "observed": 0,
                "examples": [],
            }
        agg[key]["observed"] += 1

        # include a few examples for PRO (keep small)
        if len(agg[key]["examples"]) < 5:
            start_date = ordered_rows[start_i].get("date")
            end_date = ordered_rows[end_i].get("date")
            agg[key]["examples"].append({
                "from_draw": start_i,
                "to_draw": end_i,
                "from_date": start_date,
                "to_date": end_date,
            })

    # Scan
    for i in range(0, n - min_length + 1):
        curr = draw_sets[i]
        if not curr:
            continue

        for x in curr:
            for direction in (1, -1):
                chain = [x]
                j = i + 1
                next_val = x + direction

                # Extend while consecutive draws contain the next value
                while j < n and next_val in draw_sets[j]:
                    chain.append(next_val)
                    j += 1
                    next_val += direction

                if len(chain) >= min_length:
                    add_pattern(direction, chain, i, j - 1)

    # Split and sort
    ascending = [v for (d, _), v in agg.items() if d == 1]
    descending = [v for (d, _), v in agg.items() if d == -1]

    def sort_key(p: Dict[str, Any]):
        return (p["observed"], p["length"])

    ascending.sort(key=sort_key, reverse=True)
    descending.sort(key=sort_key, reverse=True)

    return {
        "mode": "pro",
        "draws_used": n,
        "min_length": min_length,
        "ascending": ascending,
        "descending": descending,
    }


def pro_to_free_preview(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert full result into a compact FREE preview:
    - only top 1 ascending & top 1 descending
    - hide examples
    """
    if "error" in result:
        return result

    asc = result.get("ascending", [])[:1]
    desc = result.get("descending", [])[:1]

    def strip_examples(items: List[Dict[str, Any]]):
        out = []
        for it in items:
            out.append({
                "direction": it.get("direction"),
                "chain": it.get("chain"),
                "length": it.get("length"),
                "observed": it.get("observed"),
            })
        return out

    return {
        "mode": "free_preview",
        "draws_used": result.get("draws_used"),
        "min_length": result.get("min_length"),
        "ascending": strip_examples(asc),
        "descending": strip_examples(desc),
        "note": "Unlock PRO to see all drift patterns and example ranges.",
    }

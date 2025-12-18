from itertools import combinations
from services.config import (
    BALL_MIN,
    BALL_MAX,
    BALL_COUNT,
    MIN_BASE_NUMBERS,
    DEFAULT_BASE_NUMBERS
)


def has_four_in_row(combo):
    """Disallow sequences like 7,8,9,10."""
    for i in range(len(combo) - 3):
        if (
            combo[i + 1] == combo[i] + 1
            and combo[i + 2] == combo[i] + 2
            and combo[i + 3] == combo[i] + 3
        ):
            return True
    return False


def passes_global_range(combo, min_num, max_num):
    if not combo:
        return False

    for n in combo:
        if not isinstance(n, int):
            return False
        if min_num is not None and n < min_num:
            return False
        if max_num is not None and n > max_num:
            return False

    return True


def passes_per_ball_range(combo, per_ball_ranges):
    if not per_ball_ranges:
        return True

    for idx in range(min(len(combo), BALL_COUNT)):
        r = per_ball_ranges.get(idx)
        if not r:
            continue

        mn = r.get("min")
        mx = r.get("max")

        val = combo[idx]
        if mn is not None and val < mn:
            return False
        if mx is not None and val > mx:
            return False

    return True


def passes_fixed_positions(combo, fixed_positions):
    if not fixed_positions:
        return True

    for pos, allowed in fixed_positions.items():
        try:
            pos = int(pos)
        except (TypeError, ValueError):
            return False

        if pos < 0 or pos >= BALL_COUNT:
            return False

        if combo[pos] not in allowed:
            return False

    return True


def passes_forced_numbers(combo, forced_numbers):
    if not forced_numbers:
        return True

    s = set(combo)
    for n in forced_numbers:
        if n not in s:
            return False
    return True


def passes_group_limits(combo, number_to_group, group_limits):
    if not number_to_group or not group_limits:
        return True

    counts = {}
    for n in combo:
        g = number_to_group.get(n)
        if g:
            counts[g] = counts.get(g, 0) + 1

    for g, limit in group_limits.items():
        if limit is not None and counts.get(g, 0) > limit:
            return False

    return True


def generate_system(
    numbers,
    limit=None,
    fixed_positions=None,
    groups=None,
    group_limits=None,
    forced_numbers=None,
    range_mode="global",
    min_num=None,
    max_num=None,
    per_ball_ranges=None,
):
    """
    Main generator with full filtering support.
    """

       # ---------- NORMALIZE INPUT ----------

    numbers = sorted(set(numbers))

    if not numbers or len(numbers) < MIN_BASE_NUMBERS:
        numbers = DEFAULT_BASE_NUMBERS.copy()


    # per_ball_ranges: JSON keys -> int
    raw_pbr = per_ball_ranges or {}
    per_ball_ranges = {}
    for k, v in raw_pbr.items():
        try:
            per_ball_ranges[int(k)] = v
        except (TypeError, ValueError):
            continue

    # groups: {"A":[..]} -> {number:"A"}
    number_to_group = {}
    if groups:
        for label, nums in groups.items():
            if not isinstance(label, str):
                continue
            for n in nums:
                number_to_group[n] = label

    valid = []

    # ---------- GENERATION LOOP ----------

    for combo in combinations(numbers, BALL_COUNT):

        if has_four_in_row(combo):
            continue

        if range_mode == "global":
            if not passes_global_range(combo, min_num, max_num):
                continue

        if range_mode == "perball":
            if not passes_per_ball_range(combo, per_ball_ranges):
                continue

        if not passes_fixed_positions(combo, fixed_positions):
            continue

        if not passes_forced_numbers(combo, forced_numbers):
            continue

        if not passes_group_limits(combo, number_to_group, group_limits):
            continue

        valid.append(list(combo))

        if limit and len(valid) >= limit:
            break

    return {
        "count": len(valid),
        "numbers_used": numbers,
        "combinations": valid,
    }

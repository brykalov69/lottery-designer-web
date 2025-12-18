# backend/services/greedy.py
from __future__ import annotations
from itertools import combinations
from typing import List, Dict, Tuple, Iterable

from .config import BALL_COUNT


# ==========================================================
# Общие вспомогательные функции
# ==========================================================

def has_four_in_row(combo: Iterable[int]) -> bool:
    """Фильтр: запрещаем комбинации с 4 подряд идущими числами."""
    c = sorted(combo)
    for i in range(len(c) - 3):
        if (
            c[i + 1] == c[i] + 1 and
            c[i + 2] == c[i] + 2 and
            c[i + 3] == c[i] + 3
        ):
            return True
    return False


def _build_triple_universe(numbers: List[int]) -> Tuple[List[Tuple[int,int,int]], Dict[Tuple[int,int,int], int]]:
    """Вселенная троек для заданного набора чисел."""
    nums = sorted(set(numbers))
    all_triples = list(combinations(nums, 3))
    triple_index = {t: i for i, t in enumerate(all_triples)}
    return all_triples, triple_index


def _mask_for_combo(combo: Tuple[int, ...], triple_index: Dict[Tuple[int,int,int], int]) -> int:
    """Битовая маска троек, которые покрывает combo."""
    m = 0
    for tri in combinations(combo, 3):
        idx = triple_index.get(tri)
        if idx is not None:
            m |= (1 << idx)
    return m


# ==========================================================
# Classic Greedy (битмасочный)
# ==========================================================

def greedy_cover(numbers: List[int]) -> Dict:
    """
    Классический битмасочный greedy для покрытия троек C(n, BALL_COUNT, 3).
    Возвращает:
      {
        system: [[...], ...],
        system_size: int,
        coverage: float,
        triplets_total: int,
        triplets_covered: int,
        uncovered_triplets: [...]
      }
    """
    base = sorted(set(numbers))
    if len(base) < BALL_COUNT:
        return {
            "system": [],
            "system_size": 0,
            "coverage": 0.0,
            "triplets_total": 0,
            "triplets_covered": 0,
            "uncovered_triplets": [],
            "warning": f"Not enough numbers for BALL_COUNT={BALL_COUNT}"
        }

    all_triples, triple_index = _build_triple_universe(base)
    U = len(all_triples)
    if U == 0:
        return {
            "system": [],
            "system_size": 0,
            "coverage": 100.0,
            "triplets_total": 0,
            "triplets_covered": 0,
            "uncovered_triplets": []
        }

    combos = [
        c for c in combinations(base, BALL_COUNT)
        if not has_four_in_row(c)
    ]
    if not combos:
        return {
            "system": [],
            "system_size": 0,
            "coverage": 0.0,
            "triplets_total": U,
            "triplets_covered": 0,
            "uncovered_triplets": [list(t) for t in all_triples],
            "warning": "All candidate combos filtered out (4-in-row rule)."
        }

    masks = [_mask_for_combo(c, triple_index) for c in combos]

    uncovered_mask = (1 << U) - 1
    chosen: List[Tuple[int, ...]] = []

    # Жадный цикл: на каждом шаге выбираем билет с максимальным приростом
    while uncovered_mask:
        best_idx = None
        best_gain = 0

        for idx, m in enumerate(masks):
            gain = (m & uncovered_mask).bit_count()
            if gain > best_gain:
                best_gain = gain
                best_idx = idx

        if best_idx is None or best_gain == 0:
            break

        chosen.append(combos[best_idx])
        uncovered_mask &= ~masks[best_idx]

    remaining = uncovered_mask.bit_count()
    covered = U - remaining
    coverage = round(covered / U * 100, 2)

    uncovered_list: List[List[int]] = []
    if remaining > 0:
        for i, tri in enumerate(all_triples):
            if (uncovered_mask >> i) & 1:
                uncovered_list.append(list(tri))

    return {
        "system": [list(c) for c in chosen],
        "system_size": len(chosen),
        "coverage": coverage,
        "triplets_total": U,
        "triplets_covered": covered,
        "uncovered_triplets": uncovered_list
    }


# ==========================================================
# Fast Greedy v2.1 — AI-weighted, оптимизированный
# ==========================================================

def _build_rarity_weights(triple_index: Dict[Tuple[int,int,int], int],
                          combos: List[Tuple[int, ...]]) -> List[float]:
    """
    Строим rarity для каждой тройки и возвращаем веса:
    weight[i] = 1 / rarity[i]
    """
    U = len(triple_index)
    rarity = [0] * U
    for cb in combos:
        for tri in combinations(cb, 3):
            idx = triple_index.get(tri)
            if idx is not None:
                rarity[idx] += 1
    weights = [1.0 / max(r, 1) for r in rarity]
    return weights


def _ai_weight_for_mask(mask: int, weights: List[float], uncovered_mask: int) -> float:
    """
    Вес билета:
      + количество новых троек
      + бонус за редкие тройки (по weights)
    Оптимизировано: проходим только по установленным битам gained_mask.
    """
    gained = mask & uncovered_mask
    g = gained.bit_count()
    if g == 0:
        return 0.0

    rare_bonus = 0.0
    x = gained
    while x:
        lsb = x & -x
        idx = lsb.bit_length() - 1
        rare_bonus += weights[idx]
        x ^= lsb

    return g + rare_bonus


def fast_greedy_v2(
        numbers: List[int],
        triple_index,
        all_triples,
        attempts: int = 8,
        sample_size: int = 2000
    ) -> Dict:
    """
    Быстрый greedy с AI-весами и семплированием.
    ВАЖНО: реально имеет смысл для больших пулов (30+ чисел).
    На малых пулах Classic обычно лучше и быстрее.
    """
    import random

    base = sorted(set(numbers))

    combos = [
        c for c in combinations(base, BALL_COUNT)
        if not has_four_in_row(c)
    ]
    if not combos:
        return {
            "system": [],
            "system_size": 0,
            "coverage": 0.0,
            "attempts": attempts,
            "sample_size": sample_size,
            "warning": "All combos filtered out."
        }

    masks = [_mask_for_combo(c, triple_index) for c in combos]
    weights = _build_rarity_weights(triple_index, combos)

    U = len(all_triples)
    best_result = None

    total_candidates = len(combos)
    sample_size = min(sample_size, total_candidates)

    for attempt in range(attempts):
        # Начальное рейтинговое упорядочивание (по всей вселенной)
        uncovered_mask = (1 << U) - 1
        scored_indices = []
        for idx, m in enumerate(masks):
            sc = _ai_weight_for_mask(m, weights, uncovered_mask)
            scored_indices.append((sc, idx))

        scored_indices.sort(key=lambda x: x[0], reverse=True)

        # Семплирование: половина лучших + половина случайных
        top_cut = max(50, sample_size // 2)
        top_cut = min(top_cut, sample_size, len(scored_indices))

        top_part = [idx for _, idx in scored_indices[:top_cut]]
        remaining_indices = [idx for _, idx in scored_indices[top_cut:]]

        random_part_count = sample_size - len(top_part)
        if remaining_indices and random_part_count > 0:
            random_part = random.sample(remaining_indices, min(random_part_count, len(remaining_indices)))
        else:
            random_part = []

        sampled_idx = top_part + random_part

        s_masks = [masks[i] for i in sampled_idx]

        # Greedy цикл по сэмплу
        uncovered_mask = (1 << U) - 1
        chosen_idxs: List[int] = []

        while uncovered_mask:
            best_local_idx = None
            best_score = 0.0

            for local_idx, m in enumerate(s_masks):
                sc = _ai_weight_for_mask(m, weights, uncovered_mask)
                if sc > best_score:
                    best_score = sc
                    best_local_idx = local_idx

            if best_local_idx is None or best_score <= 0:
                break

            chosen_idxs.append(sampled_idx[best_local_idx])
            uncovered_mask &= ~s_masks[best_local_idx]

        remaining = uncovered_mask.bit_count()
        covered = U - remaining
        coverage = round(covered / U * 100, 2)

        chosen_combos = [combos[i] for i in chosen_idxs]

        result = {
            "system": [list(c) for c in chosen_combos],
            "system_size": len(chosen_combos),
            "coverage": coverage,
            "attempt": attempt + 1,
            "sample_size": sample_size,
        }

        if best_result is None:
            best_result = result
        else:
            if result["coverage"] > best_result["coverage"]:
                best_result = result
            elif (
                result["coverage"] == best_result["coverage"] and
                result["system_size"] < best_result["system_size"]
            ):
                best_result = result

    return {
        "system": best_result["system"],
        "system_size": best_result["system_size"],
        "coverage": best_result["coverage"],
        "attempts": attempts,
        "sample_size": sample_size,
        "triplets_total": U,
        "triplets_covered": int(best_result["coverage"] / 100 * U),
        "uncovered_triplets": []
    }


# ==========================================================
# Hybrid Greedy — постоптимизация Classic
# ==========================================================

def hybrid_greedy(numbers: List[int]) -> Dict:
    """
    Hybrid режим:
      1) строим систему Classic greedy_cover()
      2) пытаемся уменьшить её, поочередно выбрасывая билеты,
         если при этом сохраняется 100% покрытие троек.
    Гарантия: количество билетов НЕ увеличится, coverage не уменьшится.
    """
    base_res = greedy_cover(numbers)
    if base_res.get("coverage", 0.0) < 99.9:
        # Classic не дал полного покрытия — оптимизировать нечего
        return base_res

    base = sorted(set(numbers))
    all_triples, triple_index = _build_triple_universe(base)
    U = len(all_triples)
    full_mask_target = (1 << U) - 1

    combos = [tuple(c) for c in base_res["system"]]
    if not combos:
        return base_res

    masks = [_mask_for_combo(c, triple_index) for c in combos]

    # текущий список индексов билетов в системе
    active_indices = list(range(len(combos)))

    # Перебираем билеты и пробуем выбросить "слабые"
    changed = True
    while changed:
        changed = False
        # Проходим по копии списка, чтобы можно было модифицировать active_indices
        for idx in list(active_indices):
            # пробуем удалить этот билет
            other_indices = [i for i in active_indices if i != idx]
            if not other_indices:
                continue

            mask_without = 0
            for j in other_indices:
                mask_without |= masks[j]

            if mask_without == full_mask_target:
                # удаляем билет из системы
                active_indices.remove(idx)
                changed = True
                # обновляем целевой full_mask_target на случай,
                # если по какой-то причине он был "избыточным"
                full_mask_target = mask_without
                break  # начать цикл сначала с обновленным списком

    reduced_combos = [list(combos[i]) for i in active_indices]

    return {
        "system": reduced_combos,
        "system_size": len(reduced_combos),
        "coverage": 100.0,
        "triplets_total": U,
        "triplets_covered": U,
        "uncovered_triplets": []
    }


# ==========================================================
# Унифицированная точка входа для API
# ==========================================================

def greedy_entry(
    numbers: List[int],
    mode: str = "classic",
    attempts: int = 5,
    sample_size: int = 2000
) -> Dict:

    base = sorted(set(numbers))
    all_triples, triple_index = _build_triple_universe(base)

    # На небольших пулах fast-режим не даёт выигрыш, а может быть медленнее.
    # Поэтому принудительно переключаем на classic, если пул маленький.
    if mode == "fast" and len(base) <= 15:
        mode = "classic"

    if mode == "classic":
        return greedy_cover(numbers)

    if mode == "fast":
        return fast_greedy_v2(
            numbers=numbers,
            triple_index=triple_index,
            all_triples=all_triples,
            attempts=attempts,
            sample_size=sample_size
        )

    if mode == "hybrid":
        return hybrid_greedy(numbers)

    return {"error": f"Unknown mode: {mode}"}

# ==========================================================
# API WRAPPER (for FastAPI)
# ==========================================================

def run_greedy(
    numbers: List[int],
    mode: str = "classic",
    attempts: int = 5,
    sample_size: int = 2000
) -> Dict:
    """
    Thin API wrapper for FastAPI.
    """
    return greedy_entry(
        numbers=numbers,
        mode=mode,
        attempts=attempts,
        sample_size=sample_size
    )


# parser_excel.py

from __future__ import annotations
from typing import List, Dict
from io import BytesIO
import re
import openpyxl
from datetime import datetime

from services.parser import try_parse_date, split_main_extra


def parse_excel_history(
    binary_content: bytes,
    main_count: int,
    extra_count: int
) -> List[Dict]:
    wb = openpyxl.load_workbook(BytesIO(binary_content), data_only=True)
    sheet = wb.active

    out: List[Dict] = []

    for row in sheet.iter_rows(values_only=True):
        if not row:
            continue

        # Convert row to string cells
        cells = [str(v).strip() if v is not None else "" for v in row]
        row_text = " ".join(cells).lower()

        # Skip non-draw / metadata rows
        if any(k in row_text for k in (
            "double draw",
            "double",
            "powerplay",
            "power play",
            "multiplier",
            "bonus",
        )):
            continue

        if cells[0].lower().startswith(("date", "draw", "drawdate")):
            continue

        # ---- DATE ----
        date = None
        year = None

        if isinstance(row[0], datetime):
            date = row[0].strftime("%Y-%m-%d")
            year = row[0].year
        else:
            d, y = try_parse_date(cells[0])
            if d:
                date = d
                year = y

        if not date:
            continue

        # ---- COLLECT RAW NUMBERS ----
        nums: List[int] = []
        for c in cells[1:]:
            if re.fullmatch(r"\d+", c):
                n = int(c)
                if n < 100:
                    nums.append(n)
            else:
                for f in re.findall(r"\d+", c):
                    n = int(f)
                    if n < 100:
                        nums.append(n)

        # Need at least main_count numbers
        if len(nums) < main_count:
            continue

        # 👇 REAL raw count BEFORE any cleanup
        raw_count = len(nums)

        # Remove duplicates but keep order
        nums = list(dict.fromkeys(nums))

        # Split main / extra (extra optional)
        main, extra = split_main_extra(nums, main_count, extra_count)

        # Must have full main balls
        if len(main) != main_count:
            continue

        out.append({
            "date": date,
            "year": year,
            "main": sorted(main),
            "extra": sorted(extra),
            "_raw_count": raw_count,   # 🔑 BEFORE trimming
        })

    return out

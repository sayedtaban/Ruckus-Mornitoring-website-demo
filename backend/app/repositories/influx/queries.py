from __future__ import annotations

from typing import Iterable


def build_filter_clause(filters: Iterable[str] | None) -> str:
    if not filters:
        return ""
    return "\n  " + "\n  ".join(filters)


def build_row_key(row_keys: Iterable[str] | None) -> str:
    keys = list(row_keys or ["_time"])
    return "[" + ",".join(f'"{key}"' for key in keys) + "]"


def build_pivot_query(
    bucket: str,
    measurement: str,
    *,
    range_: str = "-1h",
    filters: Iterable[str] | None = None,
    row_keys: Iterable[str] | None = None,
) -> str:
    filter_clause = build_filter_clause(filters)
    row_key_str = build_row_key(row_keys)
    return f"""
from(bucket: "{bucket}")
  |> range(start: {range_})
  |> filter(fn: (r) => r["_measurement"] == "{measurement}"){filter_clause}
  |> last()
  |> pivot(rowKey: {row_key_str}, columnKey: ["_field"], valueColumn: "_value")
"""


def build_raw_query(
    bucket: str,
    measurement: str,
    *,
    range_: str = "-24h",
    filters: Iterable[str] | None = None,
) -> str:
    filter_clause = build_filter_clause(filters)
    return f"""
from(bucket: "{bucket}")
  |> range(start: {range_})
  |> filter(fn: (r) => r["_measurement"] == "{measurement}"){filter_clause}
"""

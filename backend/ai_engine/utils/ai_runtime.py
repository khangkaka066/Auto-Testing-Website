import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar


T = TypeVar("T")


def get_max_workers(default: int = 4) -> int:
    raw_value = os.getenv("AI_MAX_WORKERS", str(default))
    try:
        return max(1, int(raw_value))
    except ValueError:
        return default


def is_cache_enabled() -> bool:
    return os.getenv("AI_CACHE_ENABLED", "true").strip().lower() not in {"0", "false", "no", "off"}


def get_retry_count(default: int = 3) -> int:
    raw_value = os.getenv("AI_RETRY_COUNT", str(default))
    try:
        return max(1, int(raw_value))
    except ValueError:
        return default


def stable_hash(data: Any) -> str:
    if isinstance(data, str):
        raw = data
    else:
        raw = json.dumps(data, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def read_cache(cache_dir: str | Path, key: str) -> Optional[dict]:
    if not is_cache_enabled():
        return None

    cache_path = Path(cache_dir) / f"{key}.json"
    if not cache_path.exists():
        return None

    try:
        return json.loads(cache_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def write_cache(cache_dir: str | Path, key: str, data: dict) -> None:
    if not is_cache_enabled():
        return

    cache_path = Path(cache_dir)
    cache_path.mkdir(parents=True, exist_ok=True)
    (cache_path / f"{key}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=4),
        encoding="utf-8",
    )


def retry_call(fn: Callable[[], T], retries: Optional[int] = None, base_delay: float = 1.0) -> T:
    max_retries = retries or get_retry_count()
    last_error: Exception | None = None

    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as exc:
            last_error = exc
            if attempt == max_retries - 1:
                break
            time.sleep(base_delay * (2 ** attempt))

    raise last_error  # type: ignore[misc]

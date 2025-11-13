from __future__ import annotations

import asyncio
from typing import Optional

try:
    from influxdb_client import InfluxDBClient
    from influxdb_client.rest import ApiException
except ImportError as exc:  # pragma: no cover - handled at runtime
    InfluxDBClient = None  # type: ignore
    ApiException = None  # type: ignore
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class AsyncQueryClient:
    """Wrapper around InfluxDBClient that runs queries off the event loop."""

    def __init__(
        self,
        *,
        url: str,
        token: str,
        org: str,
        client: Optional[InfluxDBClient] = None,
    ) -> None:
        if InfluxDBClient is None:
            raise RuntimeError(
                "The 'influxdb-client' package is required but could not be "
                f"imported. Original error: {_IMPORT_ERROR}"
            )
        self._client = client or InfluxDBClient(
            url=url,
            token=token,
            org=org,
            timeout=60000,
        )
        self._query_api = self._client.query_api()

    async def query(self, flux: str):
        """Run the query in a worker thread and return the raw tables."""
        try:
            return await asyncio.to_thread(self._query_api.query, query=flux)
        except ApiException as exc:  # pragma: no cover - depends on InfluxDB
            message = getattr(exc, "body", "") or getattr(exc, "message", "")
            if isinstance(message, bytes):
                message = message.decode("utf-8", errors="ignore")

            normalized = str(message).replace('\\"', '"')
            if 'no column "_value" exists' in normalized:
                # Pivot fails when there are no points in the time range.
                return []

            raise

"""
http_utils.py — Shared exponential-backoff HTTP utility for the worker.

All outbound HTTP calls in the worker (target-site fetches via httpx,
SERP API calls, LLM API calls) should route through `fetch_with_retry`
so that transient network errors, rate-limit responses (429), and
server errors (5xx) are handled uniformly.

Retry policy
------------
  max_retries : int  — number of additional attempts after the first failure
  base_delay  : float — seconds for the first back-off sleep (doubles each attempt)
  max_delay   : float — cap on the sleep so exponential growth stays sane

Back-off schedule (base_delay=1.0, max_delay=30.0):
  attempt 1 → sleep 1 s
  attempt 2 → sleep 2 s
  attempt 3 → sleep 4 s
  attempt 4 → sleep 8 s
  attempt 5 → sleep 16 s
  attempt 6+ → sleep 30 s  (capped)

Retryable conditions
--------------------
  - httpx.TransportError  (connect refused, DNS, TLS, read timeout)
  - httpx.TimeoutException
  - HTTP 429 Too Many Requests
  - HTTP 5xx Server Error
  - HTTP 408 Request Timeout

Non-retryable (raised immediately)
------------------------------------
  - HTTP 4xx except 408 / 429 (client error — retrying won't help)
"""

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# HTTP status codes that warrant a retry
_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


async def fetch_with_retry(
    method: str,
    url: str,
    *,
    max_retries: int = 4,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    timeout: float = 20.0,
    log_context: str = "",
    **kwargs: Any,
) -> httpx.Response:
    """
    Perform an async HTTP request with exponential back-off retries.

    Parameters
    ----------
    method       : HTTP verb ("GET", "POST", …)
    url          : Target URL
    max_retries  : Maximum number of retries (not counting the first attempt)
    base_delay   : Initial sleep duration in seconds (doubles each retry)
    max_delay    : Upper bound on sleep duration in seconds
    timeout      : Per-request timeout in seconds
    log_context  : Optional label for log messages (e.g. "LLM", "SERP")
    **kwargs     : Forwarded to httpx.AsyncClient.request() (headers, json, params…)

    Returns
    -------
    httpx.Response on success

    Raises
    ------
    httpx.HTTPStatusError   if a non-retryable 4xx is received
    httpx.TransportError    if all retries are exhausted on a network error
    RuntimeError            if all retries are exhausted on a retryable status
    """
    prefix = f"[HTTP{f':{log_context}' if log_context else ''}]"
    last_exc: Exception | None = None

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for attempt in range(max_retries + 1):
            try:
                response = await client.request(method, url, **kwargs)

                # Non-retryable client error → raise immediately
                if response.status_code >= 400 and response.status_code not in _RETRYABLE_STATUS_CODES:
                    response.raise_for_status()

                # Retryable server/rate-limit response
                if response.status_code in _RETRYABLE_STATUS_CODES:
                    raise httpx.HTTPStatusError(
                        f"Retryable HTTP {response.status_code}",
                        request=response.request,
                        response=response,
                    )

                return response

            except (httpx.TransportError, httpx.TimeoutException, httpx.HTTPStatusError) as exc:
                last_exc = exc
                if attempt < max_retries:
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    logger.warning(
                        "%s Attempt %d/%d failed for %s: %s — retrying in %.1fs",
                        prefix, attempt + 1, max_retries + 1, url, exc, delay
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        "%s All %d attempts failed for %s: %s",
                        prefix, max_retries + 1, url, exc
                    )

    raise RuntimeError(
        f"{prefix} Exhausted {max_retries + 1} attempts for {url}: {last_exc}"
    )

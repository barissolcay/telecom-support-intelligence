from typing import Any

import httpx


def build_hybrid_query(
    dense_vector: list[float],
    sparse_indices: list[int],
    sparse_values: list[float],
    *,
    product: str,
    region: str | None = None,
    resolved_only: bool = True,
    limit: int = 20,
) -> dict[str, Any]:
    must: list[dict[str, Any]] = [{"key": "product", "match": {"value": product}}]
    if region:
        must.append({"key": "region", "match": {"value": region}})
    if resolved_only:
        must.append({"key": "outcome", "match": {"value": "resolved"}})
    retrieval_filter = {"must": must}
    return {
        "prefetch": [
            {"query": dense_vector, "using": "dense", "filter": retrieval_filter, "limit": limit},
            {
                "query": {"indices": sparse_indices, "values": sparse_values},
                "using": "sparse",
                "filter": retrieval_filter,
                "limit": limit,
            },
        ],
        "query": {"fusion": "rrf"},
        "limit": min(5, limit),
        "with_payload": True,
    }


class QdrantHybridClient:
    def __init__(self, base_url: str, collection: str, timeout_seconds: float = 3.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.collection = collection
        self.timeout = httpx.Timeout(timeout_seconds)

    async def query(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        url = f"{self.base_url}/collections/{self.collection}/points/query"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        return response.json().get("result", {}).get("points", [])

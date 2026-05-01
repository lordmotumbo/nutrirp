from fastapi import APIRouter, Depends, Query
from typing import List
import unicodedata
import httpx
from app.data.alimentos_taco import TACO
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/foods", tags=["Alimentos"])


def _normalize(text: str) -> str:
    """Remove acentos e converte para minúsculas para busca fuzzy."""
    return unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode().lower()


@router.get("/search")
async def search_foods(
    q: str = Query(..., min_length=2),
    limit: int = Query(15, le=30),
    current_user: User = Depends(get_current_user),
):
    """
    Busca alimentos por nome.
    1. Primeiro busca na tabela TACO local (PT-BR).
    2. Se encontrar menos de 5 resultados, complementa com USDA FoodData Central.
    """
    q_norm = _normalize(q)

    # ── 1. Busca local TACO ──────────────────────────────────────────
    local_results = [
        {
            "nome": item["nome"],
            "kcal": item["kcal"],
            "prot": item["prot"],
            "carb": item["carb"],
            "gord": item["gord"],
            "fibra": item.get("fibra", 0),
            "fonte": "TACO",
            "porcao": "100g",
        }
        for item in TACO
        if q_norm in _normalize(item["nome"])
    ]

    # Ordenar: começa com a query primeiro, depois contém
    local_results.sort(key=lambda x: (not _normalize(x["nome"]).startswith(q_norm), x["nome"]))
    local_results = local_results[:limit]

    # ── 2. Complementar com USDA se poucos resultados locais ─────────
    if len(local_results) < 5:
        try:
            usda_results = await _search_usda(q, limit - len(local_results))
            # Evitar duplicatas pelo nome normalizado
            local_names = {_normalize(r["nome"]) for r in local_results}
            for item in usda_results:
                if _normalize(item["nome"]) not in local_names:
                    local_results.append(item)
        except Exception:
            pass  # USDA indisponível — retorna só TACO

    return local_results[:limit]


async def _search_usda(query: str, limit: int = 10) -> list:
    """Busca na USDA FoodData Central (API pública, sem chave necessária para DEMO_KEY)."""
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "query": query,
        "pageSize": min(limit * 2, 20),
        "api_key": "DEMO_KEY",
        "dataType": "SR Legacy,Foundation",  # dados mais confiáveis
    }

    NUTRIENT_MAP = {
        "Energy": "kcal",
        "Protein": "prot",
        "Carbohydrate, by difference": "carb",
        "Total lipid (fat)": "gord",
        "Fiber, total dietary": "fibra",
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for food in data.get("foods", []):
        nuts = {n["nutrientName"]: n["value"] for n in food.get("foodNutrients", [])}
        item = {
            "nome": food.get("description", "").title(),
            "kcal": round(nuts.get("Energy", 0), 1),
            "prot": round(nuts.get("Protein", 0), 1),
            "carb": round(nuts.get("Carbohydrate, by difference", 0), 1),
            "gord": round(nuts.get("Total lipid (fat)", 0), 1),
            "fibra": round(nuts.get("Fiber, total dietary", 0), 1),
            "fonte": "USDA",
            "porcao": "100g",
        }
        if item["kcal"] > 0:
            results.append(item)

    return results[:limit]

"""
Material search and ranking engine.

Replaces the naive max() selection with proximity-based scoring that actually
matches what the user asked for.
"""

import math

from app.data.materials import MATERIALS
from app.services.query_parser import ParsedQuery


def search_materials(query: ParsedQuery, top_n: int = 5) -> list[dict]:
    """
    Search the materials database and return the best candidates
    ranked by how well they match the parsed query.

    Scoring approach:
    - Property targets: scored by proximity (closer = better) or direction
    - Category match: binary bonus
    - Application match: scored by keyword overlap
    - Constraints: hard filters (toxic, cost) applied before scoring
    """
    candidates = list(MATERIALS)

    # --- Hard filters ---
    if query.exclude_toxic:
        candidates = [m for m in candidates if not m.get("toxic", False)]

    if query.max_cost_per_kg is not None:
        candidates = [m for m in candidates if m["cost_per_kg"] <= query.max_cost_per_kg]

    if query.material_categories:
        category_matches = [
            m for m in candidates if m["category"] in query.material_categories
        ]
        # If we have category matches, prefer them; otherwise fall back to all
        if category_matches:
            candidates = category_matches

    # --- Score each candidate ---
    scored = []
    for mat in candidates:
        score = _score_material(mat, query)
        scored.append((mat, score))

    # Sort by score descending (higher = better match)
    scored.sort(key=lambda x: x[1], reverse=True)

    # Return top N with scores attached
    results = []
    for mat, score in scored[:top_n]:
        result = dict(mat)
        result["match_score"] = round(score, 4)
        results.append(result)

    return results


def _score_material(material: dict, query: ParsedQuery) -> float:
    """Score a material against the parsed query. Higher = better match."""
    score = 0.0
    max_possible = 0.0

    # --- Property target scoring (most important) ---
    for target in query.target_properties:
        prop_name = target.property_name
        if prop_name not in material:
            continue

        actual_value = material[prop_name]
        weight = target.weight
        max_possible += weight

        if target.direction == "closest" and target.target_value is not None:
            # Score by proximity: 1.0 = exact match, decays with distance
            prop_score = _proximity_score(actual_value, target.target_value)
            score += prop_score * weight

        elif target.direction == "above" and target.target_value is not None:
            if actual_value >= target.target_value:
                # Bonus for meeting threshold, slight preference for closer values
                over_ratio = actual_value / target.target_value if target.target_value > 0 else 1.0
                # Score decays if way over target (prefer closer matches)
                prop_score = 1.0 / (1.0 + 0.1 * max(0, over_ratio - 1.0))
                score += prop_score * weight
            else:
                # Penalty proportional to how far below
                shortfall = 1.0 - (actual_value / target.target_value) if target.target_value > 0 else 1.0
                score += max(0, 0.3 * (1.0 - shortfall)) * weight

        elif target.direction == "below" and target.target_value is not None:
            if actual_value <= target.target_value:
                under_ratio = actual_value / target.target_value if target.target_value > 0 else 0
                prop_score = 0.5 + 0.5 * (1.0 - under_ratio)
                score += prop_score * weight
            else:
                excess = (actual_value / target.target_value - 1.0) if target.target_value > 0 else 1.0
                score += max(0, 0.3 * (1.0 - excess)) * weight

        elif target.direction == "maximize":
            # Normalize across the range of this property in all materials
            all_values = [m[prop_name] for m in MATERIALS if prop_name in m]
            min_val, max_val = min(all_values), max(all_values)
            if max_val > min_val:
                normalized = (actual_value - min_val) / (max_val - min_val)
            else:
                normalized = 0.5
            score += normalized * weight

        elif target.direction == "minimize":
            all_values = [m[prop_name] for m in MATERIALS if prop_name in m]
            min_val, max_val = min(all_values), max(all_values)
            if max_val > min_val:
                normalized = 1.0 - (actual_value - min_val) / (max_val - min_val)
            else:
                normalized = 0.5
            score += normalized * weight

    # --- Application keyword matching ---
    if query.application_keywords:
        app_weight = 0.5
        max_possible += app_weight
        mat_apps = " ".join(material.get("applications", [])).lower()
        mat_name = material.get("name", "").lower()
        matched = sum(
            1 for kw in query.application_keywords
            if kw.lower() in mat_apps or kw.lower() in mat_name
        )
        if query.application_keywords:
            app_score = matched / len(query.application_keywords)
            score += app_score * app_weight

    # --- Stability bonus (slight preference for more stable materials) ---
    stability_weight = 0.1
    max_possible += stability_weight
    score += material.get("stability_score", 0.5) * stability_weight

    # Normalize to 0-1 range
    if max_possible > 0:
        score = score / max_possible

    return score


def _proximity_score(actual: float, target: float) -> float:
    """
    Score how close an actual value is to a target value.
    Returns 1.0 for exact match, decays smoothly with distance.

    Uses a Gaussian-like decay relative to the target magnitude,
    so a 10% deviation has the same score regardless of absolute scale.
    """
    if target == 0:
        # Avoid division by zero; use absolute distance
        return 1.0 / (1.0 + abs(actual))

    # Relative error (how far off as a fraction of target)
    relative_error = abs(actual - target) / abs(target)

    # Gaussian decay: sigma=0.3 means 30% off gets ~0.57, 100% off gets ~0.04
    return math.exp(-0.5 * (relative_error / 0.3) ** 2)

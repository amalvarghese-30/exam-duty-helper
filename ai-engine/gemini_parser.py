import json
import os
import re
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
_gemini_rules_available = True


def _extract_max_duties_per_day(rule_text):
    text = (rule_text or "").lower()
    patterns = [
        r"max(?:imum)?\s*(\d+)\s*dut(?:y|ies)\s*(?:per|/)?\s*day",
        r"up\s*to\s*(\d+)\s*dut(?:y|ies)\s*(?:per|/)?\s*day",
        r"(\d+)\s*dut(?:y|ies)\s*(?:per|/)?\s*day",
        r"(\d+)\s*dut(?:y|ies)\s*/\s*day",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                value = int(match.group(1))
                if value >= 1:
                    return value
            except (TypeError, ValueError):
                pass
    return None


def _extract_excluded_teachers(rule_text):
    text = rule_text or ""
    lowered = text.lower()
    excludes = []

    # Examples handled:
    # - exclude shreyash bansod
    # - do not assign shreyash bansod
    # - no duties for shreyash bansod
    patterns = [
        r"exclude\s+([a-zA-Z][a-zA-Z\s\.]{1,80})",
        r"do\s+not\s+assign\s+([a-zA-Z][a-zA-Z\s\.]{1,80})",
        r"no\s+duties\s+for\s+([a-zA-Z][a-zA-Z\s\.]{1,80})",
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, lowered):
            candidate = match.group(1)
            # Trim at common separators so we keep only the name segment.
            candidate = re.split(r"[,.;\n]|\s+from\s+|\s+for\s+", candidate)[0].strip()
            if candidate and candidate not in excludes:
                excludes.append(candidate)

    return excludes


def _build_local_constraints(rule_text):
    text = (rule_text or "").lower()
    max_per_day = _extract_max_duties_per_day(rule_text) or 1
    excluded = _extract_excluded_teachers(rule_text)

    avoid_own_subject = True
    if "allow own subject" in text or "can invigilate own subject" in text:
        avoid_own_subject = False

    equalize_workload = True
    if "do not equalize" in text or "no workload balancing" in text:
        equalize_workload = False

    ignore_leave_status = False
    if "ignore leave" in text or "ignore availability" in text:
        ignore_leave_status = True

    return {
        "avoid_own_subject": avoid_own_subject,
        "max_duties_per_day": max_per_day,
        "equalize_workload": equalize_workload,
        "ignore_leave_status": ignore_leave_status,
        "custom_restrictions": "",
        "excluded_teachers": excluded,
    }


def _is_quota_or_auth_error(error):
    message = str(error).lower()
    return (
        "resource_exhausted" in message
        or "quota" in message
        or "429" in message
        or "invalid api key" in message
        or "permission denied" in message
    )

def parse_rules(rule_text):
    global _gemini_rules_available

    local_constraints = _build_local_constraints(rule_text)

    if not os.getenv("GEMINI_API_KEY") or not _gemini_rules_available:
        return local_constraints

    prompt = f"""
    You are a Logic Engine. Convert the following human rules into a JSON configuration for a scheduling algorithm.
    
    Rules provided:
    {rule_text}

    Return ONLY a JSON object with this exact structure:
    {{
      "avoid_own_subject": boolean,
      "max_duties_per_day": int,
      "equalize_workload": boolean,
            "ignore_leave_status": boolean,
            "custom_restrictions": "string containing any specific names, departments, or unique constraints mentioned",
            "excluded_teachers": ["array of explicit teacher names to exclude, if any"]
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(text)
        if "custom_restrictions" not in data:
            data["custom_restrictions"] = ""
        if "excluded_teachers" not in data or not isinstance(data.get("excluded_teachers"), list):
            data["excluded_teachers"] = []

        # Start from local deterministic values, then optionally enrich from model.
        merged = {
            **local_constraints,
            **{k: v for k, v in data.items() if k in local_constraints or k == "custom_restrictions"},
        }

        # Normalize exclusions list.
        merged_exclusions = [
            str(name).strip()
            for name in merged.get("excluded_teachers", [])
            if str(name).strip()
        ]

        # Deterministic guardrails so policy works even when model extraction is imperfect.
        extracted_max = _extract_max_duties_per_day(rule_text)
        if extracted_max is not None:
            merged["max_duties_per_day"] = extracted_max

        extracted_exclusions = _extract_excluded_teachers(rule_text)
        if extracted_exclusions:
            existing = [name.lower() for name in merged_exclusions]
            for name in extracted_exclusions:
                if name.lower() not in existing:
                    merged_exclusions.append(name)
                    existing.append(name.lower())

        merged["excluded_teachers"] = merged_exclusions
        return merged
    except Exception as error:
        if _is_quota_or_auth_error(error):
            # Disable remote parsing for current process to avoid repeated retry delays.
            _gemini_rules_available = False
        return local_constraints
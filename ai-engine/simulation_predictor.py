"""
Simulation Predictor - Uses Gemini AI to forecast allocation risks
Provides predictive analytics for what-if scenarios
"""

import google.genai as genai
import os
from dotenv import load_dotenv
import json
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Gemini client
try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_AVAILABLE = True
except Exception as e:
    logger.warning(f"Gemini not available: {e}")
    GEMINI_AVAILABLE = False


def predict_risk(simulation_data: dict) -> dict:
    """
    Predict fairness risks and overload probability for a simulation
    
    Args:
        simulation_data: Allocation simulation data
        
    Returns:
        Dict with risk prediction and recommendations
    """
    if not GEMINI_AVAILABLE:
        return {
            "risk_level": "unknown",
            "overload_probability": 0.5,
            "recommendations": ["Gemini API not available"],
            "confidence": 0.0
        }
    
    try:
        # Extract key metrics from simulation data
        stats = simulation_data.get("statistics", {})
        workload_stats = stats.get("workload_statistics", {})
        
        prompt = f"""
Analyze this exam duty allocation simulation and predict risks:

Current Allocation Statistics:
- Total Exams: {stats.get('total_exams', 0)}
- Allocated Exams: {stats.get('allocated_exams', 0)}
- Success Rate: {stats.get('success_rate_percent', 0)}%
- Mean Workload: {workload_stats.get('mean', 0)}
- Workload Std Dev: {workload_stats.get('std_dev', 0)}
- Min/Max Duties: {workload_stats.get('min', 0)} / {workload_stats.get('max', 0)}

Unallocated Exams: {len(simulation_data.get('unallocated_exams', []))}
Conflicts Detected: {len(simulation_data.get('conflicts', []))}

Predict:
1. Overload probability (0-100%)
2. Risk level (low/medium/high/critical)
3. Main risk factors (2-3)
4. Mitigation recommendations (2-3)

Return as JSON:
{{
    "overload_probability": number,
    "risk_level": string,
    "risk_factors": [string],
    "recommendations": [string],
    "confidence_score": number
}}
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        # Parse JSON from response
        text = response.text.strip()
        # Extract JSON from markdown if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        result = json.loads(text)
        
        return {
            "overload_probability": result.get("overload_probability", 50),
            "risk_level": result.get("risk_level", "medium"),
            "risk_factors": result.get("risk_factors", []),
            "recommendations": result.get("recommendations", []),
            "confidence_score": result.get("confidence_score", 0.7)
        }
        
    except Exception as e:
        logger.error(f"Risk prediction failed: {e}")
        return {
            "risk_level": "unknown",
            "overload_probability": 50,
            "recommendations": ["Failed to generate prediction"],
            "confidence": 0.0,
            "error": str(e)
        }


def compare_scenarios(baseline: dict, proposed: dict) -> dict:
    """
    Compare two allocation scenarios and predict which is better
    
    Args:
        baseline: Current allocation
        proposed: Simulated allocation
        
    Returns:
        Comparison analysis with recommendation
    """
    if not GEMINI_AVAILABLE:
        return {
            "better_scenario": "unknown",
            "improvement_potential": 0,
            "analysis": "Gemini not available"
        }
    
    try:
        prompt = f"""
Compare these two exam duty allocation scenarios:

BASELINE SCENARIO:
- Allocated: {baseline.get('statistics', {}).get('allocated_exams', 0)}/{baseline.get('statistics', {}).get('total_exams', 0)}
- Success Rate: {baseline.get('statistics', {}).get('success_rate_percent', 0)}%
- Mean Workload: {baseline.get('statistics', {}).get('workload_statistics', {}).get('mean', 0)}
- Std Dev: {baseline.get('statistics', {}).get('workload_statistics', {}).get('std_dev', 0)}

PROPOSED SCENARIO:
- Allocated: {proposed.get('statistics', {}).get('allocated_exams', 0)}/{proposed.get('statistics', {}).get('total_exams', 0)}
- Success Rate: {proposed.get('statistics', {}).get('success_rate_percent', 0)}%
- Mean Workload: {proposed.get('statistics', {}).get('workload_statistics', {}).get('mean', 0)}
- Std Dev: {proposed.get('statistics', {}).get('workload_statistics', {}).get('std_dev', 0)}

Return JSON:
{{
    "better_scenario": "baseline|proposed|similar",
    "improvement_potential": number (percentage),
    "key_differences": [string],
    "recommendation": string
}}
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        return json.loads(text)
        
    except Exception as e:
        logger.error(f"Scenario comparison failed: {e}")
        return {
            "better_scenario": "unknown",
            "improvement_potential": 0,
            "analysis": f"Comparison failed: {e}"
        }
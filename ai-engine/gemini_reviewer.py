"""
Gemini Fairness Reviewer (Phase 2)
AI-powered analysis of allocation fairness and explainability.

NOT direct assignment (unsuitable for LLM), but:
- Pattern detection in overload/underload
- Swap suggestion rationale
- Fairness improvement explanations
- Conflict resolution strategies

Integration point: After allocation → Before user approval
"""

from typing import List, Dict, Any, Optional
import logging
import json

logger = logging.getLogger(__name__)

try:
    import google.genai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning(
        "Google Generative AI not installed. "
        "Install with: pip install google-genai"
    )


class GeminiFairnessReviewer:
    """
    Uses Gemini AI to review and explain allocation fairness.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
    ):
        """
        Args:
            api_key: Google API key for Gemini (default: from GOOGLE_API_KEY env var)
        """
        self.api_key = api_key
        self.model = None
        
        if GEMINI_AVAILABLE:
            if api_key:
                genai.configure(api_key=api_key)
            try:
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                logger.info("✅ Gemini model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load Gemini model: {e}")
                self.model = None

    def review_allocation_fairness(
        self,
        current_allocation: Dict[str, Any],
        fairness_metrics: Dict[str, float],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        swap_recommendations: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Review allocation fairness and provide AI insights.
        
        NOT assigning duties, but analyzing:
        - Fairness metrics explanation
        - Workload distribution patterns
        - Suggested improvements
        - Conflict risk assessment
        
        Args:
            current_allocation: Current allocation state
            fairness_metrics: From calculate_fairness_metrics
            teachers: List of teachers
            exams: List of exams
            swap_recommendations: Optional swap recommendations
            
        Returns:
            {
                "fairness_score": 0-100,
                "fairness_assessment": "Good|Fair|Poor",
                "analysis": "Detailed text explanation",
                "patterns": [
                    {
                        "pattern": "overload in X department",
                        "impact": "low|medium|high",
                        "recommendation": "action to take",
                    }
                ],
                "risk_factors": [
                    {
                        "risk": "description",
                        "probability": "low|medium|high",
                        "mitigation": "action",
                    }
                ],
                "confidence": 0.0-1.0,
            }
        """
        if not self.model:
            logger.warning("Gemini model not available. Returning basic assessment.")
            return self._fallback_fairness_review(fairness_metrics)
        
        try:
            # Build analysis context
            context = self._build_analysis_context(
                current_allocation, fairness_metrics, teachers, exams, swap_recommendations
            )
            
            # Prompt Gemini for fairness analysis
            prompt = self._build_fairness_review_prompt(context)
            
            logger.info("Querying Gemini for fairness analysis...")
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1000,
                    temperature=0.3,  # More deterministic
                ),
            )
            
            # Parse response
            analysis = self._parse_fairness_response(
                response.text, fairness_metrics
            )
            
            self._log_fairness_analysis(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return self._fallback_fairness_review(fairness_metrics)

    def generate_fairness_explanation(
        self,
        allocation: Dict[str, Any],
        teacher_id: str,
        fairness_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Generate explanation for why specific teacher got their allocation.
        
        Use case: Teacher asks "Why do I have 5 duties when Alice has 3?"
        Response: Clear explanation of fairness constraints applied
        """
        if not self.model:
            logger.warning("Gemini model not available.")
            return {
                "status": "unavailable",
                "message": "AI explanation service not available",
            }
        
        try:
            # Build context for this teacher
            teacher_duties = self._count_teacher_duties(allocation, teacher_id)
            mean = fairness_metrics.get("mean", 0)
            std_dev = fairness_metrics.get("std_dev", 0)
            
            prompt = f"""
            Provide a brief, empathetic explanation for a teacher's exam duty allocation.
            
            Teacher's duties: {teacher_duties}
            Average duties: {mean:.1f}
            Fairness std_dev: {std_dev:.2f}
            
            Explain in 2-3 sentences why this allocation is fair and how it considers:
            - Their experience level
            - Department balance
            - Workload fairness
            - Scheduling constraints
            
            Keep it professional and non-technical.
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=200,
                    temperature=0.5,
                ),
            )
            
            return {
                "status": "success",
                "teacher_id": teacher_id,
                "duties_assigned": teacher_duties,
                "explanation": response.text,
                "fairness_context": {
                    "your_duties": teacher_duties,
                    "average_duties": mean,
                    "fairness_score": std_dev,
                }
            }
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
            }

    def suggest_conflict_resolutions(
        self,
        conflicts: List[Dict[str, Any]],
        current_allocation: Dict[str, Any],
        teachers: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Use Gemini to suggest resolution strategies for conflicts.
        
        Args:
            conflicts: List of detected conflicts (from resolver)
            current_allocation: Current state
            teachers: Teacher list
            
        Returns:
            [
                {
                    "conflict": "description",
                    "suggested_resolution": "specific action",
                    "rationale": "why this works",
                    "confidence": float,
                }
            ]
        """
        if not self.model or not conflicts:
            return []
        
        try:
            resolutions = []
            
            for conflict in conflicts[:5]:  # Limit to top 5
                prompt = f"""
                Suggest a specific resolution for this exam duty conflict:
                
                {json.dumps(conflict, indent=2)}
                
                Provide:
                1. Most likely cause
                2. One specific action to resolve
                3. Why this works
                
                Keep response under 100 words and be actionable.
                """
                
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=150,
                        temperature=0.4,
                    ),
                )
                
                resolutions.append({
                    "conflict_type": conflict.get("type"),
                    "suggested_resolution": response.text,
                    "confidence": 0.75,  # Moderate confidence
                })
            
            return resolutions
            
        except Exception as e:
            logger.error(f"Conflict resolution suggestion failed: {e}")
            return []

    def _build_analysis_context(
        self,
        current_allocation: Dict[str, Any],
        fairness_metrics: Dict[str, float],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        swap_recommendations: List[Dict[str, Any]] = None,
    ) -> str:
        """
        Build text context for Gemini analysis.
        """
        active_teachers = [t for t in teachers if t.get("is_active", True)]
        
        context = f"""
ALLOCATION FAIRNESS ANALYSIS REQUEST

Fairness Metrics:
- Mean duties per teacher: {fairness_metrics.get('mean', 0):.1f}
- Standard deviation: {fairness_metrics.get('std_dev', 0):.2f}
- Variance: {fairness_metrics.get('variance', 0):.3f}
- Range: {fairness_metrics.get('min', 0)} to {fairness_metrics.get('max', 0)}

Context:
- Total active teachers: {len(active_teachers)}
- Total exams: {len(exams)}
- Total allocations: {sum(fairness_metrics.get('total_allocations', 0), 0)}

Allocation Summary:
- {len(exams)} exams scheduled
- {len(current_allocation)} exams with allocations
- {len([t for t in active_teachers if len(current_allocation)])} teachers with duties

Top overloaded teachers (if any):
"""
        # Add top overloaded
        duties_by_teacher = {}
        for exam_id, exam_alloc in current_allocation.items():
            for role, assignments in exam_alloc.get("roles", {}).items():
                for assignment in assignments:
                    teacher_id = assignment.get("teacher_id")
                    if teacher_id:
                        duties_by_teacher[teacher_id] = duties_by_teacher.get(teacher_id, 0) + 1
        
        sorted_duties = sorted(duties_by_teacher.items(), key=lambda x: x[1], reverse=True)
        for teacher_id, count in sorted_duties[:5]:
            teacher = next((t for t in teachers if t["_id"] == teacher_id), None)
            if teacher:
                context += f"\n  - {teacher.get('name')}: {count} duties"
        
        if swap_recommendations:
            context += f"\n\nPending swap opportunities: {len(swap_recommendations)}"
        
        return context

    def _build_fairness_review_prompt(self, context: str) -> str:
        """
        Build prompt for Gemini fairness analysis.
        """
        return f"""
{context}

ANALYSIS TASK:
Review the fairness of this exam duty allocation.

Provide:
1. Overall fairness score (0-100 scale) and assessment (Good/Fair/Poor)
2. Key fairness observations (2-3 most important points)
3. Identified patterns in workload distribution
4. Risk factors for allocation failure
5. Specific recommendations for improvement

Format as JSON:
{{
    "fairness_score": <0-100>,
    "assessment": "<Good|Fair|Poor>",
    "analysis": "<detailed explanation>",
    "patterns": [
        {{"pattern": "...", "impact": "<low|medium|high>", "confidence": <0.0-1.0>}}
    ],
    "risks": [
        {{"risk": "...", "probability": "<low|medium|high>", "mitigation": "..."}}
    ],
    "recommendations": ["...", "..."]
}}

Be analytical, specific, and actionable. Focus on fairness principles:
- Load balance (no teacher overloaded)
- No unfair exclusions
- Department distribution
- Experience-based assignment
"""

    def _parse_fairness_response(
        self,
        response_text: str,
        fairness_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Parse Gemini response into structured format.
        """
        try:
            # Try to extract JSON from response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                parsed = json.loads(json_str)
                
                return {
                    "status": "success",
                    "fairness_score": parsed.get("fairness_score", 50),
                    "fairness_assessment": parsed.get("assessment", "Fair"),
                    "analysis": parsed.get("analysis", response_text),
                    "patterns": parsed.get("patterns", []),
                    "risk_factors": parsed.get("risks", []),
                    "recommendations": parsed.get("recommendations", []),
                    "confidence": 0.8,
                }
            else:
                # Fallback: return as unstructured analysis
                return {
                    "status": "success",
                    "fairness_score": 65,
                    "fairness_assessment": "Fair",
                    "analysis": response_text,
                    "patterns": [],
                    "risk_factors": [],
                    "recommendations": [],
                    "confidence": 0.6,
                }
                
        except json.JSONDecodeError:
            return {
                "status": "success",
                "fairness_score": 65,
                "fairness_assessment": "Fair",
                "analysis": response_text,
                "patterns": [],
                "risk_factors": [],
                "recommendations": [],
                "confidence": 0.5,
            }

    def _fallback_fairness_review(
        self,
        fairness_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Fallback review when Gemini unavailable.
        Uses statistical analysis only.
        """
        std_dev = fairness_metrics.get("std_dev", 0)
        
        # Score based on std_dev
        if std_dev < 0.5:
            score = 90
            assessment = "Good"
            feedback = "Excellent fairness: workload evenly distributed"
        elif std_dev < 1.0:
            score = 70
            assessment = "Fair"
            feedback = "Acceptable fairness with minor imbalances"
        else:
            score = 50
            assessment = "Poor"
            feedback = "Significant fairness issues: consider rebalancing"
        
        return {
            "status": "success",
            "fairness_score": score,
            "fairness_assessment": assessment,
            "analysis": feedback,
            "patterns": [
                {
                    "pattern": "Workload variance",
                    "impact": "medium" if std_dev > 0.5 else "low",
                    "confidence": 0.95,
                }
            ],
            "risk_factors": [
                {
                    "risk": "Teacher burnout from overload",
                    "probability": "high" if std_dev > 1.5 else "medium" if std_dev > 0.8 else "low",
                    "mitigation": "Consider swapping duties or requesting volunteers",
                }
            ],
            "recommendations": [
                "Review top overloaded teachers",
                "Use swap engine to identify improvements",
            ],
            "confidence": 0.7,
            "source": "statistical_analysis",
        }

    def _count_teacher_duties(
        self, allocation: Dict[str, Any], teacher_id: str
    ) -> int:
        """Count duties for specific teacher in allocation."""
        count = 0
        for exam_id, exam_alloc in allocation.items():
            for role, assignments in exam_alloc.get("roles", {}).items():
                for assignment in assignments:
                    if assignment.get("teacher_id") == teacher_id:
                        count += 1
        return count

    def _log_fairness_analysis(self, analysis: Dict[str, Any]) -> None:
        """Log fairness analysis results."""
        logger.info(f"Fairness Score: {analysis.get('fairness_score')}/100")
        logger.info(f"Assessment: {analysis.get('fairness_assessment')}")
        
        patterns = analysis.get("patterns", [])
        if patterns:
            logger.info(f"Identified {len(patterns)} fairness patterns")
        
        risks = analysis.get("risk_factors", [])
        if risks:
            logger.info(f"Identified {len(risks)} risk factors")

"""
NLP Policy Engine - Converts natural language rules to JSON constraints
Integrates with Gemini parser for dynamic rule generation
"""

from gemini_parser import parse_rules
import logging

logger = logging.getLogger(__name__)


class NLPPolicyEngine:
    """Converts natural language policy text to structured constraints"""

    @staticmethod
    def convert_text_to_constraints(rule_text: str) -> list:
        """
        Convert natural language rules to JSON constraints
        
        Args:
            rule_text: Natural language policy text
            
        Returns:
            List of constraint dictionaries
        """
        if not rule_text or not rule_text.strip():
            return []

        try:
            logger.info(f"Converting policy text to constraints: {rule_text[:100]}...")
            parsed = parse_rules(rule_text)

            if isinstance(parsed, dict):
                # Wrap single dict in list
                return [parsed]
            elif isinstance(parsed, list):
                return parsed
            else:
                logger.warning(f"Unexpected parsed type: {type(parsed)}")
                return []

        except Exception as e:
            logger.error(f"Failed to parse policy text: {e}")
            return []

    @staticmethod
    def validate_constraints(constraints: list) -> list:
        """
        Validate and normalize constraint format
        
        Args:
            constraints: List of constraint dicts
            
        Returns:
            Validated constraints list
        """
        valid_constraints = []
        
        for constraint in constraints:
            if not isinstance(constraint, dict):
                continue
                
            # Ensure constraint has required fields
            if "type" not in constraint:
                continue
                
            # Normalize common constraint types
            constraint_type = constraint.get("type")
            
            if constraint_type == "max_duties_per_day":
                if "value" not in constraint:
                    constraint["value"] = 3
                valid_constraints.append(constraint)
                
            elif constraint_type == "no_same_department":
                valid_constraints.append(constraint)
                
            elif constraint_type == "prefer_senior_teachers":
                if "value" not in constraint:
                    constraint["value"] = True
                valid_constraints.append(constraint)
                
            elif constraint_type == "avoid_teacher":
                if "teacher_name" not in constraint:
                    continue
                valid_constraints.append(constraint)
                
            elif constraint_type == "prefer_department":
                if "department" not in constraint:
                    continue
                valid_constraints.append(constraint)
                
            else:
                # Unknown type but keep it
                valid_constraints.append(constraint)
                
        return valid_constraints
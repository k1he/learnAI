"""Code validation utilities for generated React components."""

import re
from typing import Tuple


def validate_react_code(code: str) -> Tuple[bool, str]:
    """
    Validate that the generated code is a valid React component.
    
    Args:
        code: The generated React component code string
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not code or not code.strip():
        return False, "Code is empty"
    
    # Check for export default
    has_export_default = bool(
        re.search(r'export\s+default\s+', code) or
        re.search(r'export\s*{\s*\w+\s+as\s+default\s*}', code)
    )
    
    if not has_export_default:
        return False, "Code must contain 'export default'"
    
    # Check for basic React component structure
    has_function_or_class = bool(
        re.search(r'function\s+\w+\s*\(', code) or
        re.search(r'const\s+\w+\s*=\s*\(', code) or
        re.search(r'class\s+\w+\s+extends', code)
    )
    
    if not has_function_or_class:
        return False, "Code must contain a function or class component"
    
    # Check for return statement with JSX (basic check)
    has_return = bool(re.search(r'return\s*\(?\s*<', code))
    
    if not has_return:
        return False, "Component must return JSX"
    
    return True, ""


def sanitize_code(code: str) -> str:
    """
    Sanitize the code by removing potential issues.
    
    Args:
        code: The generated code string
        
    Returns:
        Sanitized code string
    """
    # Remove markdown code blocks if present
    code = re.sub(r'^```(?:jsx?|tsx?|javascript|typescript)?\n?', '', code)
    code = re.sub(r'\n?```$', '', code)
    
    # Trim whitespace
    code = code.strip()
    
    return code

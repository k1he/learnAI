"""Regex-based AST Validator for generated React/TypeScript code.

Validates that generated code only imports from allowed libraries.
Uses regex pattern matching for performance (no external JS parser needed).
"""

import re
from typing import Set

# Allowed npm modules for generated code
ALLOWED_MODULES: Set[str] = {
    "react",
    "recharts", 
    "lucide-react",
    "framer-motion",
    "clsx",
    "tailwind-merge",
}

# Regex pattern to capture module names in ES6 imports
# Matches: import ... from 'module' or import ... from "module"
IMPORT_PATTERN = re.compile(
    r"""import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]""",
    re.MULTILINE
)

# Regex pattern to capture dynamic imports
# Matches: import('module') or import("module")
DYNAMIC_IMPORT_PATTERN = re.compile(
    r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)""",
    re.MULTILINE
)

# Regex pattern to capture require statements
# Matches: require('module') or require("module")
REQUIRE_PATTERN = re.compile(
    r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)""",
    re.MULTILINE
)


def extract_base_module(module_path: str) -> str:
    """Extract the base module name from an import path.
    
    Examples:
        'react' -> 'react'
        'recharts/lib/component' -> 'recharts'
        '@scope/package' -> '@scope/package'
        '@scope/package/sub' -> '@scope/package'
    """
    if module_path.startswith("@"):
        # Scoped package: @scope/package/sub -> @scope/package
        parts = module_path.split("/")
        if len(parts) >= 2:
            return f"{parts[0]}/{parts[1]}"
        return module_path
    else:
        # Regular package: package/sub -> package
        return module_path.split("/")[0]


def extract_imports(code: str) -> list[str]:
    """Extract all imported module names from code.
    
    Args:
        code: JavaScript/TypeScript code string
        
    Returns:
        List of unique module names found in imports
    """
    imports: set[str] = set()
    
    # Find static imports
    for match in IMPORT_PATTERN.finditer(code):
        module = match.group(1)
        # Skip relative imports (./foo, ../bar)
        if not module.startswith("."):
            imports.add(extract_base_module(module))
    
    # Find dynamic imports
    for match in DYNAMIC_IMPORT_PATTERN.finditer(code):
        module = match.group(1)
        if not module.startswith("."):
            imports.add(extract_base_module(module))
    
    # Find require statements
    for match in REQUIRE_PATTERN.finditer(code):
        module = match.group(1)
        if not module.startswith("."):
            imports.add(extract_base_module(module))
    
    return list(imports)


def validate_imports(code: str) -> list[str]:
    """Validate that all imports are from allowed modules.
    
    Args:
        code: JavaScript/TypeScript code string
        
    Returns:
        List of forbidden module names (empty if all imports are valid)
    """
    imports = extract_imports(code)
    forbidden = [m for m in imports if m not in ALLOWED_MODULES]
    return forbidden


def is_code_safe(code: str) -> tuple[bool, list[str]]:
    """Check if generated code is safe to execute.
    
    Args:
        code: JavaScript/TypeScript code string
        
    Returns:
        Tuple of (is_safe, forbidden_modules)
    """
    forbidden = validate_imports(code)
    return len(forbidden) == 0, forbidden

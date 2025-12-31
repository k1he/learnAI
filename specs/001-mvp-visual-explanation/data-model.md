# Data Model & Schema Design

**Feature**: MVP Generative Visual Explanation
**Status**: Final

> Note: Since this is a stateless MVP without a database, this document defines the **Application Data Structures (Pydantic Models)** and **API DTOs** rather than Database Entities.

## 1. Domain Entities (In-Memory / DTOs)

### 1.1 GenerationRequest
Represents the user's input prompt.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| prompt | string | Yes | The natural language question | Max 1000 chars, Min 2 chars |
| model | string | No | Selected LLM model | Enum: `deepseek-chat`, `qwen-turbo` (Default config) |

### 1.2 GeneratedContent (Internal)
The structured output from the LLM.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| explanation | string | Yes | Textual explanation of the concept |
| code | string | Yes | React component code (stringified) |

### 1.3 GenerationResponse (API Response)
The final response sent to the frontend.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | Status of generation | Enum: `success`, `error` |
| data | GeneratedContent | No | The content (if success) |
| error | string | No | Error message (if error) |

---

## 2. Validation Rules (Pydantic)

### 2.1 Code Validation
- **Rule**: Code must contain `export default` (or equivalent) to be renderable.
- **Rule**: Code must not contain blacklisted keywords (optional secondary check, though relying on iframe).

### 2.2 Prompt Validation
- **Rule**: Trim whitespace.
- **Rule**: Reject empty strings.

---

## 3. State Management (Frontend)

### 3.1 AppState
| Field | Type | Description |
|-------|------|-------------|
| prompt | string | Current input text |
| isLoading | boolean | UI loading state |
| result | GenerationResponse | Last received result |
| error | string | UI error message |


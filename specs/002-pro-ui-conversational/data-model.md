# Data Model: 002-pro-ui-conversational

## Entities (Client-Side)

### Conversation
Represents a single session of interaction. Persisted in LocalStorage.

```typescript
interface Conversation {
  id: string;              // UUID
  title: string;           // Auto-generated or User-defined
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
  messages: Message[];     // History
  currentVisual: Visualization | null; // Latest state
}
```

### Message
A single turn in the conversation.

```typescript
interface Message {
  id: string;              // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;         // Text content
  timestamp: number;
  // For 'assistant' messages, this may contain the generated code
  codeSnippet?: string;    
  // For 'user' messages, this might be the code state *before* the request (optional, for debugging)
  contextCodeVersion?: number; 
}
```

### Visualization
The renderable state.

```typescript
interface Visualization {
  code: string;            // The React component code
  explanation?: string;    // Brief text explanation
  version: number;         // Incremental version for history
  status: 'loading' | 'success' | 'error';
  error?: string;
}
```

## API Schemas (Backend - Pydantic)

### ChatRequest
```python
class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "deepseek-chat"
    # Optional: Client can send the current code explicitly if not embedded in messages
    current_code: Optional[str] = None 
```

### ChatMessage
```python
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
```

### ChatResponse
```python
class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    choices: List[Choice]
    usage: Usage
```

### Choice
```python
class Choice(BaseModel):
    index: int
    message: ChatMessage
    # We might embed the code in the 'content' field as a markdown block, 
    # OR parse it out into a structured field if using Function Calling/JSON Mode.
    # For this iteration, we assume the code is extracted from the content or a structured field.
    extracted_code: Optional[str] = None
    finish_reason: str
```

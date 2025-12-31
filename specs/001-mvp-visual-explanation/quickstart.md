# Developer Quickstart: MVP Visual Explanation

## 1. Environment Setup

### Prerequisites
- Python 3.12
- Node.js 18+
- API Key (DeepSeek or compatible OpenAI provider)

### Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn pydantic openai python-dotenv
   ```
4. Create `.env`:
   ```env
   LLM_API_KEY=your_key_here
   LLM_BASE_URL=https://api.deepseek.com/v1
   ```
5. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   npm install @codesandbox/sandpack-react react-resizable-panels lucide-react
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

## 2. Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Frontend (http://localhost:3000) |
| `uvicorn app.main:app` | Start Backend (http://localhost:8000) |
| `pytest` | Run Backend Tests |
| `npm test` | Run Frontend Tests |

## 3. Development Workflow

1. **Modify API**: Update `backend/app/schemas/` and `openapi.yaml`.
2. **Modify Prompt**: Update `backend/app/services/llm_service.py`.
3. **Update UI**: Components in `frontend/src/components/`.

## 4. Verification

1. Open http://localhost:3000
2. Enter "Draw a sine wave"
3. Verify:
   - Loading spinner appears.
   - Text explanation renders.
   - Graph renders in Sandpack.
   - Input box remains visible.

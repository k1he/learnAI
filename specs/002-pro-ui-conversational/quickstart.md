# Quickstart: Pro UI & Conversational Mode

This guide helps you set up the environment for the new conversational UI features.

## Prerequisites
- Node.js 18+
- Python 3.12+
- DeepSeek API Key (or OpenAI compatible key)

## Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Activate virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Install updated dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Ensure `fastapi`, `uvicorn`, `pydantic`, `openai` are installed.*

4. Set Environment Variables:
   Ensure `.env` contains:
   ```env
   LLM_API_KEY=sk-...
   LLM_BASE_URL=https://api.deepseek.com
   ```

5. Run Server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install new dependencies:
   ```bash
   npm install react-resizable-panels lucide-react framer-motion clsx tailwind-merge
   ```

3. Run Development Server:
   ```bash
   npm run dev
   ```

4. Open Browser:
   Visit `http://localhost:3000`. You should see the new split-screen layout.

## Usage Guide

1. **Initial Generation**: Type "Show me a sine wave" in the left panel.
2. **View Result**: The chart appears on the right.
3. **Iterate**: Type "Make the line red" in the chat.
4. **History**: Scroll up in the chat to see previous versions.

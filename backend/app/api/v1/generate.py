"""Generation API endpoint."""

from fastapi import APIRouter, HTTPException

from app.schemas.generation import (
    GenerationRequest,
    GenerationResponse,
    GeneratedContent,
)
from app.services.llm_service import get_llm_service

router = APIRouter()


@router.post("/generate", response_model=GenerationResponse)
async def generate_visualization(request: GenerationRequest) -> GenerationResponse:
    """
    Generate a visual explanation from a natural language prompt.
    
    - **prompt**: The concept or question to visualize (2-1000 characters)
    - **model**: Optional LLM model override
    
    Returns a JSON response with:
    - **status**: "success" or "error"
    - **data**: Generated content (explanation + React code) if successful
    - **error**: Error message if failed
    """
    try:
        service = get_llm_service()
        content = await service.generate(
            prompt=request.prompt,
            model=request.model
        )
        
        return GenerationResponse(
            status="success",
            data=content
        )
        
    except ValueError as e:
        # Generation failed after retries
        return GenerationResponse(
            status="error",
            error=str(e)
        )
        
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.generate import router as generate_router

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
    )

    # Set all CORS enabled origins
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Register API routers
    application.include_router(
        generate_router,
        prefix=settings.API_V1_STR,
        tags=["generation"]
    )

    return application

app = create_application()

@app.get("/")
async def root():
    return {"message": "Welcome to Concept Canvas API", "version": settings.VERSION}

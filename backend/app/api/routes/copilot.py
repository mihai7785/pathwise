from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/conversation")
def get_copilot_context(current_user: User = Depends(get_current_user)):
    return {
        "title": f"{current_user.name}'s Pathwise Copilot",
        "starter_prompts": [
            "What should I study next?",
            "Explain embeddings like I'm revising for an interview.",
            "Generate a practical RAG exercise.",
            "What resources do I already have about agents?",
        ],
        "provider_strategy": "Provider-agnostic AI layer planned; adapters will plug into this endpoint.",
    }

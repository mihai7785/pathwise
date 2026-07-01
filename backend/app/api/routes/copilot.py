from fastapi import APIRouter

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/conversation")
def get_copilot_context():
    return {
        "title": "AI Engineer Copilot",
        "starter_prompts": [
            "What should I study next?",
            "Explain embeddings like I'm revising for an interview.",
            "Generate a practical RAG exercise.",
            "What resources do I already have about agents?",
        ],
        "provider_strategy": "Provider-agnostic AI layer planned; adapters will plug into this endpoint.",
    }

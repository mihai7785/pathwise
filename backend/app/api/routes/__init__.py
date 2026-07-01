from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.copilot import router as copilot_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.paths import router as paths_router
from app.api.routes.resources import router as resources_router
from app.api.routes.topics import router as topics_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(health_router)
router.include_router(dashboard_router)
router.include_router(paths_router)
router.include_router(topics_router)
router.include_router(resources_router)
router.include_router(copilot_router)

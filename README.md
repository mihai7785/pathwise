# Pathwise

Web-first learning path tracker with an AI copilot.

## Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + TypeScript + Vite

## Structure
- `backend/` API, models, schemas, settings
- `frontend/` React UI for dashboard, path, topic, inbox, and copilot

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Current product direction
- Product name: **Pathwise**
- Repository: `mihai7785/pathwise`
- Focus: structured learning paths, topic tracking, resource capture, and AI-assisted study workflows

## MVP implemented so far
- users, learning paths, topics, resources
- topic hierarchy and dependencies
- local auth/session flow for development
- user-scoped API access
- path creation, editing, status updates, and deletion
- topic creation, status updates, and deletion
- resource creation and deletion
- resource-to-topic linking
- resource unlinking from topics
- sample seeded starter data per user
- React screens for Dashboard, Path, Topic, Inbox, and Copilot

## Next recommended steps
1. Add richer resource processing and AI-assisted classification
2. Add async AI job processing
3. Add file uploads + OCR/extraction pipeline
4. Add richer study analytics and reviews
5. Add real authentication and multi-user hardening beyond dev login

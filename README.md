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
- topic and resource creation flows
- sample seeded starter data per user
- React screens for Dashboard, Path, Topic, Inbox, and Copilot

## Next recommended steps
1. Complete CRUD for paths/topics/resources
2. Add topic-resource linking flows
3. Add async AI job processing
4. Add file uploads + OCR/extraction pipeline
5. Add richer study analytics and reviews

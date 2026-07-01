# Learning Copilot

Web-first learning path tracker with an AI copilot.

## Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + TypeScript + Vite

## Structure
- `backend/` API, models, schemas, settings
- `frontend/` React UI for dashboard, path, topic, inbox

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

## MVP implemented in scaffold
- users, learning paths, topics, resources
- topic hierarchy and dependencies
- basic CRUD API skeleton
- sample seeded dashboard data endpoint
- React screens for Dashboard, Path, Topic, Inbox

## Next recommended steps
1. Add auth (Clerk/Auth.js or FastAPI JWT)
2. Replace mock frontend data with API mutations
3. Add async AI job processing
4. Add file uploads + OCR/extraction pipeline

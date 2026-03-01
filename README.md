# IssueHub

A issue tracker with a FastAPI backend and a React frontend.

## Tech
- Backend: FastAPI + SQLAlchemy
- DB: PostgreSQL (recommended)
- Frontend: React

## Setup
1. Install tools

```bash
# Node & npm
# Python 3.10+
# PostgreSQL
```

2. Backend env (configure `backend/app/config.py`)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_tracker
SECRET_KEY=change-me-to-a-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=480
ALGORITHM=HS256
```

3. Create DB (local)

```bash
# using psql
createdb issue_tracker
```

## Installations & Run
- Dependency are listed in `backend/requirements.txt`.

```bash
cd backend
python -m venv .venv            # optional
# activate and install
pip install -r requirements.txt
uvicorn app.main:app --reload
```


- Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000/
Backend API: http://127.0.0.1:8000

---



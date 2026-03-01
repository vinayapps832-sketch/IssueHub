from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import auth, projects, issues, comments

# create all the tables 
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IssueHub",description="A lightweight issue tracking system built with FastAPI and SQLAlchemy")

# cors 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

#Register routers
app.include_router(auth.router, prefix="/api/auth",tags=["Auth"])
app.include_router(projects.router, prefix="/api",tags=["Projects"])
app.include_router(issues.router, prefix="/api",tags=["Issues"])
app.include_router(comments.router, prefix="/api",tags=["Comments"])

@app.get("/",tags=["health"])
def read_root():
    return {"status": "ok", "app": "Welcome to IssueHub API!"}

"""Project & management routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Project,ProjectMember, User,ProjectRole
from app.schemas import ProjectCreate, ProjectOut,MemberAdd, MemberOut
from app.services.auth import get_current_user

router=APIRouter()

# ---helpers
def _get_membership(db: Session, project_id: int, user_id: int) -> ProjectMember | None:
    return (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
        .first()
    )

def _require_member(db: Session, project_id: int, user_id: int) -> ProjectMember:
    membership = _get_membership(db, project_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")
    return membership

def _require_maintainer(db: Session, project_id: int, user_id: int) -> ProjectMember:
    membership = _require_member(db, project_id, user_id)
    if membership.role != "maintainer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires maintainer role")
    return membership

# ---routes
@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Project).filter(Project.key == body.key).first():
        raise HTTPException(status_code=400, detail="Project key already exists")

    project = Project(name=body.name, key=body.key, description=body.description)
    db.add(project)
    db.flush()  # Get project ID before commit for membership
    membership = ProjectMember(project_id=project.id, user_id=current_user.id, role=ProjectRole.maintainer)
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .filter(ProjectMember.user_id == current_user.id)
        .all()
    )

@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _require_member(db, project_id, current_user.id)
    return project

@router.post("/projects/{project_id}/members", response_model=MemberOut, status_code=201)
def add_member(project_id: int, body: MemberAdd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_maintainer(db, project_id, current_user.id)

    project=db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    target_user=db.query(User).filter(User.email == body.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing=_get_membership(db, project_id, target_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    membership=ProjectMember(project_id=project_id, user_id=target_user.id, role=body.role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

@router.get("/projects/{project_id}/members", response_model=List[MemberOut])
def list_members(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_member(db, project_id, current_user.id)
    return (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .join(User, User.id == ProjectMember.user_id)
        .all()
    )

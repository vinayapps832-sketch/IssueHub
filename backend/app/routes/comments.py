"""Comment routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Comment, Issue, User
from app.schemas import CommentCreate, CommentOut
from app.services.auth import get_current_user
from app.routes.projects import _require_member

router = APIRouter()


@router.get("/issues/{issue_id}/comments", response_model=List[CommentOut])
def list_comments(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _require_member(db, issue.project_id, current_user.id)

    return (
        db.query(Comment)
        .filter(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post(
    "/issues/{issue_id}/comments",
    response_model=CommentOut,
    status_code=201,
)
def add_comment(
    issue_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _require_member(db, issue.project_id, current_user.id)

    comment = Comment(
        issue_id=issue_id,
        author_id=current_user.id,
        body=body.body,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
"""Issue routes with filtering, sorting, pagination."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import (
    Issue,
    IssueStatus,
    IssuePriority,
    User,
    ProjectMember,
    ProjectRole,
)
from app.schemas import IssueCreate, IssueUpdate, IssueOut, IssueBrief, PaginatedIssues
from app.services.auth import get_current_user
from app.routes.projects import _require_member, _require_maintainer

router = APIRouter()


# ---- List issues (with filters, search, sort, pagination) ----
@router.get("/projects/{project_id}/issues", response_model=PaginatedIssues)
def list_issues(
    project_id: int,
    q: Optional[str] = None,
    status: Optional[IssueStatus] = None,
    priority: Optional[IssuePriority] = None,
    assignee: Optional[int] = None,
    sort: str = Query("created_at", pattern="^(created_at|priority|status)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, project_id, current_user.id)

    query = db.query(Issue).filter(Issue.project_id == project_id)

    if q:
        query = query.filter(Issue.title.ilike(f"%{q}%"))
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    if assignee:
        query = query.filter(Issue.assignee_id == assignee)

    total = query.count()

    # sorting
    sort_col = getattr(Issue, sort)
    query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    items = (
        query.options(joinedload(Issue.reporter), joinedload(Issue.assignee))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaginatedIssues(items=items, total=total, page=page, per_page=per_page)


# ---- Create issue ----
@router.post("/projects/{project_id}/issues", response_model=IssueOut, status_code=201)
def create_issue(
    project_id: int,
    body: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_member(db, project_id, current_user.id)

    issue = Issue(
        project_id=project_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        reporter_id=current_user.id,
        assignee_id=body.assignee_id,
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


# ---- Get single issue ----
@router.get("/issues/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = (
        db.query(Issue)
        .options(joinedload(Issue.reporter), joinedload(Issue.assignee))
        .filter(Issue.id == issue_id)
        .first()
    )

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _require_member(db, issue.project_id, current_user.id)
    return issue


# ---- Update issue ----
@router.patch("/issues/{issue_id}", response_model=IssueOut)
def update_issue(
    issue_id: int,
    body: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _require_member(db, issue.project_id, current_user.id)

    # Only maintainer can change status & assignee
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == issue.project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )

    is_maintainer = membership and membership.role == ProjectRole.maintainer
    is_reporter = issue.reporter_id == current_user.id

    if not is_maintainer and not is_reporter:
        raise HTTPException(
            status_code=403, detail="No permission to update this issue"
        )

    update_data = body.model_dump(exclude_unset=True)

    # Non-maintainers cannot change status or assignee
    if not is_maintainer:
        update_data.pop("status", None)
        update_data.pop("assignee_id", None)

    for field, value in update_data.items():
        setattr(issue, field, value)

    db.commit()
    db.refresh(issue)
    return issue


# ---- Delete issue ----
@router.delete("/issues/{issue_id}", status_code=204)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == issue.project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )

    is_maintainer = membership and membership.role == ProjectRole.maintainer
    is_reporter = issue.reporter_id == current_user.id

    if not is_maintainer and not is_reporter:
        raise HTTPException(
            status_code=403, detail="No permission to delete this issue"
        )

    db.delete(issue)
    db.commit()
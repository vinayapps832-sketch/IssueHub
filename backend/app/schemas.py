from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import IssueStatus, IssuePriority, ProjectRole

# ---Error-- 

class ErrorDetail(BaseModel):
    code:str
    message:str
    details:Optional[dict] = None

class ErrorResponse(BaseModel):
    error:ErrorDetail

# ---Auth/User---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1,max_length=120)
    email: EmailStr 
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str="bearer" 

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# ---Project---
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    key: str = Field(..., min_length=2, max_length=10,pattern=r"^[A-Z0-9]+$")
    description: Optional[str] = ""

class ProjectOut(BaseModel):
    id: int
    name: str
    key: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MemberAdd(BaseModel):
    email: EmailStr
    role: ProjectRole=ProjectRole.member

class MemberOut(BaseModel):
    id: int
    user: UserOut
    role: ProjectRole
    class Config:
        from_attributes = True

# ---Issue---
class IssueCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    priority: IssuePriority = IssuePriority.medium
    assignee_id: Optional[int] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None

class IssueOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: IssueStatus
    priority: IssuePriority
    reporter: UserOut
    assignee: Optional[UserOut]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IssueBrief(BaseModel):
    id: int
    project_id:int
    title: str
    status: IssueStatus
    priority: IssuePriority
    reporter: UserOut
    assignee: Optional[UserOut]=None 
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class PaginatedIssues(BaseModel):
    items: List[IssueBrief]
    total: int
    page: int
    per_page: int
    # issues: List[IssueBrief]

# ---Comment---
class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1)

class CommentOut(BaseModel):
    id: int
    issue_id: int
    author: Optional[UserOut]
    body: str
    created_at: datetime
    class Config:
        from_attributes = True
        

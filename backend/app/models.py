import enum
from datetime import datetime,timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, UniqueConstraint,Text
from sqlalchemy.orm import relationship
from app.database import Base

# -----Enums-----

class ProjectRole(str,enum.Enum):
    member = "member"
    maintainer = "maintainer"

class IssueStatus(str,enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class IssuePriority(str,enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

# -----Models-----
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True,index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    memberships = relationship("ProjectMember", back_populates="user")
    reported_issues = relationship("Issue", back_populates="reporter", foreign_keys="Issue.reporter_id")
    assigned_issues = relationship("Issue", back_populates="assignee", foreign_keys="Issue.assignee_id")
    comments = relationship("Comment", back_populates="author")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    key= Column(String(10),unique=True, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    members = relationship("ProjectMember", back_populates="project",cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="project",cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_user"),)

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ProjectRole), default=ProjectRole.member,nullable=False)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    status = Column(Enum(IssueStatus), default=IssueStatus.open, nullable=False)
    priority = Column(Enum(IssuePriority), default=IssuePriority.medium, nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"),nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    project = relationship("Project", back_populates="issues")
    reporter = relationship("User", back_populates="reported_issues", foreign_keys=[reporter_id])
    assignee = relationship("User", back_populates="assigned_issues", foreign_keys=[assignee_id])
    comments = relationship("Comment", back_populates="issue",cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"),nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="comments")
    author = relationship("User", back_populates="comments")
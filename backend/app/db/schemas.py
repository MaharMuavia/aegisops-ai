from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "engineer"  # admin, manager, engineer, auditor

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str = "medium"

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None

class IncidentHistoryResponse(BaseModel):
    id: int
    incident_id: int
    status_from: str
    status_to: str
    comment: Optional[str] = None
    changed_by: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AgentResultResponse(BaseModel):
    id: int
    execution_id: int
    incident_id: int
    agent_name: str
    output_raw: str
    output_structured: Optional[str] = None
    confidence_score: float
    timestamp: datetime

    class Config:
        from_attributes = True

class AgentExecutionResponse(BaseModel):
    id: int
    incident_id: int
    agent_name: str
    status: str
    retry_count: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    results: List[AgentResultResponse] = []

    class Config:
        from_attributes = True

class ApprovalResponse(BaseModel):
    id: int
    incident_id: int
    requested_by: str
    approved_by: Optional[int] = None
    status: str
    comments: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    log_file_path: Optional[str] = None
    severity: str
    status: str
    intake_summary: Optional[str] = None
    root_cause: Optional[str] = None
    confidence_score: float
    resolution_plan: Optional[str] = None
    risk_level: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IncidentDetailResponse(IncidentResponse):
    history: List[IncidentHistoryResponse] = []
    agent_executions: List[AgentExecutionResponse] = []
    approvals: List[ApprovalResponse] = []

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    incident_id: Optional[int] = None
    event_type: str
    details: str
    severity: str
    timestamp: datetime
    triggered_by: Optional[str] = None

    class Config:
        from_attributes = True

# Approval actions
class ApprovalCreate(BaseModel):
    incident_id: int

class ApprovalUpdate(BaseModel):
    status: str  # approved, rejected
    comments: Optional[str] = None

# Metrics Schemas
class MetricsResponse(BaseModel):
    active_incidents: int
    resolved_incidents: int
    pending_approvals: int
    average_resolution_time: float
    agent_health_score: float
    severity_distribution: dict
    status_distribution: dict
    daily_trends: List[dict]

# Chat Schemas
class ChatRequest(BaseModel):
    message: str
    incident_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[dict] = []

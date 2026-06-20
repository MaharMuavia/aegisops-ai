import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="engineer")  # admin, manager, engineer, auditor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    approvals = relationship("Approval", back_populates="approver", foreign_keys="[Approval.approved_by]")
    notifications = relationship("Notification", back_populates="user")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=False)
    log_file_path = Column(String(250), nullable=True)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="open")  # open, investigating, waiting_approval, remediating, resolved, closed
    
    # AI Layer output fields
    intake_summary = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0)
    resolution_plan = Column(Text, nullable=True)
    risk_level = Column(String(20), nullable=True)  # low, medium, high
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    history = relationship("IncidentHistory", back_populates="incident", cascade="all, delete-orphan")
    agent_executions = relationship("AgentExecution", back_populates="incident", cascade="all, delete-orphan")
    agent_results = relationship("AgentResult", back_populates="incident", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="incident", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="incident", cascade="all, delete-orphan", foreign_keys="[Approval.incident_id]")

class IncidentHistory(Base):
    __tablename__ = "incident_history"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    status_from = Column(String(20), nullable=False)
    status_to = Column(String(20), nullable=False)
    comment = Column(Text, nullable=True)
    changed_by = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="history")

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    agent_name = Column(String(50), nullable=False)  # intake, log_analyst, kb_search, rca, resolution, audit
    status = Column(String(20), default="running")  # running, completed, failed
    retry_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="agent_executions")
    results = relationship("AgentResult", back_populates="execution", cascade="all, delete-orphan")

class AgentResult(Base):
    __tablename__ = "agent_results"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("agent_executions.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    agent_name = Column(String(50), nullable=False)
    output_raw = Column(Text, nullable=False)
    output_structured = Column(Text, nullable=True)  # JSON formatted string
    confidence_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="agent_results")
    execution = relationship("AgentExecution", back_populates="results")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    event_type = Column(String(50), nullable=False)  # system_alert, user_action, agent_trigger, approval_granted, retry_triggered, workflow_close
    details = Column(Text, nullable=False)
    severity = Column(String(20), default="info")  # info, warning, error, critical
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    triggered_by = Column(String(100), nullable=True)  # System, Agent: Intake, User: username

    incident = relationship("Incident", back_populates="audit_logs")

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    requested_by = Column(String(50), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="approvals", foreign_keys=[incident_id])
    approver = relationship("User", back_populates="approvals", foreign_keys=[approved_by])

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # database, server, authentication, billing, general_sop
    content = Column(Text, nullable=False)
    vector_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    active_incidents = Column(Integer, default=0)
    resolved_incidents = Column(Integer, default=0)
    pending_approvals = Column(Integer, default=0)
    average_resolution_time = Column(Float, default=0.0)  # in minutes
    agent_health_score = Column(Float, default=100.0)  # percentage

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

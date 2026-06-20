import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Incident, IncidentHistory, AuditLog, User
from app.db.schemas import IncidentResponse, IncidentDetailResponse, IncidentCreate
from app.api.endpoints.auth import get_current_user, RoleChecker
from app.services.uipath_maestro import maestro_orchestrator

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=IncidentResponse)
async def create_incident(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    severity: str = Form("medium"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log_file_path = None
    if file:
        file_path = os.path.join(UPLOAD_DIR, f"{datetime.datetime.utcnow().timestamp()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        log_file_path = file_path

    # Create Incident
    incident = Incident(
        title=title,
        description=description,
        severity=severity,
        log_file_path=log_file_path,
        status="open"
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Initial history record
    history = IncidentHistory(
        incident_id=incident.id,
        status_from="none",
        status_to="open",
        comment="Incident created and queued for Maestro orchestration.",
        changed_by=current_user.username
    )
    db.add(history)

    # Audit trail
    audit = AuditLog(
        incident_id=incident.id,
        event_type="user_action",
        details=f"Incident '{incident.title}' submitted by {current_user.username}. Log file: {file.filename if file else 'None'}",
        severity="info",
        triggered_by=current_user.username
    )
    db.add(audit)
    db.commit()

    # Trigger Maestro Master Workflow asynchronously
    background_tasks.add_task(maestro_orchestrator.run_workflow, incident.id, db)

    return incident

import datetime

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    return query.order_by(Incident.created_at.desc()).all()

@router.get("/{id}", response_model=IncidentDetailResponse)
def get_incident(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Eager load relationships for detail response
    # SQLAlchemy relationship attributes are accessed to trigger loading
    _ = incident.history
    _ = incident.agent_executions
    _ = incident.approvals
    
    return incident

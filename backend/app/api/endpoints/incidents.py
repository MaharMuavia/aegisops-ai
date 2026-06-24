import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import Response
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


@router.get("/{id}/report")
def download_incident_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    agent_label = {
        "intake": "Intake Triage",
        "log_analyst": "Log Forensics",
        "kb_search": "Knowledge (RAG)",
        "rca": "Root Cause Analysis",
        "resolution": "Resolution Planning",
        "audit": "Audit & Governance",
    }

    lines: List[str] = []
    lines.append("=" * 64)
    lines.append("AEGISOPS AI — INCIDENT REPORT")
    lines.append("=" * 64)
    lines.append("")
    lines.append(f"Incident ID:     INC-{incident.id}")
    lines.append(f"Title:           {incident.title}")
    lines.append(f"Filed:           {incident.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    lines.append(f"Last updated:    {incident.updated_at.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    lines.append(f"Status:          {incident.status.upper()}")
    lines.append(f"Severity:        {incident.severity.upper()}")
    lines.append(f"Confidence:      {incident.confidence_score:.0f}%")
    if incident.risk_level:
        lines.append(f"Risk level:      {incident.risk_level.upper()}")
    lines.append("")
    lines.append("-" * 64)
    lines.append("DESCRIPTION")
    lines.append("-" * 64)
    lines.append(incident.description)
    lines.append("")

    if incident.root_cause:
        lines.append("-" * 64)
        lines.append("ROOT CAUSE")
        lines.append("-" * 64)
        lines.append(incident.root_cause)
        lines.append("")

    if incident.resolution_plan:
        lines.append("-" * 64)
        lines.append("RESOLUTION PLAN")
        lines.append("-" * 64)
        lines.append(incident.resolution_plan)
        lines.append("")

    lines.append("-" * 64)
    lines.append("AGENT EXECUTION TRAIL")
    lines.append("-" * 64)
    executions = sorted(incident.agent_executions, key=lambda e: e.started_at)
    if executions:
        for execution in executions:
            label = agent_label.get(execution.agent_name, execution.agent_name)
            lines.append(f"\n[{label}] — status: {execution.status} (retries: {execution.retry_count})")
            for result in sorted(execution.results, key=lambda r: r.timestamp):
                lines.append(f"  {result.timestamp.strftime('%H:%M:%S')}  confidence {result.confidence_score:.0f}%")
                lines.append(f"  {result.output_raw}")
    else:
        lines.append("No agent executions recorded.")
    lines.append("")

    lines.append("-" * 64)
    lines.append("APPROVAL DECISIONS")
    lines.append("-" * 64)
    if incident.approvals:
        for approval in sorted(incident.approvals, key=lambda a: a.timestamp):
            approver = f"user #{approval.approved_by}" if approval.approved_by else "unassigned"
            lines.append(f"{approval.timestamp.strftime('%Y-%m-%d %H:%M:%S')} — requested by {approval.requested_by}")
            lines.append(f"  status: {approval.status.upper()}  ·  approver: {approver}")
            if approval.comments:
                lines.append(f"  comments: {approval.comments}")
    else:
        lines.append("No approval was required for this incident.")
    lines.append("")

    lines.append("-" * 64)
    lines.append("IMMUTABLE AUDIT TRAIL")
    lines.append("-" * 64)
    audit_logs = sorted(incident.audit_logs, key=lambda a: a.timestamp)
    if audit_logs:
        for log in audit_logs:
            lines.append(f"{log.timestamp.strftime('%Y-%m-%d %H:%M:%S')}  [{log.event_type}]  {log.details}  (by: {log.triggered_by or 'System'})")
    else:
        lines.append("No audit events recorded.")
    lines.append("")

    lines.append("=" * 64)
    lines.append(f"Report generated {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC by {current_user.username}")
    lines.append("Generated by AegisOps AI — regulator-ready audit export")
    lines.append("=" * 64)

    report_text = "\n".join(lines)

    return Response(
        content=report_text,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=INC-{incident.id}-report.txt"}
    )

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Approval, Incident, IncidentHistory, AuditLog, User
from app.db.schemas import ApprovalResponse, ApprovalUpdate
from app.api.endpoints.auth import get_current_user, RoleChecker
from app.services.uipath_maestro import maestro_orchestrator

router = APIRouter()

@router.get("", response_model=List[ApprovalResponse])
def get_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Managers and Admins can see the list of approvals that need actions, 
    # but engineers can view them as well.
    return db.query(Approval).order_by(Approval.timestamp.desc()).all()

@router.post("/{id}", response_model=ApprovalResponse)
def handle_approval(
    id: int,
    approval_update: ApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["manager", "admin"]))
):
    approval = db.query(Approval).filter(Approval.id == id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    if approval.status != "pending":
        raise HTTPException(status_code=400, detail="Approval request has already been processed")
        
    approval.status = approval_update.status
    approval.approved_by = current_user.id
    approval.comments = approval_update.comments
    approval.timestamp = datetime.datetime.utcnow()
    
    incident = db.query(Incident).filter(Incident.id == approval.incident_id).first()
    
    if approval_update.status == "approved":
        incident.status = "remediating"
        comment_text = f"Resolution plan APPROVED by {current_user.username}. Comment: {approval_update.comments or 'None'}"
        event_type = "approval_granted"
    else:
        incident.status = "resolved"  # Or keep in audit / closed with failure
        incident.resolution_plan = "[REJECTED] " + (incident.resolution_plan or "")
        comment_text = f"Resolution plan REJECTED by {current_user.username}. Comment: {approval_update.comments or 'None'}"
        event_type = "user_action"
        
    # Incident history
    history = IncidentHistory(
        incident_id=incident.id,
        status_from="waiting_approval",
        status_to=incident.status,
        comment=comment_text,
        changed_by=current_user.username
    )
    db.add(history)
    
    # Audit log
    audit = AuditLog(
        incident_id=incident.id,
        event_type=event_type,
        details=comment_text,
        severity="warning" if approval_update.status == "rejected" else "info",
        triggered_by=current_user.username
    )
    db.add(audit)
    db.commit()
    
    # Resume Maestro workflow asynchronously to execute the resolution action if approved
    if approval_update.status == "approved":
        from fastapi import BackgroundTasks
        # We can trigger the resolution execution step directly
        maestro_orchestrator.resume_after_approval(incident.id, db)
        
    return approval

import datetime

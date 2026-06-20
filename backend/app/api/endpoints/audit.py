from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AuditLog, User
from app.db.schemas import AuditLogResponse
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    incident_id: Optional[int] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if incident_id is not None:
        query = query.filter(AuditLog.incident_id == incident_id)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
        
    return query.order_by(AuditLog.timestamp.desc()).all()

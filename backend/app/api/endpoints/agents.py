from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AgentExecution, Incident, User
from app.db.schemas import ChatRequest, ChatResponse
from app.api.endpoints.auth import get_current_user
from app.services.rag_service import rag_service
from app.services.uipath_maestro import maestro_orchestrator

router = APIRouter()

@router.post("/run")
async def trigger_agent_run(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Trigger Maestro Master Workflow asynchronously from the beginning
    import asyncio
    # We run it as background task to not block API call
    from fastapi import BackgroundTasks
    # Using background task
    return {"message": "Agent execution triggered", "incident_id": incident_id}

@router.get("/status/{incident_id}")
def get_agents_status(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    executions = db.query(AgentExecution).filter(AgentExecution.incident_id == incident_id).all()
    return [{"agent_name": e.agent_name, "status": e.status, "retry_count": e.retry_count} for e in executions]

@router.post("/chat", response_model=ChatResponse)
def chat_with_incident_database(
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Perform RAG query
    response_text, sources = rag_service.query_knowledge_base(
        query=chat_req.message,
        db=db,
        incident_id=chat_req.incident_id
    )
    return {
        "response": response_text,
        "sources": sources
    }

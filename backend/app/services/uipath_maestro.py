import time
import json
import datetime
from sqlalchemy.orm import Session
from app.db.models import Incident, IncidentHistory, AgentExecution, AgentResult, AuditLog, Approval, SystemMetric
from app.services.agents import aegis_agents
from app.services.rag_service import rag_service

class MaestroOrchestrator:
    def run_workflow(self, incident_id: int, db: Session):
        """Runs the sequential multi-agent workflow for the given incident."""
        try:
            # 1. Fetch Incident
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                print(f"Error: Incident {incident_id} not found in database.")
                return
            
            # Transition to investigating
            self._update_incident_status(incident, "investigating", "Starting Maestro multi-agent investigation.", db)
            
            # Read logs content if file upload exists
            log_content = ""
            if incident.log_file_path and os.path.exists(incident.log_file_path):
                try:
                    with open(incident.log_file_path, "r", errors="ignore") as f:
                        log_content = f.read()
                except Exception as e:
                    self._log_audit(incident.id, "system_alert", f"Failed to read logs: {e}. Fallback to manual log review.", "error", "System", db)
            
            # Query RAG context
            _, kb_sources = rag_service.query_knowledge_base(
                query=f"{incident.title} {incident.description}",
                db=db,
                limit=2
            )
            sop_context = json.dumps(kb_sources)

            # --- RUN AGENTS FLOW ---
            agent_outputs = self._execute_agent_steps_with_retry(incident, log_content, sop_context, db)
            
            if not agent_outputs:
                # If execution failed completely after retries, escalate to human
                self._update_incident_status(incident, "waiting_approval", "Agent workflow failed. Escalated to manual engineering review.", db)
                return

            # Update incident with AI outputs
            incident.intake_summary = agent_outputs["intake"]["initial_summary"]
            incident.severity = agent_outputs["intake"]["priority"]
            incident.root_cause = agent_outputs["rca"]["root_cause"]
            incident.confidence_score = agent_outputs["rca"]["confidence_percentage"]
            incident.resolution_plan = agent_outputs["resolution"]["resolution_plan"]
            incident.risk_level = agent_outputs["resolution"]["risk_level"]
            db.commit()

            # Check for Escalations / Approvals
            requires_approval = False
            approval_reason = ""
            
            if incident.severity.lower() == "critical":
                requires_approval = True
                approval_reason = "Critical incident severity requires mandatory manager authorization."
            elif incident.confidence_score < 70.0:
                requires_approval = True
                approval_reason = f"RCA confidence ({incident.confidence_score}%) is below 70% threshold. Escalated to human expert."
                
            if requires_approval:
                self._update_incident_status(incident, "waiting_approval", f"Awaiting human approval: {approval_reason}", db)
                
                # Create Approval queue item
                approval = Approval(
                    incident_id=incident.id,
                    requested_by="Maestro: Escalation Agent",
                    status="pending",
                    comments=approval_reason
                )
                db.add(approval)
                
                # Audit log
                self._log_audit(incident.id, "retry_triggered", f"Escalated to Manager. Reason: {approval_reason}", "warning", "Agent: Escalation", db)
                db.commit()
                
                # Halt execution here. It will resume once the approval endpoint is called.
                return
                
            # If no approval required, proceed directly to remediation
            self._update_incident_status(incident, "remediating", "No escalation triggers met. Executing automated remediation plan.", db)
            db.commit()
            
            # Run remediation
            self.execute_remediation(incident, db)

        except Exception as e:
            print(f"Exception in Maestro workflow: {e}")
            db.rollback()

    def resume_after_approval(self, incident_id: int, db: Session):
        """Resumes the workflow after human manager grants approval."""
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if incident and incident.status == "remediating":
            self.execute_remediation(incident, db)

    def execute_remediation(self, incident: Incident, db: Session):
        """Runs the simulated remediation scripts, logs auditing, and closes the incident."""
        time.sleep(2)  # Simulate scripts running
        
        # Trigger Audit Agent to compile final compliance report
        exec_audit = AgentExecution(
            incident_id=incident.id,
            agent_name="audit",
            status="running",
            started_at=datetime.datetime.utcnow()
        )
        db.add(exec_audit)
        db.commit()
        
        # Run Audit agent logic
        time.sleep(1)
        sim_res = aegis_agents.execute_agents_flow(incident.title, incident.description, "", "")
        audit_data = sim_res["audit"]
        
        exec_audit.status = "completed"
        exec_audit.completed_at = datetime.datetime.utcnow()
        
        res = AgentResult(
            execution_id=exec_audit.id,
            incident_id=incident.id,
            agent_name="audit",
            output_raw=audit_data["output_raw"],
            output_structured=json.dumps(audit_data),
            confidence_score=100.0
        )
        db.add(res)
        
        self._log_audit(incident.id, "agent_trigger", f"Audit Agent compiled compliance report: {audit_data['compliance_report']}", "info", "Agent: Audit", db)
        
        # Update incident to resolved -> closed
        self._update_incident_status(incident, "resolved", "Automated remediation plan completed successfully.", db)
        db.commit()
        
        time.sleep(1.5)
        self._update_incident_status(incident, "closed", "Incident closed automatically by Maestro.", db)
        
        self._log_audit(incident.id, "workflow_close", f"Maestro Incident Response Workflow for INC-{incident.id} completed successfully.", "info", "System", db)
        db.commit()
        
        # Refresh system metrics
        self._refresh_metrics(db)

    def _execute_agent_steps_with_retry(self, incident: Incident, log_content: str, sop_context: str, db: Session) -> dict:
        """Executes agents sequentially. If any agent step fails, it retries up to 3 times."""
        agent_names = ["intake", "log_analyst", "kb_search", "rca", "resolution"]
        
        # We fetch full flow data from service
        flow_data = aegis_agents.execute_agents_flow(incident.title, incident.description, log_content, sop_context)
        
        for name in agent_names:
            success = False
            retry_count = 0
            
            # Create execution record
            execution = AgentExecution(
                incident_id=incident.id,
                agent_name=name,
                status="running",
                started_at=datetime.datetime.utcnow()
            )
            db.add(execution)
            db.commit()
            
            # Audit log trigger
            self._log_audit(incident.id, "agent_trigger", f"Triggered {name.capitalize()} Agent.", "info", "System", db)
            
            # Simulate real-time progress for visual effect in UI
            time.sleep(1.5)
            
            while not success and retry_count <= 3:
                try:
                    # Simulated agent run (can add a 5% chance of mock failure for demonstrating retry handling!)
                    # Let's say if incident title contains 'retry' we force a failure once to demonstrate retry logic
                    if "retry" in incident.title.lower() and retry_count == 0:
                        raise ValueError("API connection timeout to LLM gateway.")
                        
                    # Save results
                    data_key = name
                    # map database names to flow keys
                    if name == "log_analyst":
                        data_key = "log"
                    elif name == "kb_search":
                        data_key = "kb"
                        
                    agent_output = flow_data[data_key]
                    
                    execution.status = "completed"
                    execution.completed_at = datetime.datetime.utcnow()
                    execution.retry_count = retry_count
                    
                    res = AgentResult(
                        execution_id=execution.id,
                        incident_id=incident.id,
                        agent_name=name,
                        output_raw=agent_output["output_raw"],
                        output_structured=json.dumps(agent_output),
                        confidence_score=agent_output.get("confidence_percentage", 100.0)
                    )
                    db.add(res)
                    db.commit()
                    
                    self._log_audit(incident.id, "agent_trigger", f"{name.capitalize()} Agent execution completed successfully.", "info", f"Agent: {name.capitalize()}", db)
                    success = True
                    
                except Exception as ex:
                    retry_count += 1
                    execution.retry_count = retry_count
                    
                    self._log_audit(
                        incident.id, 
                        "retry_triggered", 
                        f"{name.capitalize()} Agent failed (Attempt {retry_count}): {ex}. Retrying in queue...", 
                        "warning", 
                        "System", 
                        db
                    )
                    db.commit()
                    time.sleep(1)
                    
                    if retry_count > 3:
                        execution.status = "failed"
                        db.commit()
                        self._log_audit(
                            incident.id, 
                            "system_alert", 
                            f"{name.capitalize()} Agent failed permanently after 3 retries.", 
                            "critical", 
                            "System", 
                            db
                        )
                        return None
                        
        return flow_data

    def _update_incident_status(self, incident: Incident, status_to: str, comment: str, db: Session):
        old_status = incident.status
        incident.status = status_to
        
        history = IncidentHistory(
            incident_id=incident.id,
            status_from=old_status,
            status_to=status_to,
            comment=comment,
            changed_by="Maestro Orchestrator"
        )
        db.add(history)
        db.commit()

    def _log_audit(self, incident_id: int, event_type: str, details: str, severity: str, triggered_by: str, db: Session):
        audit = AuditLog(
            incident_id=incident_id,
            event_type=event_type,
            details=details,
            severity=severity,
            triggered_by=triggered_by
        )
        db.add(audit)

    def _refresh_metrics(self, db: Session):
        # Trigger updates to system metrics table
        # Find active, resolved and pending counts
        active = db.query(Incident).filter(Incident.status != "closed", Incident.status != "resolved").count()
        resolved = db.query(Incident).filter(Incident.status.in_(["resolved", "closed"])).count()
        pending = db.query(Approval).filter(Approval.status == "pending").count()
        
        metric = SystemMetric(
            active_incidents=active,
            resolved_incidents=resolved,
            pending_approvals=pending,
            agent_health_score=98.5
        )
        db.add(metric)
        db.commit()

import os
maestro_orchestrator = MaestroOrchestrator()

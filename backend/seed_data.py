import datetime
from app.db.session import SessionLocal, Base, engine
from app.db.models import User, Document, Incident, IncidentHistory, AuditLog, Approval
from app.api.endpoints.auth import get_password_hash
from app.services.rag_service import rag_service

def seed_database():
    db = SessionLocal()
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # 1. Check if users already seeded
        if db.query(User).count() > 0:
            print("Database already seeded with users.")
            return

        print("Seeding database...")

        # Create Users
        users = [
            User(username="admin", email="admin@aegisops.ai", hashed_password=get_password_hash("password"), role="admin"),
            User(username="manager", email="manager@aegisops.ai", hashed_password=get_password_hash("password"), role="manager"),
            User(username="engineer", email="engineer@aegisops.ai", hashed_password=get_password_hash("password"), role="engineer"),
            User(username="auditor", email="auditor@aegisops.ai", hashed_password=get_password_hash("password"), role="auditor"),
        ]
        db.add_all(users)
        db.commit()
        print("Seeding users completed. (Password for all is 'password')")

        # Create SOP Documents
        sops = [
            Document(
                title="Database Connection Pool Starvation Remediation Protocol",
                category="database",
                content=(
                    "SOP-DB-104: Resolving Database Pool Starvation. "
                    "When concurrent web traffic exceeds thread counts, database pools exhaust, resulting in 'OperationalError: connection limit exceeded'. "
                    "Remediation Steps:\n"
                    "1. Isolate the affected node using proxy configurations.\n"
                    "2. Identify idle connections by running: SELECT pid, state, query FROM pg_stat_activity WHERE state = 'idle'.\n"
                    "3. Kill orphaned database connections using pg_terminate_backend(pid).\n"
                    "4. Scale the service container replicas up by 2 to distribute connections."
                )
            ),
            Document(
                title="Redis Authentication Cache Eviction SOP",
                category="authentication",
                content=(
                    "SOP-AUTH-209: Resolving Redis Token Validation Loops. "
                    "Expired signing keys or stale Redis memory tables cause key validation errors (HTTP 500 on auth routes). "
                    "Remediation Steps:\n"
                    "1. Log into the active Redis node using redis-cli.\n"
                    "2. Run 'FLUSHDB' or 'DEL auth:session:tokens' to clear validation caches.\n"
                    "3. Force a reload of public authentication certificate signing keys in the web worker."
                )
            ),
            Document(
                title="Docker Volume Inode Exhaustion SOP",
                category="server",
                content=(
                    "SOP-SYS-301: Storage Volume Log Space Exhaustion. "
                    "Unconfigured Docker log files write indefinitely and consume all sector inodes, throwing disk write errors. "
                    "Remediation Steps:\n"
                    "1. Run 'df -h' and 'df -i' to identify the full mount partition.\n"
                    "2. Locate un-rotated Docker logs under /var/lib/docker/containers/.\n"
                    "3. Clear container log files by running: truncate -s 0 /var/lib/docker/containers/*/*-json.log.\n"
                    "4. Reload docker-daemon configuration with custom log-opts max-size=10m and max-file=3."
                )
            ),
            Document(
                title="Egress Load-Balancer TLS Webhook Timeout Guide",
                category="billing",
                content=(
                    "SOP-BILL-402: Stripe Webhook TLS Handshake Failures. "
                    "Tls handshakes fail when webhook validation attempts to hit depreciated certificates on load balancers. "
                    "Remediation Steps:\n"
                    "1. Check certificate chains on load balancer to ensure LetsEncrypt ISG root certificates are updated.\n"
                    "2. Fetch current Stripe IP addresses and whitelist on local firewall rules.\n"
                    "3. Perform a grace restart of Nginx load balancers to reload static TLS certificates."
                )
            )
        ]
        
        db.add_all(sops)
        db.commit()
        print("Seeding SOPs completed.")

        # Ingest SOPs into RAG vector index if active
        for sop in sops:
            rag_service.add_document(sop)

        # Create some demo historical incidents
        incidents = [
            Incident(
                title="Database pool exhausted on checkout service",
                description="The checkout API began throwing connection limit exceeded errors during checkout peaks. Transactions failed for 8 minutes.",
                severity="high",
                status="closed",
                intake_summary="Database connection pool starvation. Severity: HIGH. Assigned to Log Agent.",
                root_cause="Database connections exhausted by unclosed session cursor pools in Checkout API.",
                confidence_score=92.0,
                resolution_plan="Ran DB session reaper script and scaled pod replicas to 4.",
                risk_level="low",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3),
                updated_at=datetime.datetime.utcnow() - datetime.timedelta(days=3, hours=23)
            ),
            Incident(
                title="Stripe webhook handshake timed out on payment gateway",
                description="Webhooks from Stripe are failing with TLS handshake timeouts, billing status updates are blocked.",
                severity="critical",
                status="resolved",
                intake_summary="Billing system webhook communication outage. Severity: CRITICAL.",
                root_cause="Webhook timeout due to Stripe TLS certificate deprecation on Nginx gateway.",
                confidence_score=85.0,
                resolution_plan="Updated LetsEncrypt root certificate authority chains, restarted gateway.",
                risk_level="high",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                updated_at=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=22)
            ),
            Incident(
                title="Storage disk space warning on worker node-02",
                description="Worker node-02 disk capacity is at 98% sector utilization, causing performance degradation on task execution queues.",
                severity="medium",
                status="closed",
                intake_summary="Disk storage space warning. Severity: MEDIUM.",
                root_cause="Container logs writing indefinitely and consuming disk sector volumes.",
                confidence_score=99.0,
                resolution_plan="Truncated container JSON logs, configured log-rotate policy on Docker daemon.",
                risk_level="low",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=5),
                updated_at=datetime.datetime.utcnow() - datetime.timedelta(days=5, hours=23, minutes=30)
            )
        ]
        
        db.add_all(incidents)
        db.commit()
        
        # Seed history and audit logs for these incidents
        for inc in incidents:
            # History
            h1 = IncidentHistory(
                incident_id=inc.id,
                status_from="none",
                status_to="open",
                comment="Incident submitted by System alerts monitoring.",
                changed_by="System"
            )
            h2 = IncidentHistory(
                incident_id=inc.id,
                status_from="open",
                status_to="closed" if inc.status == "closed" else "resolved",
                comment="Maestro workflow executed remediation automatically.",
                changed_by="Maestro Orchestrator"
            )
            db.add_all([h1, h2])
            
            # Audit
            audit = AuditLog(
                incident_id=inc.id,
                event_type="workflow_close",
                details=f"Incident {inc.title} resolved successfully by automated remediation rules.",
                severity="info",
                triggered_by="System"
            )
            db.add(audit)
            
        db.commit()
        print("Seeding demo incidents completed.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

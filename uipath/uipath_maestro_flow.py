import time
import requests

BASE_URL = "http://localhost:8000/api"

def run_maestro_workflow_simulation():
    print("="*60)
    print("UiPath Maestro - Automated Multi-Agent Incident Response Flow")
    print("="*60)
    
    # 1. Authenticate as Engineer
    print("\n[Step 1] Authenticating with AegisOps Command Center...")
    try:
        auth_res = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "engineer",
            "password": "password"
        })
        auth_res.raise_for_status()
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Authentication successful. Security token acquired.")
    except Exception as e:
        print(f"✗ Failed to connect to AegisOps Backend API: {e}")
        print("Please ensure the FastAPI application is running locally at http://localhost:8000")
        return

    # 2. File Incident
    print("\n[Step 2] Submitting new Operational Incident...")
    incident_data = {
        "title": "Uncaught OperationalError: connection pool limit exceeded in transaction pool",
        "description": "User API gateway is throwing HTTP 500 connection refused errors during checkout traffic spikes.",
        "severity": "critical" # Critical triggers human approval
    }
    
    try:
        # File incident
        inc_res = requests.post(f"{BASE_URL}/incidents", data=incident_data, headers=headers)
        inc_res.raise_for_status()
        incident = inc_res.json()
        incident_id = incident["id"]
        print(f"✓ Incident registered. Incident ID: INC-{incident_id}")
    except Exception as e:
        print(f"✗ Failed to file incident: {e}")
        return

    # 3. Monitor Multi-Agent Sequence (Intake -> Log Scan -> RAG -> RCA -> Resolution)
    print("\n[Step 3] Monitoring Maestro sequential multi-agent execution pipeline...")
    
    completed_steps = set()
    while True:
        status_res = requests.get(f"{BASE_URL}/agents/status/{incident_id}", headers=headers)
        status_res.raise_for_status()
        steps = status_res.json()
        
        # Print status updates
        for step in steps:
            step_name = step["agent_name"]
            step_status = step["status"]
            
            status_key = f"{step_name}:{step_status}"
            if status_key not in completed_steps:
                print(f"  → Agent: {step_name.capitalize()} status updated to: {step_status}")
                completed_steps.add(status_key)
                
        # Check overall incident status
        inc_detail_res = requests.get(f"{BASE_URL}/incidents/{incident_id}", headers=headers)
        inc_detail_res.raise_for_status()
        current_incident = inc_detail_res.json()
        current_status = current_incident["status"]
        
        if current_status == "waiting_approval":
            print("\n[Step 4] Maestro Orchestration suspended: WAITING_APPROVAL.")
            print("  → Severity is CRITICAL. Escalation Agent has triggered the manager approvals queue.")
            print("  → Probable Root Cause identified by RCA Agent:")
            print(f"    \"{current_incident['root_cause']}\" (Confidence: {current_incident['confidence_score']}%)")
            print("  → Suggested Automated Resolution Plan:")
            for line in current_incident["resolution_plan"].split("\n")[:4]:
                print(f"    {line}")
            break
            
        time.sleep(1.5)

    print("\n[Step 5] Human-in-the-loop validation simulation...")
    print("  → Authenticating as Manager to action approval...")
    try:
        mgr_auth_res = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "manager",
            "password": "password"
        })
        mgr_auth_res.raise_for_status()
        mgr_token = mgr_auth_res.json()["access_token"]
        mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
        
        # Find active approval
        appr_res = requests.get(f"{BASE_URL}/approvals", headers=mgr_headers)
        appr_res.raise_for_status()
        approvals = appr_res.json()
        
        pending_appr = next((a for a in approvals if a["incident_id"] == incident_id and a["status"] == "pending"), None)
        if pending_appr:
            print(f"  → Found pending authorization APPR-{pending_appr['id']}. Sending approval decision...")
            requests.post(f"{BASE_URL}/approvals/{pending_appr['id']}", json={
                "status": "approved",
                "comments": "Approved. Connections look starved, proceed with database re-scaler scripts."
            }, headers=mgr_headers)
            print("✓ Manager Approval granted. Automated execution resumed.")
        else:
            print("✗ No pending approvals found.")
            return
    except Exception as e:
        print(f"✗ Failed to authenticate manager or action approval: {e}")
        return

    # 4. Monitor closure
    print("\n[Step 6] Running automated remediation script & compiling audit log...")
    while True:
        inc_detail_res = requests.get(f"{BASE_URL}/incidents/{incident_id}", headers=headers)
        inc_detail_res.raise_for_status()
        current_incident = inc_detail_res.json()
        current_status = current_incident["status"]
        
        if current_status == "closed":
            print("✓ Incident state updated to CLOSED.")
            break
        elif current_status == "resolved":
            print("  → Remediation script execution completed. Status: RESOLVED.")
            
        time.sleep(1.5)

    # 5. Fetch Audit Trail
    print("\n[Step 7] Extracting immutable SOC audit logs...")
    try:
        audit_res = requests.get(f"{BASE_URL}/audit?incident_id={incident_id}", headers=headers)
        audit_res.raise_for_status()
        logs = audit_res.json()
        print(f"✓ Retrieved {len(logs)} audit records for INC-{incident_id}:")
        for log in reversed(logs):
            print(f"  [{log['timestamp']}] ({log['severity'].upper()}) Triggered by {log['triggered_by'] or 'System'}: {log['details']}")
    except Exception as e:
        print(f"✗ Failed to extract audit logs: {e}")

    print("\n" + "="*60)
    print("Maestro incident response simulation completed successfully.")
    print("="*60)

if __name__ == "__main__":
    run_maestro_workflow_simulation()

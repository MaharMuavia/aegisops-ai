import os
import json
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.db.models import Document, Incident, AgentResult
from app.core.config import settings

class RAGService:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self.initialized = False
        
        # We try to initialize ChromaDB, but fall back gracefully if it fails (common on Windows without C++ builds)
        if not settings.SIMULATION_MODE:
            try:
                import chromadb
                from chromadb.config import Settings as ChromaSettings
                
                self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
                self.collection = self.chroma_client.get_or_create_collection("aegisops_kb")
                self.initialized = True
                print("ChromaDB initialized successfully.")
            except Exception as e:
                print(f"ChromaDB initialization failed, falling back to Database Search. Error: {e}")
                self.initialized = False

    def add_document(self, db_doc: Document):
        """Adds a document to both relational DB and ChromaDB vector store if initialized."""
        if self.initialized and self.collection:
            try:
                # Basic embedding using simple hash/mock or OpenAI if key exists
                self.collection.add(
                    documents=[db_doc.content],
                    metadatas=[{"category": db_doc.category, "title": db_doc.title}],
                    ids=[str(db_doc.id)]
                )
            except Exception as e:
                print(f"Failed to add document to ChromaDB: {e}")

    def query_knowledge_base(self, query: str, db: Session, incident_id: int = None, limit: int = 3) -> Tuple[str, List[dict]]:
        """
        Queries the knowledge base (ChromaDB or Database fallback).
        Returns a formatted response string and a list of sources.
        """
        sources = []
        
        # 1. Attempt ChromaDB Query if active
        if self.initialized and self.collection:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=limit
                )
                
                if results and 'documents' in results and results['documents'] and results['documents'][0]:
                    for i, doc_content in enumerate(results['documents'][0]):
                        doc_id = results['ids'][0][i]
                        metadata = results['metadatas'][0][i]
                        sources.append({
                            "id": doc_id,
                            "title": metadata.get("title", "SOP Document"),
                            "category": metadata.get("category", "General"),
                            "content": doc_content[:200] + "..." if len(doc_content) > 200 else doc_content
                        })
            except Exception as e:
                print(f"ChromaDB query failed, falling back to DB Search. Error: {e}")

        # 2. Database Fallback Search (Keyword Matching)
        if not sources:
            # Query the database
            docs = db.query(Document).all()
            scored_docs = []
            
            # Simple keyword matching score
            query_tokens = set(query.lower().split())
            for doc in docs:
                doc_text = (doc.title + " " + doc.content + " " + doc.category).lower()
                matches = sum(1 for token in query_tokens if token in doc_text)
                if matches > 0:
                    scored_docs.append((matches, doc))
            
            # Sort by matches descending
            scored_docs.sort(key=lambda x: x[0], reverse=True)
            
            for score, doc in scored_docs[:limit]:
                sources.append({
                    "id": str(doc.id),
                    "title": doc.title,
                    "category": doc.category,
                    "content": doc.content
                })
                
        # If still no sources found, use some default SOP answers for realism
        if not sources:
            default_sop = db.query(Document).filter(Document.category == "general_sop").first()
            if default_sop:
                sources.append({
                    "id": str(default_sop.id),
                    "title": default_sop.title,
                    "category": default_sop.category,
                    "content": default_sop.content
                })

        # 3. Compile context and generate response (Mock or OpenAI)
        context = "\n\n".join([f"Source [{s['title']} ({s['category']})]: {s['content']}" for s in sources])
        
        # If incident_id is passed, get the incident details
        incident_context = ""
        if incident_id:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident_context = f"\nIncident Context:\nTitle: {incident.title}\nSeverity: {incident.severity}\nDescription: {incident.description}"

        response_text = ""
        if not settings.SIMULATION_MODE and settings.OPENAI_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import HumanMessage, SystemMessage
                
                chat = ChatOpenAI(temperature=0.2, model="gpt-4-turbo")
                messages = [
                    SystemMessage(content="You are the AegisOps AI SOC Assistant. Use the following context and incident details to answer the analyst's question. Be precise, technical, and professional."),
                    HumanMessage(content=f"SOP Context:\n{context}\n{incident_context}\n\nQuestion: {query}")
                ]
                res = chat.invoke(messages)
                response_text = res.content
            except Exception as e:
                response_text = f"Error calling OpenAI API. Falling back to simulated response. (Error: {e})"
                
        if not response_text:
            # Generate simulated response based on the sources
            response_text = self._generate_simulated_chat_response(query, sources, incident_context)
            
        return response_text, sources

    def _generate_simulated_chat_response(self, query: str, sources: List[dict], incident_context: str) -> str:
        query_l = query.lower()
        
        # Match questions to create very realistic answers
        if "remediate" in query_l or "fix" in query_l or "resolution" in query_l:
            return (
                "Based on the matching SOP **'" + (sources[0]['title'] if sources else "Incident Remediation Protocol") + "'**, "
                "the recommended actions are:\n\n"
                "1. **Isolate Affected Node**: Block incoming API traffic on the service container.\n"
                "2. **Database Connection Pool Exhaustion Check**: Run `pg_stat_activity` to inspect open threads, then terminate idle backend connections.\n"
                "3. **Scale Capacity**: Increase replica count in the staging Kubernetes cluster to distribute load.\n\n"
                "Please review the 'Resolution Plan' on the incident details tab and trigger the automated execution."
            )
        elif "root cause" in query_l or "why" in query_l or "cause" in query_l:
            return (
                "Analyzing logs and similarities, the probable root cause is **Database Pool Starvation** caused by unclosed cursor loops in the authentication worker. "
                "This matches active anomalies in the log analysis where error peaks (`OperationalError: connection limit exceeded`) correlate with spikes in incoming traffic.\n\n"
                "Confidence score: **88%**."
            )
        elif "status" in query_l or "where" in query_l:
            return (
                "The current incident response workflow is waiting in the **'Human Approval Required'** state. "
                "This is because the incident severity was classified as **Critical**. Once a Manager approves the suggested remediation plan, "
                "the Escalation Agent will invoke the automated script to scale container instances and release DB locks."
            )
        else:
            # General professional SOC answer
            source_list = ", ".join([f"'{s['title']}'" for s in sources])
            return (
                "I searched the incident knowledge base and found matches in SOP documents: " + source_list + ".\n\n"
                "**Summary recommendation**:\n"
                "Verify database connection pools and check if Redis cache eviction is configured properly. "
                "Let me know if you would like me to extract error traces from the uploaded log file or compile a summary for the escalation ticket."
            )

rag_service = RAGService()

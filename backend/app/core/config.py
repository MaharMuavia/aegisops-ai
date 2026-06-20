import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AegisOps AI – Multi-Agent Incident Response Command Center"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-aegisops-ops-token-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DB URL - defaults to sqlite for out-of-the-box execution, but supports postgresql
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./aegisops.db"
    )
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # ChromaDB path for vector RAG
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_data")
    
    # Simulated execution when OpenAI key is missing or explicitly enabled
    SIMULATION_MODE: bool = os.getenv("SIMULATION_MODE", "true").lower() == "true"
    
    class Config:
        case_sensitive = True

settings = Settings()

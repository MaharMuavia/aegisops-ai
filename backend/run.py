import os
import uvicorn
from app.db.session import engine, Base
from seed_data import seed_database

if __name__ == "__main__":
    print("Initialize AegisOps AI SOC database schema...")
    Base.metadata.create_all(bind=engine)

    print("Seeding database with default parameters...")
    seed_database()

    # Port is overridable via APP_PORT; defaults to 8001 for local dev (8000 is
    # commonly occupied on this machine). Docker runs uvicorn directly on 8000.
    port = int(os.getenv("APP_PORT", "8001"))
    print(f"Launching FastAPI Web Server on http://localhost:{port}...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)

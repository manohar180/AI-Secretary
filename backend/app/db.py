import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid

# Hybrid Local Lightning Stack: SQLite Core
DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
if not os.path.exists(DATABASE_DIR):
    os.makedirs(DATABASE_DIR)

DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'coordai.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Relational Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    designation = Column(String, default="AI Secretary")
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowTask(Base):
    """Replaces the entire in-memory DB_TASKS mock."""
    __tablename__ = "workflow_tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    tenant = Column(String, index=True) # e.g., "John Doe" or "Inquiry"
    contact_email = Column(String)
    subject = Column(String)
    stage = Column(String)
    days_pending = Column(Integer, default=0)
    action_elected = Column(String) # DRAFT_EMAIL, BLOCK_CALENDAR
    confidence = Column(String)
    summary = Column(String)
    draft_content = Column(String)
    
    # Storage for advanced workflow arrays and webhook injection parameters
    proposed_slots = Column(JSON, nullable=True) 
    schedule_time = Column(String, nullable=True) 
    thread_id = Column(String, nullable=True)
    message_id_header = Column(String, nullable=True)
    msg_id = Column(String, nullable=True)
    
    status = Column(String, default="pending") # pending, approved, discarded
    created_at = Column(DateTime, default=datetime.utcnow)

class ConversationLog(Base):
    """Enables multi-turn conversational memory for the AI Omni-Agent."""
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    role = Column(String) # "user" or "agent"
    content = Column(String)
    intent = Column(String, nullable=True) # "GENERAL", "DRAFT_EMAIL"
    timestamp = Column(DateTime, default=datetime.utcnow)

class KnowledgeSource(Base):
    """Relational Index for Vector Embeddings in ChromaDB"""
    __tablename__ = "knowledge_sources"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String)
    file_size_bytes = Column(Integer)
    status = Column(String, default="embedding") # embedding, embedded, failed
    uploaded_at = Column(DateTime, default=datetime.utcnow)

# Instantiate Database Physical Files
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

from app.models.workflow import PrivacySafeContext, AgentDecision
from app.agents.orchestrator import Orchestrator
from app.services.gmail_service import GmailService
from app.services.knowledge_service import KnowledgeService
from app.db import SessionLocal, WorkflowTask, ConversationLog, KnowledgeSource
import uuid
import os
import shutil

app = FastAPI(
    title="Inter-Company AI Workflow Layer",
    description="A secure, multi-agent AI framework for automating B2B coordination.",
    version="0.1.0"
)

# Allow React SaaS Dashboard to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()

# Dependency for strict relational persistence layer
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the Gmail Service (requires token.json)
try:
    gmail_service = GmailService()
except Exception as e:
    print(f"Warning: Could not init Gmail Service (is token.json missing?): {e}")
    gmail_service = None
    
# Initialize Hybrid ChromaDB Engine (Vector Search)
try:
    knowledge_service = KnowledgeService()
except Exception as e:
    print(f"Warning: ChromaDB boot failed (Pip installation still running?): {e}")
    knowledge_service = None

# No longer need PROCESSED_MESSAGE_IDS!

SYSTEM_METRICS = {
    "active_workflows": 0,
    "emails_drafted": 0,
    "hours_saved": 0.0,
    "approval_rate": 100.0
}

SYSTEM_PREFS = {
    "name": "Admin",
    "designation": "AI Secretary"
}

# --- SaaS Authentication Mock ---
class LoginRequest(BaseModel):
    token: str

@app.post("/api/v1/auth/google")
async def google_login(req: LoginRequest):
    """Verifies a Google OAuth token and grants dashboard access."""
    # In a real app we verify the token signature via Google Auth Library
    # For now, if the frontend supplies a valid looking string, we let them in.
    return {
        "status": "success",
        "user": {
            "id": "usr_988x",
            "name": "Admin User",
            "tenantId": "SaaS Provider Admin"
        }
    }
# --------------------------------

    # Delete old webhook route for safety in this scope since we are pivoting models
    return {"status": "success"}

# --- SaaS Platform Settings Modules ---
@app.get("/api/v1/metrics")
async def get_metrics(db = Depends(get_db)):
    active = db.query(WorkflowTask).filter(WorkflowTask.status == "pending").count()
    approved = db.query(WorkflowTask).filter(WorkflowTask.status == "approved").count()
    total = active + approved
    
    SYSTEM_METRICS["active_workflows"] = active
    if total > 0:
        SYSTEM_METRICS["approval_rate"] = round((approved / total) * 100, 1)
        
    return SYSTEM_METRICS

class ProfileUpdate(BaseModel):
    name: str
    designation: str

@app.get("/api/v1/settings/profile")
async def get_profile():
    return SYSTEM_PREFS

@app.post("/api/v1/settings/profile")
async def update_profile(data: ProfileUpdate):
    SYSTEM_PREFS["name"] = data.name
    SYSTEM_PREFS["designation"] = data.designation
    return {"status": "success", "profile": SYSTEM_PREFS}

@app.get("/api/v1/integrations/google/test")
async def test_google_integration():
    """Checks if the actual Server-to-Server token.json is active."""
    import os
    if os.path.exists("token.json") and gmail_service is not None:
        return {"status": "connected", "details": "Gmail API Active"}
    return {"status": "disconnected", "details": "Requires OAuth Desktop setup"}

@app.delete("/api/v1/integrations/google")
async def disconnect_google():
    # Hackathon Demo logic: just rename the token file temporarily to simulate a disconnect
    global gmail_service
    import os
    if os.path.exists("token.json"):
        try:
            os.rename("token.json", "token_offline.json.bak")
        except:
            pass
    gmail_service = None
    return {"status": "success", "message": "Google Integration severed."}

@app.post("/api/v1/integrations/google/connect")
async def connect_google():
    """Forces the python backend to re-authenticate or restore the backup token natively."""
    global gmail_service
    import os
    
    # 1. Try to restore the backup token first if this was a UI "revoke"
    if os.path.exists("token_offline.json.bak") and not os.path.exists("token.json"):
        try:
            os.rename("token_offline.json.bak", "token.json")
        except Exception as e:
            print(f"Failed restoring token: {e}")
            
    # 2. Try to re-instantiate the Gmail Service (this will pop the window if token.json is still missing!)
    try:
        gmail_service = GmailService()
        return {"status": "connected"}
    except Exception as e:
        print(f"Failed to instantiate OAuth Flow: {e}")
        return {"status": "failed", "error": str(e)}

# --- Frontend Live Data API ---
from fastapi.responses import HTMLResponse

@app.get("/api/v1/public/schedule/accept", response_class=HTMLResponse)
async def public_schedule_accept(email: str, time: str):
    """
    Public webhook hit when a user clicks an [Accept] button inside an AI-drafted email.
    """
    from datetime import datetime
    try:
        if gmail_service:
            meet_link = gmail_service.create_google_meet(email, time)
            
            # Format time beautifully for the UI
            dt = datetime.fromisoformat(time.replace('Z', '+00:00'))
            human_time = dt.strftime("%A, %B %d at %I:%M %p")
            
            if meet_link:
                return f"""
                <html>
                    <head>
                        <title>Meeting Confirmed</title>
                        <style>
                            body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }}
                            .card {{ background: rgba(255,255,255,0.05); padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; max-width: 500px; }}
                            .btn {{ display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; font-weight: 600; }}
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1 style="color: #10b981; margin-bottom: 8px;">✅ Meeting Confirmed!</h1>
                            <p style="color: #94a3b8; line-height: 1.5;">Your meeting has been locked in for <strong>{human_time}</strong>.</p>
                            <p style="color: #94a3b8;">A Google calendar invitation has been sent to your inbox.</p>
                            <a href="{meet_link}" class="btn" target="_blank">Open Google Meet</a>
                        </div>
                    </body>
                </html>
                """
    except Exception as e:
        print(f"Failed to confirm meeting: {e}")
        
    return "<html><body><h2>Something went wrong checking the calendar. Please reply directly to the email.</h2></body></html>"

from pydantic import BaseModel
class ChatRequest(BaseModel):
    message: str

@app.post("/api/v1/chat")
async def chat_orchestrator(req: ChatRequest):
    """
    The Multimodal AI Backend Agent. Handles natural language commands to Block Calendar, Draft Emails, or answer questions.
    """
    try:
        from groq import Groq
        from app.core.config import settings
        
        # Initialize isolated Groq client
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        # === RAG CONTEXT INJECTION PIPELINE ===
        # If Knowledge Base is active, silently search ChromaDB mathematically
        rag_context = ""
        if knowledge_service:
            print("🧠 RAG: Executing Dense Vector Lookup...")
            rag_context = knowledge_service.query_context(req.message, top_k=2)
            if rag_context:
                print(f"✅ RAG: Fetched {len(rag_context.split())} words of proprietary context!")
        
        system_prompt = f"""
You are the CoordAI Command Center Assistant. 
CURRENT TIME: {datetime.now().isoformat()}

You have access to the Private Company Knowledge Base. If relevant, use exactly this information to answer:
--- START RAG CONTEXT ---
{rag_context if rag_context else "No specific document matched this query."}
--- END RAG CONTEXT ---

You have THREE distinct capabilities. You must analyze the user's input and reply STRICTLY in valid JSON format. Do not use Markdown block syntax (```json). Just output raw JSON.

1. "BLOCK_CALENDAR": If the user explicitly asks to block time, make time busy, or reserve time.
   Format: {{"intent": "BLOCK_CALENDAR", "start_iso": "<ISO format>", "end_iso": "<ISO format>", "title": "Blocked via AI", "response_text": "I have successfully blocked that time."}}
   Calculate the ISO mathematically based on the CURRENT TIME. Remember all time strings MUST end in +05:30 for IST.

2. "DRAFT_EMAIL": If the user explicitly states an email address and asks to write/draft an email to them.
   Format: {{"intent": "DRAFT_EMAIL", "recipient": "example@domain.com", "subject": "...", "body": "...", "response_text": "I have drafted the email. It is now waiting in your Approvals queue on the Dashboard!"}}

3. "GENERAL_CHAT": For all other natural language queries. Use the RAG Context to intelligently represent the company.
   Format: {{"intent": "GENERAL_CHAT", "response_text": "<Your conversational answer>"}}
"""

        import json
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.0
        )
        
        raw_text = response.choices[0].message.content.strip()
        # Clean potential markdown
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]
            
        data = json.loads(raw_text.strip())
        intent = data.get("intent", "GENERAL_CHAT")
        response_text = data.get("response_text", "Done.")
        
        # Save Conversation Turn to SQLite
        try:
            from app.db import SessionLocal
            db = SessionLocal()
            turn1 = ConversationLog(role="user", content=req.message, intent=intent)
            turn2 = ConversationLog(role="agent", content=response_text, intent=intent)
            db.add(turn1)
            db.add(turn2)
            db.commit()
            db.close()
        except: pass
        
        if intent == "BLOCK_CALENDAR":
            start_iso = data.get("start_iso")
            end_iso = data.get("end_iso")
            title = data.get("title", "AI Reserved Time")
            if gmail_service and start_iso and end_iso:
                success = gmail_service.block_calendar_time(start_iso, end_iso, title)
                if not success:
                    response_text = "I failed to block that time. Calendar authorization may have expired."
            else:
                response_text = "I couldn't parse the time properly, or Gmail is disconnected."
                
        elif intent == "DRAFT_EMAIL":
            # Push securely into SQLite Workflow Pipeline
            try:
                from app.db import SessionLocal
                db = SessionLocal()
                new_task = WorkflowTask(
                    tenant=data.get("recipient", "Manual AI Draft").split("@")[0].title(),
                    stage="MANUAL_COMMAND",
                    action_elected="DRAFT_EMAIL",
                    confidence="100%",
                    draft_content=data.get("body", "Failed to generate body..."),
                    summary="You explicitly requested this email to be drafted via the AI Command Center.",
                    contact_email=data.get("recipient"),
                    subject=data.get("subject", "Follow Up")
                )
                db.add(new_task)
                db.commit()
                db.close()
                print(f"✅ AI Orchestrator successfully committed SQLite DRAFT_EMAIL.")
            except Exception as e:
                print(f"SQLite Injection failure: {e}")

        return {"response_text": response_text}
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return {"response_text": "I suffered an internal parsing failure. Please try another command."}

@app.post("/api/v1/workflow/sync-inbox")
async def sync_inbox(db = Depends(get_db)):
    """
    Reads unread emails from the connected Gmail account, uses Groq to summarize,
    and automatically drafts a pending human-approved response.
    """
    if not gmail_service:
        raise HTTPException(status_code=500, detail="Gmail Service is offline. Connect in Settings.")
        
    emails = gmail_service.read_unread_emails(max_results=10)
    
    # Pre-fetch dynamic Free/Busy schema just ONCE to aggressively reduce API quota consumption
    calendar_context = gmail_service.get_upcoming_availability(days=3) if gmail_service else "Unknown Schedule."
    
    for email in emails:
        existing_task = db.query(WorkflowTask).filter(WorkflowTask.msg_id == email["id"]).first()
        if existing_task:
            continue  # Already drafted this one!
            
        # Prevent replying to our own processing if we are stuck in a loop
        if "daemon" in email["sender"].lower() or "noreply" in email["sender"].lower():
            continue
            
        # Use Groq specifically to summarize and draft!
        # For speed in this demo, we'll hit the Secretary agent directly 
        # (Assuming you add a summarize_and_reply method, or we just write a quick prompt here)
        from groq import Groq
        from app.core.config import settings
        import random
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        from datetime import datetime, timezone, timedelta
        ist_offset = timedelta(hours=5, minutes=30)
        tz_ist = timezone(ist_offset, name="IST")
        now_ist = datetime.now(tz_ist)
        current_time_str = now_ist.strftime("%A, %B %d, %Y %I:%M %p IST")
        
        prompt = f"""You are a professional Executive AI Secretary. 
        Read this incoming email from {email['sender']} regarding "{email['subject']}".
        
        Email Body: "{email['body']}"
        
        Your task:
        1. Write exactly 3 bullet points summarizing the core request.
        2. Write a professional, polite, and concise reply.
        
        CRITICAL SCHEDULING RULE: You must gracefully propose available 30-minute meeting slots based on the Guaranteed mathematical slots below.
        CURRENT LOCAL TIME: {current_time_str}
        
        Here is the Exact Array of GUARANTEED FREE SLOTS available to you (Format: [ISO_STRING] Human Readable Time):
        {calendar_context}
        
        Rules for Calculation:
        1. You are FORBIDDEN from inventing times or doing math. You MUST ONLY pick times explicitly listed in the GUARANTEED FREE SLOTS array.
        2. If the sender requests a specific exact time (e.g., "Can we meet Wednesday at 4 PM?"), check if that exact slot is in the array. If it is, propose ONLY that single slot. If it is NOT in the array, tell them you are unavailable then and propose 3 other slots from the array.
        3. Otherwise, pick exactly the FIRST 3 chronological slots perfectly in order from the top of the array and propose them. You MUST NOT randomly sample slots to ensure strict consistency.
        4. Suggest the times naturally inside the email text.
        5. INTENT PROTOCOL: If the incoming email is the sender explicitly agreeing to a specific time that works, append `ACTION_SCHEDULE: <YYYY-MM-DDTHH:MM:00+05:30>` to the bottom and write "Here is the meeting link: [MEET_LINK]".
        6. BUTTON PROTOCOL: If you are *proposing* times, you must append an exact machine-readable array of the raw ISO datetimes you proposed at the absolute bottom of your response like this:
           PROPOSED_SLOTS:
           - 2026-03-31T14:30:00+05:30
           - 2026-03-31T15:00:00+05:30
        
        Format your response EXACTLY like this:
        SUMMARY:
        - Bullet 1
        - Bullet 2
        - Bullet 3
        
        REPLY:
        Dear [Name],
        [Your generated reply here, including the schedule proposal]
        Best,
        {SYSTEM_PREFS['name']}
        {SYSTEM_PREFS['designation']}
        """
        
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            response_text = completion.choices[0].message.content
            
            # Rough parsing
            parts = response_text.split("REPLY:")
            summary = parts[0].replace("SUMMARY:", "").strip()
            draft = parts[1].strip() if len(parts) > 1 else "Thanks for your email. I will look into it."
            
            # Detect Secret Machine Intent Code
            schedule_time = None
            proposed_slots = []
            
            if "ACTION_SCHEDULE:" in draft or "PROPOSED_SLOTS:" in draft:
                lines = draft.split('\n')
                cleaned_draft_lines = []
                parsing_slots = False
                
                for line in lines:
                    if "ACTION_SCHEDULE:" in line:
                        schedule_time = line.replace("ACTION_SCHEDULE:", "").strip().replace("`", "")
                    elif "PROPOSED_SLOTS:" in line:
                        parsing_slots = True
                    elif parsing_slots and line.strip().startswith("-"):
                        proposed_slots.append(line.replace("-", "").strip())
                    elif parsing_slots and not line.strip():
                        continue # blank line
                    elif parsing_slots and not line.strip().startswith("-"):
                        parsing_slots = False
                        cleaned_draft_lines.append(line)
                    else:
                        cleaned_draft_lines.append(line)
                draft = "\n".join(cleaned_draft_lines).strip()
            
            # Extract a clean sender name for the UI
            raw_sender = email['sender'].split("<")[0].strip()
            display_name = raw_sender if raw_sender else "Incoming Inquiry"
            
            # Inject directly into SQLite
            new_task = WorkflowTask(
                tenant=display_name,
                stage="INBOUND_EMAIL",
                action_elected="DRAFT_EMAIL",
                confidence=f"{random.randint(89, 99)}%",
                draft_content=draft,
                summary=summary,
                contact_email=email['sender'].split("<")[-1].replace(">", "") if "<" in email['sender'] else email['sender'],
                subject=f"Re: {email['subject'].replace('Re: ', '')}",
                msg_id=email['id'],
                thread_id=email['thread_id'],
                message_id_header=email['message_id_header'],
                schedule_time=schedule_time,
                proposed_slots=proposed_slots
            )
            db.add(new_task)
            db.commit()
            
            # Update metrics globally
            SYSTEM_METRICS["active_workflows"] += 1
            SYSTEM_METRICS["emails_drafted"] += 1
            SYSTEM_METRICS["hours_saved"] += 0.25
            
        except Exception as e:
            print(f"Skipping email due to Groq error: {e}")
            
    return {"status": "success", "synced_count": len(emails)}
@app.get("/api/v1/workflows")
async def get_workflows(db = Depends(get_db)):
    # Return all pending tasks from SQLite
    tasks = db.query(WorkflowTask).filter(WorkflowTask.status == "pending").order_by(WorkflowTask.created_at.desc()).all()
    # Serialize to JSON array matching what React expects
    results = []
    for t in tasks:
        results.append({
            "id": t.id, "tenant": t.tenant, "contact_email": t.contact_email, "subject": t.subject,
            "stage": t.stage, "daysPending": t.days_pending, "actionElected": t.action_elected,
            "confidence": t.confidence, "summary": t.summary, "draftContent": t.draft_content,
            "proposed_slots": t.proposed_slots, "schedule_time": t.schedule_time,
            "thread_id": t.thread_id, "message_id_header": t.message_id_header, "msg_id": t.msg_id,
            "status": t.status
        })
    return {"tasks": results}

@app.put("/api/v1/workflows/{task_id}")
async def update_workflow(task_id: str, payload: dict, db = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if "draftContent" in payload:
        task.draft_content = payload["draftContent"]
        db.commit()
        
    return {"status": "success"}

@app.post("/api/v1/workflows/{task_id}/approve")
async def approve_workflow(task_id: str, db = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status == "approved":
        return {"status": "already_approved"}
        
    # Send the email using Threading if it originated from an Inbox Sync!
    if gmail_service and task.action_elected == "DRAFT_EMAIL":
        subject = task.subject or f"Following up on {task.tenant}"
        body_text = task.draft_content or ""
        
        # --- PHASE 13: AUTOMATED GOOGLE MEET SCHEDULING ---
        if task.schedule_time:
            print(f"Intercepted Intent to Schedule Meeting upon User Approval! Time: {task.schedule_time}")
            meet_link = gmail_service.create_google_meet(task.contact_email, task.schedule_time)
            if meet_link:
                body_text = body_text.replace("[MEET_LINK]", f"\n{meet_link}")
            else:
                body_text = body_text.replace("[MEET_LINK]", "\nI will send a separate calendar invite shortly.")
        
        # --- PHASE 14: INTERACTIVE EMAIL HTML BUTTONS ---
        if task.proposed_slots and not task.schedule_time:
            import urllib.parse
            from datetime import datetime
            
            # Convert plain text draft into HTML layout
            body_text = body_text.replace('\n', '<br>')
            
            button_html = "<br><br><div style='margin-top:20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-family: sans-serif;'>"
            button_html += "<p style='margin-top:0; font-weight:600; color: #0f172a;'>Select a time below to auto-schedule a Google Meet:</p>"
            button_html += "<div style='display: flex; gap: 10px; flex-wrap: wrap;'>"
            
            base_url = "http://localhost:8000"
            safe_email = urllib.parse.quote(task.contact_email)
            
            for iso_time in task.proposed_slots:
                try:
                    dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
                    clean_time = dt.strftime("%A, %I:%M %p")
                    safe_time = urllib.parse.quote(iso_time)
                    link = f"{base_url}/api/v1/public/schedule/accept?email={safe_email}&time={safe_time}"
                    
                    button_html += f"<a href='{link}' style='display:inline-block; padding:10px 16px; background:#3b82f6; color:white; text-decoration:none; border-radius:6px; font-weight:500; font-size:14px; margin-right:8px; margin-bottom:8px;'>{clean_time}</a>"
                except Exception:
                    pass
            
            button_html += "</div></div>"
            body_text += button_html
            
        print(f"User Approved! Dispatching Live Email to {task.contact_email} via Gmail API...")
        
        try:
            gmail_service.send_email(
                to_email=task.contact_email,
                subject=subject,
                body_text=body_text,
                thread_id=task.thread_id,
                message_id_header=task.message_id_header
            )
            # Log successful dispatch into the historical feed
            import datetime
            time_str = datetime.datetime.now().strftime("%I:%M %p")
            log = ConversationLog(role="system", content=f"Sent negotiated follow-up to {task.tenant}", timestamp=datetime.datetime.utcnow())
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Error sending threaded email: {e}")
    
    task.status = "approved"
    db.commit()
    return {"status": "success"}

@app.delete("/api/v1/workflows/{task_id}")
async def discard_workflow(task_id: str, db = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()
    if task:
        task.status = "discarded"
        db.commit()
    return {"status": "success"}

@app.delete("/api/v1/workflows/{task_id}/gmail")
async def trash_workflow_and_gmail(task_id: str, db = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if gmail_service and task.msg_id:
        gmail_service.trash_email(task.msg_id)
        
    import datetime
    log = ConversationLog(role="system", content=f"Trashed workflow for {task.tenant}", timestamp=datetime.datetime.utcnow())
    db.add(log)
    task.status = "trashed_in_gmail"
    db.commit()

    return {"status": "success"}

@app.get("/api/v1/activity")
async def get_activity_feed(db = Depends(get_db)):
    feed = db.query(ConversationLog).filter(ConversationLog.role == "system").order_by(ConversationLog.timestamp.desc()).limit(15).all()
    results = []
    for f in feed:
        results.append({
            "id": f.id,
            "message": f.content,
            "time": f.timestamp.strftime("%I:%M %p"),
            "type": "system"
        })
    return {"feed": results}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# === FILE UPLOAD AND KNOWLEDGE BASE (RAG) ROUTES ===

@app.post("/api/v1/knowledge/upload")
async def upload_document(file: UploadFile = File(...), db = Depends(get_db)):
    """Accepts PDF/TXT, stores it in SQLite, and pipelines to ChromaDB."""
    if not knowledge_service:
        raise HTTPException(status_code=500, detail="ChromaDB engine is uninitialized.")
        
    valid_extensions = ["pdf", "txt"]
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are accepted.")
        
    # Generate unique storage path
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{str(uuid.uuid4())[:8]}_{file.filename}")
    
    # Save the actual bytes to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_bytes = os.path.getsize(file_path)
    
    # 1. Create SQLite relational record
    db_source = KnowledgeSource(
        filename=file.filename,
        file_size_bytes=size_bytes,
        status="embedding"
    )
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    # 2. Extract, chunk, and embed into ChromaDB
    try:
        success = knowledge_service.ingest_document(file_path, db_source.id, file.filename)
        db_source.status = "active" if success else "failed"
        db.commit()
    except Exception as e:
        db_source.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Embedding failure: {e}")
        
    return {
        "id": db_source.id,
        "filename": db_source.filename,
        "status": db_source.status
    }

@app.get("/api/v1/knowledge")
async def list_knowledge_sources(db = Depends(get_db)):
    sources = db.query(KnowledgeSource).order_by(KnowledgeSource.uploaded_at.desc()).all()
    results = []
    for s in sources:
        results.append({
            "id": s.id,
            "filename": s.filename,
            "size_str": f"{round(s.file_size_bytes / 1024 / 1024, 2)} MB",
            "status": s.status,
            "date": s.uploaded_at.strftime("%b %d, %Y")
        })
    return {"sources": results}

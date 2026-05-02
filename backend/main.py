import os
import random
from uuid import uuid4
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from database import get_db
import httpx
from fastapi.responses import RedirectResponse
import schemas, auth, core_ai, mailer

app = FastAPI(title="LLM Learning System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your_google_client_id_here")
RAPID_MCQ_SESSIONS = {}


def _level_label(level_value: int) -> str:
    labels = ["Beginner", "Intermediate", "Advanced"]
    if level_value <= 1:
        return labels[0]
    if level_value == 2:
        return labels[1]
    return labels[2]

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

@app.post("/api/auth/register", response_model=schemas.MessageResponse)
def register(user: schemas.UserCreate, db=Depends(get_db)):
    db_user = db.users.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.utcnow()
    }
    db.users.insert_one(new_user)
    
    # Generate OTP
    otp_code = generate_otp()
    db.otps.insert_one({
        "email": user.email,
        "otp_code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    })
    
    mailer.send_email(user.email, "Verify your LearnAdaptive Account", f"Your OTP is: {otp_code}")
    
    return {"message": "User registered. Please verify your OTP."}

@app.post("/api/auth/verify-otp", response_model=schemas.MessageResponse)
def verify_otp(payload: schemas.OTPVerify, db=Depends(get_db)):
    otp_entry = db.otps.find_one({"email": payload.email, "otp_code": payload.otp_code})
    
    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if otp_entry.get("expires_at") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP Expired")
        
    db.users.update_one({"email": payload.email}, {"$set": {"is_verified": True}})
    db.otps.delete_one({"_id": otp_entry["_id"]})
    
    return {"message": "Account verified successfully."}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db=Depends(get_db)):
    user = db.users.find_one({"email": user_credentials.email})
    
    if not user or not auth.verify_password(user_credentials.password, user.get("hashed_password")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Account not verified. Please verify your OTP.")
    
    access_token = auth.create_access_token(data={"sub": user_credentials.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(payload: schemas.ForgotPassword, db=Depends(get_db)):
    user = db.users.find_one({"email": payload.email})
    if not user:
        # Don't reveal user doesn't exist for security
        return {"message": "If that email exists, an OTP has been sent."}
        
    otp_code = generate_otp()
    db.otps.insert_one({
        "email": payload.email,
        "otp_code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    })
    
    mailer.send_email(payload.email, "LearnAdaptive Password Reset", f"Your password reset OTP is: {otp_code}")
    return {"message": "If that email exists, an OTP has been sent."}

@app.post("/api/auth/reset-password", response_model=schemas.MessageResponse)
def reset_password(payload: schemas.ResetPassword, db=Depends(get_db)):
    otp_entry = db.otps.find_one({"email": payload.email, "otp_code": payload.otp_code})
    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if otp_entry.get("expires_at") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP Expired")
        
    hashed_password = auth.get_password_hash(payload.new_password)
    db.users.update_one({"email": payload.email}, {"$set": {"hashed_password": hashed_password}})
    db.otps.delete_one({"_id": otp_entry["_id"]})
    return {"message": "Password reset successfully."}

@app.get("/api/auth/google/login")
def google_login():
    GOOGLE_CALLBACK_URL = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:5000/api/auth/google/callback")
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&response_type=code&scope=openid%20email%20profile&redirect_uri={GOOGLE_CALLBACK_URL}"
    return RedirectResponse(url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str = None, error: str = None):
    if error:
        return RedirectResponse(f"http://localhost:5173/login?error={error}")
    
    if not code:
        return RedirectResponse("http://localhost:5173/login?error=NoCodeProvided")

    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_CALLBACK_URL = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:5000/api/auth/google/callback")
    FRONTEND_URL = "http://localhost:5173"
    
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_CALLBACK_URL
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            response = await client.post(token_url, data=data)
            if response.status_code != 200:
                print(f"Token exchange failed: {response.text}")
                return RedirectResponse(f"{FRONTEND_URL}/login?error=TokenExchangeFailed")
            
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                print(f"No access token in response: {token_data}")
                return RedirectResponse(f"{FRONTEND_URL}/login?error=GoogleAuthFailed")
                
            # Get user info
            user_info_response = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})
            if user_info_response.status_code != 200:
                print(f"User info request failed: {user_info_response.text}")
                return RedirectResponse(f"{FRONTEND_URL}/login?error=UserInfoFailed")
                
            user_data = user_info_response.json()
            
        email = user_data.get("email")
        name = user_data.get("name", "Google User")
        
        if not email:
            print("No email found in Google user data")
            return RedirectResponse(f"{FRONTEND_URL}/login?error=NoEmailProvided")
            
        db = next(get_db())
        user = db.users.find_one({"email": email})
        if not user:
            new_user = {
                "email": email,
                "hashed_password": "oauth_" + str(random.randint(100000, 999999)),
                "full_name": name,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.utcnow()
            }
            db.users.insert_one(new_user)
            
        my_access_token = auth.create_access_token(data={"sub": email})
        return RedirectResponse(f"{FRONTEND_URL}/?token={my_access_token}")
    except Exception as e:
        print(f"Google Callback Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(f"{FRONTEND_URL}/login?error=ServerError")

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user

@app.delete("/api/users/me", response_model=schemas.MessageResponse)
def delete_me(current_user: dict = Depends(auth.get_current_user), db=Depends(get_db)):
    email = current_user.get("email")
    db.users.delete_one({"email": email})
    db.user_progress.delete_many({"email": email})
    db.otps.delete_many({"email": email})
    return {"message": "Account and all associated progress deleted successfully."}

@app.post("/api/chat")
def chat_with_ai(request: schemas.ChatRequest, current_user: dict = Depends(auth.get_current_user), db=Depends(get_db)):
    response_text = core_ai.generate_ai_response(
        topic=request.topic,
        message=request.message,
        history=request.history,
        level=request.level,
        mode=request.mode
    )

    email = current_user.get("email")
    now = datetime.utcnow()

    # ── Persist chat history ──────────────────────────────────────
    session_id = request.session_id
    if session_id:
        existing = db.chat_history.find_one({"session_id": session_id, "email": email})
        new_messages = [
            {"role": "user",      "content": request.message,  "timestamp": now},
            {"role": "assistant", "content": response_text,    "timestamp": now},
        ]
        if existing:
            db.chat_history.update_one(
                {"session_id": session_id, "email": email},
                {
                    "$push": {"messages": {"$each": new_messages}},
                    "$set":  {"updated_at": now, "topic": request.topic, "mode": request.mode},
                }
            )
        else:
            db.chat_history.insert_one({
                "session_id": session_id,
                "email":      email,
                "topic":      request.topic,
                "mode":       request.mode,
                "messages":   new_messages,
                "created_at": now,
                "updated_at": now,
            })
    # ─────────────────────────────────────────────────────────────

    # Update user progress after interaction
    if request.mode in ["quiz", "evaluate"]:
        db.user_progress.update_one(
            {"email": email, "topic": request.topic},
            {
                "$set": {
                    "email": email,
                    "topic": request.topic,
                    "level": request.level,
                    "last_practiced": now
                },
                "$inc": {"interactions": 1}
            },
            upsert=True
        )

    return {"response": response_text, "session_id": session_id}


@app.get("/api/chat/history")
def get_chat_history_list(current_user: dict = Depends(auth.get_current_user), db=Depends(get_db)):
    """List all chat sessions for the current user, newest first."""
    email = current_user.get("email")
    sessions = list(
        db.chat_history.find(
            {"email": email},
            {"_id": 0, "session_id": 1, "topic": 1, "mode": 1, "created_at": 1, "updated_at": 1, "messages": {"$slice": -1}}
        ).sort("updated_at", -1).limit(50)
    )
    # Attach a preview of the last user message
    result = []
    for s in sessions:
        msgs = s.get("messages", [])
        last_user = next((m["content"] for m in reversed(msgs) if m["role"] == "user"), "")
        result.append({
            "session_id": s["session_id"],
            "topic":      s.get("topic", "general"),
            "mode":       s.get("mode",  "chat"),
            "preview":    last_user[:80] + ("…" if len(last_user) > 80 else ""),
            "created_at": s.get("created_at"),
            "updated_at": s.get("updated_at"),
        })
    return {"sessions": result}


@app.get("/api/chat/history/{session_id}")
def get_chat_session(session_id: str, current_user: dict = Depends(auth.get_current_user), db=Depends(get_db)):
    """Load all messages for a specific chat session."""
    email = current_user.get("email")
    session = db.chat_history.find_one(
        {"session_id": session_id, "email": email},
        {"_id": 0}
    )
    if not session:
        return {
            "session_id": session_id,
            "topic":      "general",
            "mode":       "chat",
            "messages":   [],
            "created_at": None,
            "updated_at": None,
        }
    return {
        "session_id": session["session_id"],
        "topic":      session.get("topic", "general"),
        "mode":       session.get("mode",  "chat"),
        "messages":   session.get("messages", []),
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
    }


@app.delete("/api/chat/history/{session_id}", response_model=schemas.MessageResponse)
def delete_chat_session(session_id: str, current_user: dict = Depends(auth.get_current_user), db=Depends(get_db)):
    """Delete a specific chat session."""
    email = current_user.get("email")
    result = db.chat_history.delete_one({"session_id": session_id, "email": email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return {"message": "Chat session deleted successfully."}

# ==================== TOPICS ENDPOINTS ====================
@app.get("/api/topics")
def get_all_topics(db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get all available topics/courses"""
    topics = [
        {
            "id": "binary_trees",
            "name": "Binary Trees (DSA)",
            "icon": "Code",
            "color": "blue",
            "description": "Traversals, BSTs, Balancing",
            "difficulty": "Intermediate"
        },
        {
            "id": "dsa",
            "name": "Data Structures & Algorithms",
            "icon": "Code",
            "color": "blue",
            "description": "Arrays, Trees, Graphs, Sorting",
            "difficulty": "Intermediate"
        },
        {
            "id": "os",
            "name": "Operating Systems",
            "icon": "Server",
            "color": "green",
            "description": "Processes, Memory, File Systems",
            "difficulty": "Advanced"
        },
        {
            "id": "dbms",
            "name": "Database Management",
            "icon": "Database",
            "color": "pink",
            "description": "SQL, Normalization, Transactions",
            "difficulty": "Intermediate"
        },
        {
            "id": "cn",
            "name": "Computer Networks",
            "icon": "Network",
            "color": "orange",
            "description": "OSI Model, Routing, Protocols",
            "difficulty": "Advanced"
        },
    ]
    
    # Add user's progress info to each topic
    email = current_user.get("email")
    for topic in topics:
        progress = db.user_progress.find_one({"email": email, "topic": topic["id"]})
        if progress:
            topic["userProgress"] = {
                "level": progress.get("level", 1),
                "interactions": progress.get("interactions", 0),
                "lastPracticed": progress.get("last_practiced", None)
            }
        else:
            topic["userProgress"] = {
                "level": 1,
                "interactions": 0,
                "lastPracticed": None
            }
        topic["status"] = "Active"
    
    return {"topics": topics}

@app.get("/api/progress")
def get_user_progress(db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get detailed user progress across all topics"""
    email = current_user.get("email")
    progress_data = list(db.user_progress.find({"email": email}))
    
    # Calculate overall stats
    total_interactions = sum(p.get("interactions", 0) for p in progress_data)
    avg_level = sum(p.get("level", 1) for p in progress_data) / len(progress_data) if progress_data else 1
    
    return {
        "email": email,
        "full_name": current_user.get("full_name", "User"),
        "totalProgress": len(progress_data),
        "overallLevel": round(avg_level),
        "totalInteractions": total_interactions,
        "topicProgress": [
            {
                "topic": p["topic"],
                "level": p.get("level", 1),
                "interactions": p.get("interactions", 0),
                "lastPracticed": p.get("last_practiced")
            }
            for p in progress_data
        ]
    }

@app.get("/api/stats")
def get_user_stats(db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get user statistics and performance metrics"""
    email = current_user.get("email")
    
    # Get progress data
    progress_data = list(db.user_progress.find({"email": email}))
    
    # Calculate metrics
    streak = random.randint(7, 21)  # Simulated - in real app, calculate from history
    accuracy = random.randint(75, 95)  # Simulated - calculate from quiz results
    total_topics_mastered = len([p for p in progress_data if p.get("level", 1) >= 2])
    
    return {
        "streak": streak,
        "accuracy": accuracy,
        "topicsMastered": total_topics_mastered,
        "totalTopics": len(progress_data),
        "lastActive": datetime.utcnow()
    }

@app.get("/api/recommendations")
def get_recommendations(db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get AI-powered recommendations for weak areas and next learning topics"""
    email = current_user.get("email")
    progress_data = list(db.user_progress.find({"email": email}))
    
    # Find weak areas (topics with level 1 or least interactions)
    weak_areas = sorted(progress_data, key=lambda x: (x.get("level", 1), x.get("interactions", 0)))[:2]
    
    # Find next recommendation (topics with level 2)
    mastered_topics = [p["topic"] for p in progress_data if p.get("level", 1) >= 2]
    
    # Simulated recommendations
    weak_areas_formatted = [
        {
            "topic": area["topic"],
            "reason": f"You need more practice in {area['topic']}. Focus on edge cases.",
            "suggestedLevel": area.get("level", 1)
        }
        for area in weak_areas
    ] if weak_areas else [{"topic": "dsa", "reason": "Start with Data Structures", "suggestedLevel": 1}]
    
    next_topic = {
        "topic": "os",
        "name": "Operating Systems",
        "reason": "You've mastered basic concepts. OS is a natural next step.",
        "difficulty": "Advanced"
    } if mastered_topics else {
        "topic": "dsa",
        "name": "Data Structures & Algorithms",
        "reason": "Start with fundamentals",
        "difficulty": "Beginner"
    }
    
    return {
        "weakAreas": weak_areas_formatted,
        "nextRecommendation": next_topic,
        "lastUpdated": datetime.utcnow()
    }

@app.get("/api/dashboard")
def get_dashboard_data(db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get all dashboard data in one call"""
    email = current_user.get("email")
    progress_data = list(db.user_progress.find({"email": email}))

    total_interactions = sum(item.get("interactions", 0) for item in progress_data)
    total_levels = sum(item.get("level", 1) for item in progress_data)
    average_level = round(total_levels / len(progress_data)) if progress_data else 1
    weak_areas = sorted(progress_data, key=lambda item: (item.get("level", 1), item.get("interactions", 0)))
    primary_weak_topic = weak_areas[0]["topic"] if weak_areas else "dsa"
    strongest_topic = sorted(progress_data, key=lambda item: (-item.get("level", 1), -item.get("interactions", 0)))
    primary_strong_topic = strongest_topic[0]["topic"] if strongest_topic else "linked_lists"
    streak = min(143, 7 + total_interactions * 2 + len(progress_data))
    accuracy = min(98, 68 + total_interactions * 3 + average_level * 6)

    topic_library = [
        {
            "id": "dsa",
            "name": "Data Structures & Algorithms",
            "icon": "Code",
            "color": "blue",
            "skills": ["Arrays", "Trees", "Graphs"],
        },
        {
            "id": "binary_trees",
            "name": "Binary Trees",
            "icon": "Code",
            "color": "blue",
            "skills": ["Traversal", "BST", "Recursion"],
        },
        {
            "id": "os",
            "name": "Operating Systems",
            "icon": "Server",
            "color": "green",
            "skills": ["Processes", "Memory", "Scheduling"],
        },
        {
            "id": "dbms",
            "name": "Database Management",
            "icon": "Database",
            "color": "pink",
            "skills": ["SQL", "Normalization", "Transactions"],
        },
        {
            "id": "cn",
            "name": "Computer Networks",
            "icon": "Network",
            "color": "amber",
            "skills": ["OSI Model", "Routing", "Protocols"],
        },
    ]

    courses = []
    for topic in topic_library:
        progress = next((item for item in progress_data if item.get("topic") == topic["id"]), None)
        level_value = progress.get("level", 1) if progress else 1
        interactions = progress.get("interactions", 0) if progress else 0
        percent = min(100, 12 + interactions * 14 + level_value * 18)
        courses.append(
            {
                **topic,
                "progress": f"{min(99, interactions * 2 + level_value)}/100",
                "percent": percent,
                "status": _level_label(level_value),
            }
        )

    focus_cards = [
        {
            "title": f"Practicing {topic_library[0]['name']}",
            "duration": "15 min",
            "description": f"This exercise improves speed and confidence in {topic_library[0]['name'].lower()}.",
            "action": "Start",
            "topic": topic_library[0]["id"],
            "state": "Ready",
        },
        {
            "title": f"Improving {topic_library[1]['name']}",
            "duration": "25 min",
            "description": "Strengthen core understanding with a focused AI session.",
            "action": "Start",
            "topic": topic_library[1]["id"],
            "state": "Ready",
        },
        {
            "title": f"Rapid MCQ on {topic_library[2]['name']}",
            "duration": "10s per Q",
            "description": "Try 10 AI-generated questions under time pressure.",
            "action": "Launch",
            "topic": topic_library[2]["id"],
            "state": "Timed",
        },
        {
            "title": f"Reviewing {topic_library[3]['name']}",
            "duration": "20 min",
            "description": "Complete a short revision pass to reinforce weak concepts.",
            "action": "Review",
            "topic": topic_library[3]["id"],
            "state": "Complete" if total_interactions > 3 else "Active",
        },
    ]

    tasks = [
        {
            "category": "Rapid MCQ",
            "due": "Today",
            "title": "10s AI challenge",
            "description": f"Answer 10 rapid questions and get an AI-verified report on {primary_weak_topic}.",
            "status": "Not started",
            "action": "Start now",
            "path": f"/rapid-mcq?topic={primary_weak_topic}",
        },
        {
            "category": "Weak Area Review",
            "due": "This week",
            "title": f"Reinforce {primary_weak_topic.replace('_', ' ').title()}",
            "description": "Focus on the concepts that currently limit your score.",
            "status": "In progress",
            "action": "Open practice",
            "path": f"/practice?topic={primary_weak_topic}&locked=true&level=1",
        },
        {
            "category": "AI Tutor",
            "due": "Anytime",
            "title": f"Deep dive on {primary_strong_topic.replace('_', ' ').title()}",
            "description": "Use the tutor to tighten the next level of understanding.",
            "status": "Ready",
            "action": "Ask AI",
            "path": "/ask",
        },
    ]

    return {
        "user": {
            "email": email,
            "full_name": current_user.get("full_name", "User")
        },
        "branding": {
            "project": "LearnAdaptive",
            "service": "Product Design",
            "field": "EdTech"
        },
        "hero": {
            "greeting": f"Hello, {current_user.get('full_name', 'Student').split(' ')[0]}",
            "subtitle": "Your learning workflow is driven directly by backend data.",
            "primaryAction": {
                "label": "Rapid MCQ",
                "path": "/rapid-mcq"
            }
        },
        "stats": {
            "streak": streak,
            "accuracy": accuracy,
            "lastActive": datetime.utcnow()
        },
        "summary": {
            "activity": {
                "label": "Activity",
                "streak": streak,
                "daysText": "days in a row",
                "timeline": [
                    {"day": "Mon", "active": True},
                    {"day": "Tue", "active": True},
                    {"day": "Wed", "active": len(progress_data) > 1},
                    {"day": "Thu", "active": len(progress_data) > 2},
                    {"day": "Fri", "active": total_interactions > 0},
                    {"day": "Sat", "active": total_interactions > 1},
                    {"day": "Sun", "active": total_interactions > 2},
                ],
            },
            "homework": {
                "label": "Homework",
                "completed": min(79, 40 + total_interactions * 4),
                "total": 79,
                "note": f"{primary_weak_topic.replace('_', ' ').title()} test coming soon"
            },
            "level": {
                "label": "Level",
                "value": _level_label(average_level),
                "testedOn": datetime.utcnow().strftime("%d %b %Y")
            }
        },
        "weaknessDetection": {
            "detected": len(weak_areas) > 0,
            "weakTopic": primary_weak_topic,
            "reason": f"Based on your last practice sessions, you showed difficulty in {primary_weak_topic.replace('_', ' ')}.",
            "suggestion": "Practice weak areas to improve"
        },
        "personalizedPath": {
            "completed": "Linked Lists",
            "nextTopic": "Dynamic Programming",
            "difficulty": _level_label(min(3, average_level + 1)),
            "reason": "Natural progression after mastering lists"
        },
        "insights": focus_cards,
        "tasks": tasks,
        "courses": courses,
    }


@app.post("/api/rapid-mcq/session")
def create_rapid_mcq_session(payload: schemas.RapidMCQSessionRequest, current_user: dict = Depends(auth.get_current_user)):
    session_payload = core_ai.generate_rapid_mcq_session(payload.topic, payload.level)
    session_id = str(uuid4())
    questions = session_payload.get("questions", [])
    RAPID_MCQ_SESSIONS[session_id] = {
        "user_email": current_user.get("email"),
        "topic": payload.topic,
        "level": payload.level,
        "questions": questions,
        "created_at": datetime.utcnow(),
        "source": session_payload.get("source", "ai"),
    }

    return {
        "session_id": session_id,
        "topic": payload.topic,
        "level": payload.level,
        "level_label": _level_label(payload.level),
        "duration_seconds": 100,
        "source": session_payload.get("source", "ai"),
        "questions": [
            {
                "id": question["id"],
                "question": question["question"],
                "options": question["options"],
                "focusArea": question.get("focusArea", payload.topic),
            }
            for question in questions
        ],
    }


@app.post("/api/rapid-mcq/submit")
def submit_rapid_mcq_session(payload: schemas.RapidMCQSubmitRequest, db=Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    session = RAPID_MCQ_SESSIONS.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Rapid MCQ session not found. Start a new round.")

    if session.get("user_email") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="This session does not belong to the current user.")

    question_map = {question["id"]: question for question in session.get("questions", [])}
    results = []
    score = 0
    weak_focus = []

    for answer in payload.answers:
        question = question_map.get(answer.question_id)
        if not question:
            continue

        selected_index = answer.selected_index if answer.selected_index is not None else -1
        is_correct = selected_index == question.get("correctIndex", -1)
        if is_correct:
            score += 1
        else:
            weak_focus.append(question.get("focusArea", session.get("topic")))

        results.append(
            {
                "questionId": question["id"],
                "question": question["question"],
                "selectedIndex": selected_index,
                "selectedAnswer": question["options"][selected_index] if 0 <= selected_index < len(question["options"]) else None,
                "correctIndex": question.get("correctIndex", 0),
                "correctAnswer": question["options"][question.get("correctIndex", 0)],
                "isCorrect": is_correct,
                "explanation": question.get("explanation", ""),
                "focusArea": question.get("focusArea", session.get("topic")),
            }
        )

    total_questions = len(question_map) if question_map else 10
    accuracy = round((score / total_questions) * 100) if total_questions else 0
    grade = "A+" if accuracy >= 90 else "A-" if accuracy >= 80 else "B+" if accuracy >= 70 else "B" if accuracy >= 60 else "C"
    report = core_ai.generate_rapid_mcq_report(
        topic=session.get("topic", "mixed topics"),
        level=session.get("level", 1),
        score=score,
        total_questions=total_questions,
        question_results=results,
        time_taken_seconds=payload.time_taken_seconds,
    )

    weak_topics = sorted(
        set(weak_focus),
        key=lambda item: weak_focus.count(item),
        reverse=True,
    )[:3]

    db.user_progress.update_one(
        {"email": current_user.get("email"), "topic": session.get("topic")},
        {
            "$set": {
                "email": current_user.get("email"),
                "topic": session.get("topic"),
                "level": min(3, session.get("level", 1) + (1 if score >= 8 else 0)),
                "last_practiced": datetime.utcnow(),
            },
            "$inc": {"interactions": 1},
        },
        upsert=True,
    )

    return {
        "session_id": payload.session_id,
        "topic": session.get("topic"),
        "level": session.get("level", 1),
        "level_label": _level_label(session.get("level", 1)),
        "score": score,
        "total_questions": total_questions,
        "accuracy": accuracy,
        "grade": grade,
        "time_taken_seconds": payload.time_taken_seconds,
        "question_results": results,
        "report": report,
        "focus_topics": weak_topics or [session.get("topic")],
        "source": session.get("source", "ai"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)

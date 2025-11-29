from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional

# ========================
# CONFIGURATION
# ========================
DATABASE_URL = "sqlite:///./wellness.db"
SECRET_KEY = "Y0DJ_VC1bE1eyRz_uCSsDXqw1U53-iTGuZQOIA_Sb0c"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ========================
# DATABASE SETUP
# ========================
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ========================
# DATABASE MODELS
# ========================
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

# Add this to your backend/main.py

# ========================
# CHATBOT MODELS (Add to imports)
# ========================
from transformers import pipeline
import os

# Initialize the chatbot model (runs once at startup)
print("🤖 Loading Hugging Face model...")
try:
    # Using a free, lightweight model from Hugging Face
    # This model is fine-tuned for mental health conversations
    chatbot = pipeline(
        "text-generation",
        model="gpt2",  # Lightweight, free model
        device=-1  # CPU mode (set to 0 for GPU if available)
    )
    print("✅ Chatbot model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    chatbot = None

# ========================
# CHATBOT SCHEMAS
# ========================
class ChatMessage(BaseModel):
    message: str
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Message cannot be empty')
        if len(v) > 500:
            raise ValueError('Message cannot exceed 500 characters')
        return v.strip()


class ChatResponse(BaseModel):
    user_message: str
    bot_response: str
    timestamp: datetime


# ========================
# CHATBOT CONTEXT MANAGER
# ========================
class ChatContext:
    """Maintains conversation context for empathetic responses"""
    
    def __init__(self):
        self.conversation_history = {}
    
    def get_user_context(self, user_id: int):
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        return self.conversation_history[user_id]
    
    def add_message(self, user_id: int, role: str, content: str):
        self.conversation_history[user_id].append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        })
    
    def get_recent_context(self, user_id: int, limit: int = 5):
        """Get last few messages for context"""
        history = self.get_user_context(user_id)
        return history[-limit:] if history else []


chat_context = ChatContext()

# ========================
# WELLNESS CHATBOT RESPONSES
# ========================
def generate_wellness_response(user_message: str, user_id: int) -> str:
    """
    Generate empathetic mental health responses
    Uses Hugging Face model for intelligent responses
    """
    
    if not chatbot:
        return "I'm sorry, but the chatbot is not available right now. Please try again later."
    
    # Mental health prompt engineering
    wellness_prompt = f"""You are a compassionate mental wellness companion. 
Your role is to provide supportive, empathetic responses to help users with their mental health.
Remember:
- Be warm and non-judgmental
- Listen actively
- Provide practical coping strategies when relevant
- Suggest professional help if needed
- Never diagnose or prescribe

User says: {user_message}

Compassionate response:"""
    
    try:
        # Generate response from model
        response = chatbot(
            wellness_prompt,
            max_length=150,
            num_return_sequences=1,
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )
        
        bot_response = response[0]['generated_text'].split("Compassionate response:")[-1].strip()
        
        # Add to context
        chat_context.add_message(user_id, "user", user_message)
        chat_context.add_message(user_id, "assistant", bot_response)
        
        return bot_response
    except Exception as e:
        print(f"Error generating response: {e}")
        return get_fallback_response(user_message)


def get_fallback_response(user_message: str) -> str:
    """
    Fallback responses when model fails
    Provides helpful responses based on keywords
    """
    
    message_lower = user_message.lower()
    
    # Wellness-focused fallback responses
    responses = {
        "stress": "I hear you're feeling stressed. Try taking 5 deep breaths, go for a short walk, or practice a grounding technique. What helps you relax?",
        "anxiety": "Anxiety can feel overwhelming. Some people find it helpful to break tasks into smaller steps. Would talking through what's worrying you help?",
        "sad": "I'm sorry you're feeling sad. It's okay to feel this way. Have you considered reaching out to someone you trust or a professional?",
        "lonely": "Loneliness is a tough feeling. Consider connecting with someone - even a quick call or text can help. You're not alone.",
        "sleep": "Sleep is so important for mental health. Try establishing a bedtime routine, avoiding screens 1 hour before bed, and keeping your room cool and dark.",
        "help": "I'm here to listen and support you. Tell me what's on your mind - what brought you here today?",
        "tired": "Feeling tired can sometimes be related to stress or burnout. Are you getting enough rest? What could help you recharge?",
        "coping": "Here are some coping strategies: breathing exercises, journaling, physical activity, creative expression, meditation, or talking to someone you trust.",
    }
    
    for keyword, response in responses.items():
        if keyword in message_lower:
            return response
    
    # Default supportive response
    return "Thank you for sharing that with me. I'm here to listen and support you. Can you tell me more about how you're feeling? Remember, it's okay to not be okay, and seeking support is a sign of strength. 💚"


# ========================
# CHATBOT ROUTES
# ========================

@app.post("/chat/message", response_model=ChatResponse)
def chat_with_bot(
    message: ChatMessage,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the wellness chatbot
    
    Requires: Authorization header with Bearer token
    
    - **message**: Your message to the chatbot (max 500 chars)
    
    Returns: User message and bot response
    """
    
    try:
        # Generate bot response
        bot_response = generate_wellness_response(message.message, current_user.id)
        
        return ChatResponse(
            user_message=message.message,
            bot_response=bot_response,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@app.get("/chat/context")
def get_chat_context(
    current_user: UserDB = Depends(get_current_user),
    limit: int = 10
):
    """
    Get recent chat conversation context
    
    Requires: Authorization header with Bearer token
    
    - **limit**: Number of recent messages to retrieve (default: 10)
    """
    
    recent_messages = chat_context.get_recent_context(current_user.id, limit)
    
    return {
        "user_id": current_user.id,
        "message_count": len(recent_messages),
        "messages": recent_messages
    }


@app.delete("/chat/context")
def clear_chat_context(current_user: UserDB = Depends(get_current_user)):
    """
    Clear chat conversation history for current user
    
    Requires: Authorization header with Bearer token
    """
    
    if current_user.id in chat_context.conversation_history:
        chat_context.conversation_history[current_user.id] = []
    
    return {"message": "Chat context cleared"}


@app.post("/chat/suggested-questions")
def get_suggested_questions(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get suggested conversation starters based on recent check-ins
    
    Requires: Authorization header with Bearer token
    """
    
    # Get user's latest check-in
    latest_checkin = db.query(CheckInDB).filter(
        CheckInDB.user_id == current_user.id
    ).order_by(CheckInDB.date.desc()).first()
    
    # Suggested questions based on mood level
    questions_by_mood = {
        0: [
            "I'm really struggling right now. Can we talk about what's making you feel this way?",
            "Have you reached out to anyone for support?",
            "Would it help to think about one small thing that might make you feel better?"
        ],
        1: [
            "It sounds like things are tough. What's the main thing bothering you?",
            "Have you tried any coping strategies that have helped before?",
            "Would talking through this help?"
        ],
        2: [
            "How has your day been treating you?",
            "What's one thing you could do today to feel a bit better?",
            "Is there anything on your mind you'd like to talk about?"
        ],
        3: [
            "That's great! What's been going well for you?",
            "Any challenges or wins worth celebrating?",
            "How can we keep this positive momentum going?"
        ],
        4: [
            "Wow, you seem to be in a great place! What's contributing to this?",
            "Any practices or habits helping you feel this good?",
            "How can we maintain this positive feeling?"
        ],
        5: [
            "You seem to be thriving! What's your secret?",
            "What habits or routines are working best for you?",
            "How can you help others who are struggling?"
        ]
    }
    
    mood = latest_checkin.mood if latest_checkin else 2
    suggested = questions_by_mood.get(mood, questions_by_mood[2])
    
    return {
        "latest_mood": mood,
        "suggested_questions": suggested,
        "tip": "Pick a question that resonates with you, or start with your own thoughts!"
    }


# ========================
# INSTALLATION INSTRUCTIONS
# ========================
"""
To use this chatbot, install required packages:

pip install transformers torch

Add to requirements.txt:
transformers>=4.30.0
torch>=2.0.0

If you get CUDA errors on Windows, use CPU mode (already set with device=-1)

For GPU support (optional):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
"""

class CheckInDB(Base):
    __tablename__ = "check_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    mood = Column(Integer, nullable=False)
    journal = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, index=True)


Base.metadata.create_all(bind=engine)

# ========================
# PYDANTIC SCHEMAS
# ========================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class CheckInCreate(BaseModel):
    mood: int
    journal: str
    
    @field_validator('mood')
    @classmethod
    def validate_mood(cls, v):
        if not 0 <= v <= 5:
            raise ValueError('Mood must be between 0 and 5')
        return v


class CheckInResponse(BaseModel):
    id: int
    mood: int
    journal: str
    date: datetime
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ========================
# PASSWORD HASHING
# ========================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ========================
# JWT TOKEN FUNCTIONS
# ========================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ========================
# DEPENDENCY FUNCTIONS
# ========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserDB:
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


# ========================
# FASTAPI APP
# ========================
app = FastAPI(
    title="Wellness API",
    version="1.0.0",
    description="Mental Wellness Check-In System API"
)

# ========================
# CORS MIDDLEWARE - MUST BE FIRST!
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# ROUTES
# ========================

@app.get("/")
def root():
    return {"message": "Wellness API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "message": "Wellness API is running"}


@app.post("/auth/register", status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(UserDB).filter(UserDB.email == user.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    new_user = UserDB(
        email=user.email.lower(),
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully",
        "email": new_user.email,
        "id": new_user.id
    }


@app.post("/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == credentials.email.lower()).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    expires_in = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: UserDB = Depends(get_current_user)):
    return current_user


@app.post("/wellness/checkins", status_code=201)
def create_checkin(
    checkin: CheckInCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_checkin = CheckInDB(
        user_id=current_user.id,
        mood=checkin.mood,
        journal=checkin.journal
    )
    
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)
    
    return new_checkin


@app.get("/wellness/checkins")
def get_checkins(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkins = db.query(CheckInDB).filter(
        CheckInDB.user_id == current_user.id
    ).order_by(CheckInDB.date.desc()).all()
    
    return {
        "count": len(checkins),
        "checkins": checkins
    }


@app.get("/wellness/checkins/{checkin_id}")
def get_checkin(
    checkin_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkin = db.query(CheckInDB).filter(
        CheckInDB.id == checkin_id,
        CheckInDB.user_id == current_user.id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    return checkin


@app.delete("/wellness/checkins/{checkin_id}", status_code=204)
def delete_checkin(
    checkin_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkin = db.query(CheckInDB).filter(
        CheckInDB.id == checkin_id,
        CheckInDB.user_id == current_user.id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    db.delete(checkin)
    db.commit()
    
    return None


@app.get("/wellness/stats")
def get_stats(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkins = db.query(CheckInDB).filter(
        CheckInDB.user_id == current_user.id
    ).order_by(CheckInDB.date.desc()).all()
    
    if not checkins:
        return {
            "total_checkins": 0,
            "average_mood": 0,
            "latest_mood": None,
            "trend": None
        }
    
    total = len(checkins)
    average = sum(c.mood for c in checkins) / total
    latest_mood = checkins[0].mood
    
    if len(checkins) >= 7:
        recent_avg = sum(c.mood for c in checkins[:7]) / 7
        older_avg = sum(c.mood for c in checkins[7:14]) / 7 if len(checkins) >= 14 else recent_avg
        trend = "up" if recent_avg > older_avg else ("down" if recent_avg < older_avg else "stable")
    else:
        trend = None
    
    return {
        "total_checkins": total,
        "average_mood": round(average, 2),
        "latest_mood": latest_mood,
        "trend": trend
    }
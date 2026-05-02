from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_verified: bool

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class OAuthGoogle(BaseModel):
    credential: str

class MessageResponse(BaseModel):
    message: str

class ChatRequest(BaseModel):
    topic: str
    message: str
    history: List[dict] = []
    level: int = 1
    mode: str = "chat"
    session_id: Optional[str] = None


class RapidMCQSessionRequest(BaseModel):
    topic: str
    level: int = 1


class RapidMCQAnswer(BaseModel):
    question_id: str
    selected_index: Optional[int] = None


class RapidMCQSubmitRequest(BaseModel):
    session_id: str
    answers: List[RapidMCQAnswer] = []
    time_taken_seconds: int = 0

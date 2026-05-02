# LearnAdaptive Backend

This is the backend for the LearnAdaptive platform, an AI-powered learning system that provides personalized tutoring, rapid MCQ challenges, and progress tracking.

## Features

- **AI Tutoring**: Integrated with LLMs to provide real-time responses to student queries.
- **Rapid MCQ Generation**: Dynamically generates multiple-choice questions based on topic and difficulty level.
- **Progress Tracking**: Monitors user interactions and mastery across various subjects.
- **Authentication**: Secure JWT-based authentication with support for Google OAuth2.
- **OTP Verification**: Email-based OTP for account verification and password resets.
- **Dashboard API**: Comprehensive data endpoint for the frontend dashboard.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Database**: MongoDB (via `database.py`)
- **AI**: Custom logic in `core_ai.py`
- **Mail**: `smtplib` integrated in `mailer.py`

## Setup Instructions

1. **Environment**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: Ensure `requirements.txt` exists or install manually: `fastapi`, `uvicorn`, `pymongo`, `httpx`, `python-multipart`, `jose`, `passlib`)*

3. **Configuration**:
   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017
   SECRET_KEY=your_super_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   
   GROQ_API_KEY=your_groq_api_key
   
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
   ```

4. **Running the Server**:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:5000`.

## API Documentation

Once the server is running, you can access the interactive API docs at:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

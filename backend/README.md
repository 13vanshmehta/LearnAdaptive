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
   MONGODB_URL=your_mongodb_url
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   SMTP_SERVER=your_smtp_server
   SMTP_PORT=587
   SMTP_USERNAME=your_email
   SMTP_PASSWORD=your_password
   OPENAI_API_KEY=your_key
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

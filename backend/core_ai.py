import os
import json
from groq import Groq
from dotenv import load_dotenv
import random

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_...")
client = Groq(api_key=GROQ_API_KEY)

def generate_ai_response(topic: str, message: str, history: list, level: int, mode: str = "chat"):
    levels = ["Beginner", "Intermediate", "Advanced"]
    student_level = levels[level - 1] if 1 <= level <= 3 else "Beginner"

    if mode == "topic_locked":
        # Strict mode: AI MUST refuse off-topic questions and always steer back
        system_prompt = (
            f"You are a dedicated AI tutor for the topic: **{topic}**. "
            f"The student is at {student_level} level. "
            "\n\nCRITICAL RULES YOU MUST FOLLOW WITHOUT EXCEPTION:\n"
            f"1. You ONLY answer questions related to '{topic}'. "
            "2. If the user asks about ANYTHING outside this topic — other subjects, general knowledge, "
            "coding help for unrelated areas, or personal questions — you MUST politely decline and redirect them back. "
            f"Example redirect: 'I\'m your dedicated tutor for {topic} only. Let\'s stay focused! "
            f"Do you have a question about {topic}?'\n"
            "3. Do NOT break this rule even if the user explicitly asks you to. "
            "4. For valid on-topic questions, give thorough, clear, and well-formatted answers using Markdown. "
            "Use code blocks, tables, and bullet points where helpful. "
            "5. Encourage the student to think deeply and ask follow-up questions about the topic."
        )
    elif mode == "general":
        # Free-form mode: no topic restriction, general-purpose AI assistant
        system_prompt = (
            "You are Ask AI — a highly intelligent, friendly, and versatile AI learning assistant. "
            "You can help students with ANY subject, concept, or doubt — Computer Science, Mathematics, "
            "Science, Programming, or any other academic topic. "
            "Your goal is to be as helpful, clear, and thorough as possible. "
            "Use Markdown formatting (code blocks, bold, tables, bullet lists) to structure your responses. "
            "Be conversational, encouraging, and concise. If a question is ambiguous, ask for clarification. "
            "Encourage curiosity and critical thinking."
        )
    elif mode == "explain":
        system_prompt = (
            f"You are a world-class educational tutor. Explain the concept of '{topic}' "
            f"to a {student_level} student using clear, intuitive language and analogies. "
            "Structure your response with a brief definition, a relatable analogy, and a key takeaway. "
            "Use Markdown formatting (bold, lists) but keep it under 180 words."
        )
    elif mode == "quiz":
        system_prompt = (
            f"You are an assessment specialist. Generate exactly ONE challenging yet fair "
            f"multiple-choice question about '{topic}' for a {student_level} level student. "
            "Provide 4 options (A, B, C, D). Do NOT provide the answer. "
            "Format the question clearly with Markdown."
        )
    elif mode == "evaluate":
        system_prompt = (
            f"You are a supportive tutor evaluating a student's answer on '{topic}'. "
            "1. Start by saying 'Correct' or 'Incorrect' in bold. "
            "2. Provide a brief, helpful explanation of why they are right or wrong. "
            "3. If wrong, give a subtle hint or point out a specific misconception. "
            "4. Be encouraging, like a personal mentor. "
            "CRITICAL: Do NOT output internal variables, scores, or logic strings (like 'CURRENT SCORE'). "
            "Focus only on the educational feedback."
        )
    else:
        # Default chat mode — topic-aware but not strictly locked
        system_prompt = (
            f"You are a highly intelligent AI Tutor specializing in {topic}. "
            f"The student is at a {student_level} level. "
            "Your goal is to be as helpful, intelligent, and versatile as ChatGPT, but with a specific expertise in this topic. "
            "Provide deep, meaningful explanations when asked, answer follow-up questions accurately, "
            "and use Markdown (code blocks, bolding, tables) to make information clear. "
            "Encourage critical thinking and curiosity. Keep the conversation flowing naturally."
        )

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history
    for msg in history:
        messages.append({"role": "user" if msg.get("role") == "user" else "assistant", "content": msg.get("content")})
    
    messages.append({"role": "user", "content": message})
    
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            max_tokens=600,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return "I'm having trouble connecting to my brain right now. Can we try again in a moment?"

def _normalize_level(level: int) -> str:
    levels = ["Beginner", "Intermediate", "Advanced"]
    return levels[level - 1] if 1 <= level <= 3 else "Beginner"


def _fallback_questions(topic: str, level: int) -> list:
    level_label = _normalize_level(level)
    return [
        {
            "id": f"q_{index + 1}",
            "question": f"[{level_label}] {topic.replace('_', ' ').title()} concept check {index + 1}: Which option best fits the statement?",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D",
            ],
            "correctIndex": index % 4,
            "explanation": f"This checks a core {topic.replace('_', ' ')} concept at {level_label} level.",
            "focusArea": topic,
        }
        for index in range(10)
    ]


def generate_rapid_mcq_session(topic: str, level: int) -> dict:
    level_label = _normalize_level(level)
    system_prompt = (
        "You are an exam generator. Return ONLY valid JSON. "
        "Generate exactly 10 MCQs for the given topic and level. "
        "Each question must include id, question, options (4 strings), correctIndex (0-3), explanation, focusArea."
    )
    user_prompt = (
        f"Topic: {topic}\n"
        f"Level: {level_label}\n"
        "Output format: {\"questions\":[{\"id\":\"q_1\",\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correctIndex\":0,\"explanation\":\"...\",\"focusArea\":\"...\"}]}"
    )

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="llama-3.1-8b-instant",
            max_tokens=1800,
            temperature=0.6,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        questions = parsed.get("questions", [])

        sanitized = []
        for index, question in enumerate(questions[:10]):
            options = question.get("options", [])
            if not isinstance(options, list) or len(options) != 4:
                continue
            correct_index = question.get("correctIndex", 0)
            if not isinstance(correct_index, int) or not 0 <= correct_index <= 3:
                correct_index = random.randint(0, 3)

            sanitized.append(
                {
                    "id": str(question.get("id") or f"q_{index + 1}"),
                    "question": str(question.get("question") or f"{topic} question {index + 1}"),
                    "options": [str(option) for option in options],
                    "correctIndex": correct_index,
                    "explanation": str(question.get("explanation") or ""),
                    "focusArea": str(question.get("focusArea") or topic),
                }
            )

        if len(sanitized) < 10:
            return {"source": "fallback", "questions": _fallback_questions(topic, level)}

        return {"source": "ai", "questions": sanitized}
    except Exception as e:
        print(f"Error generating rapid mcq session: {e}")
        return {"source": "fallback", "questions": _fallback_questions(topic, level)}


def generate_rapid_mcq_report(topic: str, level: int, score: int, total_questions: int, question_results: list, time_taken_seconds: int) -> dict:
    level_label = _normalize_level(level)
    accuracy = round((score / total_questions) * 100) if total_questions else 0
    missed = [item for item in question_results if not item.get("isCorrect")]
    weak_focus = [item.get("focusArea", topic) for item in missed]
    focus_topic = max(set(weak_focus), key=weak_focus.count) if weak_focus else topic

    system_prompt = (
        "You are a learning performance coach. Return ONLY valid JSON with keys: "
        "summary, personalizedFeedback, strengths, improvements, nextStep."
    )
    user_prompt = (
        f"Topic: {topic}\n"
        f"Level: {level_label}\n"
        f"Score: {score}/{total_questions}\n"
        f"Accuracy: {accuracy}%\n"
        f"Time: {time_taken_seconds}s\n"
        f"Primary weak focus: {focus_topic}\n"
        "Provide concise coaching output. strengths and improvements must be arrays of short bullet-style strings."
    )

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="llama-3.1-8b-instant",
            max_tokens=500,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        return {
            "summary": str(parsed.get("summary") or f"You scored {score}/{total_questions} in this rapid round."),
            "personalizedFeedback": str(parsed.get("personalizedFeedback") or "Keep practicing consistently to improve speed and accuracy."),
            "strengths": parsed.get("strengths") if isinstance(parsed.get("strengths"), list) else ["You completed a full timed round."],
            "improvements": parsed.get("improvements") if isinstance(parsed.get("improvements"), list) else [f"Revisit {focus_topic.replace('_', ' ')} concepts."],
            "nextStep": str(parsed.get("nextStep") or f"Take another {level_label} round focused on {focus_topic.replace('_', ' ')}."),
        }
    except Exception as e:
        print(f"Error generating rapid mcq report: {e}")
        return {
            "summary": f"You scored {score}/{total_questions} with {accuracy}% accuracy.",
            "personalizedFeedback": "Strong effort under time pressure. Focus on missed concepts and reattempt to improve consistency.",
            "strengths": [
                "Completed the full timed assessment.",
                "Maintained pace in a rapid quiz format.",
            ],
            "improvements": [
                f"Review weak focus area: {focus_topic.replace('_', ' ')}.",
                "Recheck incorrect answers and explanations before retrying.",
            ],
            "nextStep": f"Run one more {level_label} rapid round after a 10-minute revision on {focus_topic.replace('_', ' ')}.",
        }


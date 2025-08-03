# === Core Imports ===
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
from docx import Document  # <-- New import for Word support
import openai
import os
import re
import json
from dotenv import load_dotenv

# === Database & Auth Imports ===
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from app.auth import hash_password, verify_password
from app.models import User
from app.database import get_db

# === JWT Handling ===
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

# === Utility Functions ===

def safe_json_parse(content):
    """Try to safely parse a JSON array/object from AI response text."""
    try:
        match = re.search(r'\[\s*{.*}\s*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content)
    except Exception:
        return [{"requirement": "AI Extraction Error", "explanation": content}]

def extract_text_from_pdf(file):
    """Extract all text from a PDF file (each page)."""
    pdf_reader = PyPDF2.PdfReader(file)
    text = ''
    for page in pdf_reader.pages:
        text += page.extract_text() or ''
    return text

def extract_text_from_docx(file):
    """Extract all text from a Word (.docx) file."""
    document = Document(file)
    return '\n'.join([para.text for para in document.paragraphs])

def extract_text(file: UploadFile):
    """
    Extract text from uploaded file.
    Supports: PDF (.pdf), Word (.docx), and plain text (.txt).
    """
    filename = file.filename.lower()
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file.file)
    elif filename.endswith('.docx'):
        return extract_text_from_docx(file.file)
    else:
        # Treat everything else as plain text
        return file.file.read().decode("utf-8", errors="ignore")

def clean_explanation(text):
    """Make AI explanations more readable for users."""
    text = text.strip()
    if text and not text[0].isupper():
        text = text[0].upper() + text[1:]
    if text and text[-1] not in ".!?":
        text += "."
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'(?<![.?!])\n', '. ', text)
    return text

# === OPENAI SETUP ===

load_dotenv()  # Load secrets from .env for devs
openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)
MODEL = "gpt-4.1-nano"

# === Requirement Extraction Functions ===

def extract_requirements_gpt(job_desc):
    """Ask OpenAI to extract explicit/implicit requirements from job posting."""
    system_prompt = (
        "Extract a detailed JSON array of all explicit and implicit job requirements from the following job description. "
        "For each requirement, include the field 'requirement' (a short title), and 'explanation' (concise reason/context for why it's needed). "
        "Only include requirements that could be checked on a resume (e.g., years of experience, education, certifications, security clearance, eligibility, skills, language, work location, schedule, etc). "
        "Format: [{\"requirement\": \"...\", \"explanation\": \"...\"}]"
    )
    user_prompt = f"Job Description:\n{job_desc}\n\nExtract the requirements as a JSON list."
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=800,
    )
    requirements = safe_json_parse(response.choices[0].message.content)
    return requirements

def match_requirements_gpt(resume_text, requirements):
    """
    Ask OpenAI to compare the parsed requirements and the user's resume,
    and return which requirements are clearly met or missing.
    """
    system_prompt = (
        "You are a helpful HR assistant. For each job requirement below, check if the candidate resume CLEARLY meets the requirement. "
        "For each, output an object: {'requirement': <requirement>, 'met': true/false, 'explanation': <very short explanation>}. "
        "Be strict—if the requirement is not CLEARLY met in the resume, set 'met': false."
    )
    req_list = [
        {"requirement": r["requirement"], "explanation": r.get("explanation", "")}
        for r in requirements
    ]
    user_prompt = (
        f"Job requirements:\n{json.dumps(req_list, indent=2)}\n\n"
        f"Candidate resume:\n{resume_text}\n\n"
        "Return a JSON array as specified."
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=1800,
    )
    match_results = safe_json_parse(response.choices[0].message.content)
    return match_results

def ai_match_score(resume_text, job_text):
    """Simple overlap score for resume and job text as a backup."""
    resume_words = set(re.findall(r'\w+', resume_text.lower()))
    job_words = set(re.findall(r'\w+', job_text.lower()))
    overlap = resume_words.intersection(job_words)
    return len(overlap) / (len(job_words) + 1e-5)

# === FASTAPI APPLICATION SETUP ===

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change in prod!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Resume Upload & Analysis Endpoint ===

@app.post("/upload-resume/")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Receive user's resume file and job description,
    extract requirements and match using AI, return match data.
    """
    try:
        resume_text = extract_text(resume)
        job_text = job_description

        requirements = extract_requirements_gpt(job_text)
        match_results = match_requirements_gpt(resume_text, requirements)

        met_requirements = []
        missing_requirements = []
        requirement_explanations = {}

        for r in match_results:
            req = r["requirement"]
            orig_expl = next((x.get("explanation") for x in requirements if x["requirement"] == req), "")
            ai_expl = r.get("explanation", "")
            explanation = orig_expl
            if ai_expl:
                if explanation and not explanation.endswith("."):
                    explanation += "."
                if explanation:
                    explanation += " "
                explanation += ai_expl
            explanation = clean_explanation(explanation)
            requirement_explanations[req] = explanation
            if r.get("met") is True or str(r.get("met")).lower() == "true":
                met_requirements.append(req)
            else:
                missing_requirements.append(req)

        score = ai_match_score(resume_text, job_text)

        # Extra AI Q&A for user guidance
        system_prompt = (
            "You are a smart job matching assistant. Analyze the following job description and resume. "
            "1. Suggest up to 5 very relevant, dynamic, and context-specific questions a candidate might want to ask about their fit or preparation for this job (DO NOT use generic questions; infer from the specific job). "
            "2. For each question, give a clear answer based on the resume and job description. "
            "Format your answer as a JSON list like this: "
            '[{"question": "...", "answer": "..."}]'
        )
        user_prompt = (
            f"Job Description:\n{job_text}\n\nResume:\n{resume_text}\n\n"
            "Return only the JSON list."
        )
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=700,
        )
        ai_suggestions = safe_json_parse(response.choices[0].message.content)

        return {
            "scores": [score],
            "met_requirements": met_requirements,
            "missing_requirements": missing_requirements,
            "requirement_explanations": requirement_explanations,
            "ai_suggestions": ai_suggestions,
        }
    except Exception as e:
        return {
            "scores": [0.0],
            "met_requirements": [],
            "missing_requirements": [],
            "requirement_explanations": {},
            "ai_suggestions": [{"question": "Error", "answer": str(e)}],
        }

# === USER REGISTRATION ENDPOINT ===

@app.post("/register/")
def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Register a new user account (requires unique username and email).
    """
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(password)
    new_user = User(username=username, email=email, hashed_password=hashed_pw)
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed")
    return {"id": new_user.id, "username": new_user.username, "email": new_user.email}

# === USER LOGIN ENDPOINT ===

@app.post("/login/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with either username or email.
    Returns a JWT token and basic user info on success.
    """
    user = db.query(User).filter(
        or_(
            User.email == form_data.username,
            User.username == form_data.username
        )
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username/email or password")

    SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
    payload = {
        "sub": user.username,
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }

# === JWT-Protected User Info Endpoint ===

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decode the JWT token, find the user, and return the user object.
    Used for endpoints that require login.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@app.get("/me/")
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get details about the currently logged-in user (JWT required)."""
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}

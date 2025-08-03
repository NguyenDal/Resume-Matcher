from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import openai
import os
import re
import json
from dotenv import load_dotenv

# --- For user registration ---
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.auth import hash_password, verify_password
from app.models import User
from app.database import get_db

# --- For user login ---
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta

# === UTILS ===

def safe_json_parse(content):
    """Attempts to robustly extract and parse a JSON array or object from a string."""
    try:
        match = re.search(r'\[\s*{.*}\s*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content)
    except Exception:
        return [{"requirement": "AI Extraction Error", "explanation": content}]

def extract_text_from_pdf(file):
    pdf_reader = PyPDF2.PdfReader(file)
    text = ''
    for page in pdf_reader.pages:
        text += page.extract_text() or ''
    return text

def extract_text(file: UploadFile):
    if file.filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file.file)
    else:
        return file.file.read().decode("utf-8", errors="ignore")

def clean_explanation(text):
    """Cleans explanation text for user-friendliness."""
    text = text.strip()
    if text and not text[0].isupper():
        text = text[0].upper() + text[1:]
    if text and text[-1] not in ".!?":
        text += "."
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'(?<![.?!])\n', '. ', text)
    return text

# === OPENAI SETUP ===

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)
MODEL = "gpt-4.1-nano" 

# === REQUIREMENT EXTRACTION ===

def extract_requirements_gpt(job_desc):
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
    resume_words = set(re.findall(r'\w+', resume_text.lower()))
    job_words = set(re.findall(r'\w+', job_text.lower()))
    overlap = resume_words.intersection(job_words)
    return len(overlap) / (len(job_words) + 1e-5)

# === FASTAPI SETUP ===

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-resume/")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        resume_text = extract_text(resume)
        job_text = job_description

        # 1. Dynamic requirements extraction
        requirements = extract_requirements_gpt(job_text)

        # 2. Requirement match (all at once)
        match_results = match_requirements_gpt(resume_text, requirements)

        met_requirements = []
        missing_requirements = []
        requirement_explanations = {}

        for r in match_results:
            req = r["requirement"]
            orig_expl = next((x.get("explanation") for x in requirements if x["requirement"] == req), "")
            ai_expl = r.get("explanation", "")
            # Merge and clean explanation for user friendliness
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

        # Simple AI match score for now (optional)
        score = ai_match_score(resume_text, job_text)

        # AI-powered fit Q&A
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
def register_user(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(password)
    new_user = User(email=email, hashed_password=hashed_pw)
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed")
    return {"id": new_user.id, "email": new_user.email}

# === USER LOGIN ENDPOINT ===
@app.post("/login/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Issue JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
    payload = {
        "sub": user.email,
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "email": user.email}

# === JWT-Protected User Info Endpoint ===

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@app.get("/me/")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import openai
import os
import re
import json
from dotenv import load_dotenv

from sentence_transformers import SentenceTransformer, util

# Load .env variables
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)

# Load Sentence Transformer model
semantic_model = SentenceTransformer('all-MiniLM-L6-v2')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def ai_match_score(resume_text, job_text):
    emb_resume = semantic_model.encode(resume_text)
    emb_job = semantic_model.encode(job_text)
    score = float(util.cos_sim(emb_resume, emb_job).item())
    return score

def check_hard_rules(job_text, resume_text):
    rules = [
        {"rule": r"(driver.?s license|driving license|valid license)", "desc": "Driver's license required"},
        {"rule": r"([1-9]\+?|one|two|three|four|five|six|seven|eight|nine|ten) ?(year[s]? of experience|years' experience|years experience|yrs experience|yrs. experience)", "desc": "Required years of experience"},
        {"rule": r"(bachelor('|s)? degree|university degree|college degree|high school diploma|associate degree|phd|master('|s)? degree)", "desc": "Education requirement (degree/diploma/certificate)"},
        {"rule": r"(certified|certification|certificate in [\w ]+|license required|trade certification|comp.?tia|cisco|aws certified|pmp|scrum master|red hat)", "desc": "Certification required"},
        {"rule": r"(english|french|spanish|bilingual|language: [\w]+)", "desc": "Language requirement"},
        {"rule": r"(must be (a )?canadian citizen|permanent resident|work permit|work authorization|legally authorized to work)", "desc": "Work eligibility/authorization"},
        {"rule": r"(remote|work from home|hybrid|on[- ]?site|in[- ]?office)", "desc": "Work location type (remote/hybrid/onsite)"},
        {"rule": r"(relocate|relocation required|relocation assistance)", "desc": "Relocation required"},
        {"rule": r"(travel required|must travel|local travel|occasional travel)", "desc": "Travel requirement"},
        {"rule": r"(evening|night|weekend|overtime|shift work|rotating shift)", "desc": "Special schedule requirement"},
        {"rule": r"(must be able to lift|lifting up to|exerting up to \d+ pounds|physical requirement)", "desc": "Physical ability requirement"},
        {"rule": r"(background check|criminal record check|security clearance)", "desc": "Background or security check required"},
    ]
    results = []
    resume_text_lc = resume_text.lower()
    for rule in rules:
        rule_found = bool(re.search(rule["rule"], job_text.lower()))
        has_in_resume = bool(re.search(rule["rule"], resume_text_lc))
        if rule_found:
            results.append({
                "requirement": rule["desc"],
                "met": has_in_resume,
            })
    return results

def get_requirement_explanation(requirement, job_desc, resume_text):
    prompt = (
        f"Job Description:\n{job_desc}\n\n"
        f"Resume:\n{resume_text}\n\n"
        f"Requirement: {requirement}\n\n"
        "Explain in 2-3 lines, for a candidate, what this requirement means for this job. "
        "If possible, provide concrete examples or clarify why it's important in this context."
    )
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "Explanation temporarily unavailable."

def safe_json_parse(content):
    match = re.search(r'\[\s*{.*}\s*\]', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    try:
        return json.loads(content)
    except Exception:
        return [{"question": "AI Error", "answer": "Could not parse AI output."}]

def get_ai_suggestions(job_desc, resume_text):
    system_prompt = (
        "You are a smart job matching assistant. Analyze the following job description and resume. "
        "1. Suggest up to 5 very relevant, dynamic, and context-specific questions a candidate might want to ask about their fit or preparation for this job (DO NOT use generic questions; infer from the specific job). "
        "2. For each question, give a clear answer based on the resume and job description. "
        "Format your answer as a JSON list like this: "
        '[{"question": "...", "answer": "..."}]'
    )
    user_prompt = (
        f"Job Description:\n{job_desc}\n\nResume:\n{resume_text}\n\n"
        "Return only the JSON list."
    )
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=700,
        )
        content = response.choices[0].message.content.strip()
        suggestions = safe_json_parse(content)
        if isinstance(suggestions, list):
            return suggestions
        else:
            return []
    except Exception as e:
        return [{"question": "AI Error", "answer": str(e)}]

@app.post("/upload-resume/")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        resume_text = extract_text(resume)
        job_text = job_description

        score = ai_match_score(resume_text, job_text)
        hard_rules = check_hard_rules(job_text, resume_text)
        suggestions = get_ai_suggestions(job_text, resume_text)

        met_requirements = [r["requirement"] for r in hard_rules if r["met"]]
        missing_requirements = [r["requirement"] for r in hard_rules if not r["met"]]

        # AI explanations for each requirement
        requirement_explanations = {}
        for r in hard_rules:
            req = r["requirement"]
            requirement_explanations[req] = get_requirement_explanation(req, job_text, resume_text)

        return {
            "scores": [score],
            "met_requirements": met_requirements,
            "missing_requirements": missing_requirements,
            "requirement_explanations": requirement_explanations,
            "ai_suggestions": suggestions,
        }
    except Exception as e:
        return {
            "scores": [0.0],
            "met_requirements": [],
            "missing_requirements": [],
            "requirement_explanations": {},
            "ai_suggestions": [{"question": "Error", "answer": str(e)}],
        }

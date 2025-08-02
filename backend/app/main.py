from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2

app = FastAPI()

# Allow local frontend
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
        # Assume text file
        return file.file.read().decode("utf-8", errors="ignore")

def match_score(resume_text, job_text):
    # Simple match: percent of job keywords found in resume
    import re
    from collections import Counter

    job_words = set(re.findall(r"\w+", job_text.lower()))
    resume_words = set(re.findall(r"\w+", resume_text.lower()))
    overlap = job_words.intersection(resume_words)
    if not job_words:
        return 0.0, []
    score = len(overlap) / len(job_words)
    # Return top keywords as the labels
    labels = [w.capitalize() for w in overlap][:3]
    return score, labels

@app.post("/upload-resume/")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        resume_text = extract_text(resume)
        job_text = job_description

        score, labels = match_score(resume_text, job_text)
        keywords = ", ".join(sorted(set(job_text.split()), key=lambda x: -job_text.count(x)))[:200]

        return {
            "scores": [score],
            "labels": labels,
            "sequence": keywords
        }
    except Exception as e:
        return {
            "scores": [0.0],
            "labels": [],
            "sequence": f"Error: {str(e)}"
        }

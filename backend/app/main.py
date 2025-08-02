from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import spacy

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model globally (only once)
nlp = spacy.load("en_core_web_sm")

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

def extract_technical_keywords(text: str):
    """
    Extracts technical/noun/proper-noun keywords using spaCy.
    Returns only unique capitalized or all-uppercase words.
    """
    doc = nlp(text)
    keywords = set()
    for token in doc:
        if token.pos_ in {"NOUN", "PROPN"} and len(token.text) > 2 and not token.is_stop:
            keywords.add(token.text)
    for ent in doc.ents:
        if ent.label_ in {"ORG", "PRODUCT", "LANGUAGE"}:
            keywords.add(ent.text)
    # Only return technical/capitalized/all-uppercase tokens
    return {k for k in keywords if k[0].isupper() or k.isupper()}

def match_score(resume_keywords, job_keywords):
    overlap = resume_keywords & job_keywords
    union = resume_keywords | job_keywords
    if not union:
        return 0.0, []
    score = len(overlap) / len(union)
    labels = sorted(overlap, key=lambda x: -len(x))[:5]
    return score, labels

@app.post("/upload-resume/")
async def upload_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        resume_text = extract_text(resume)
        job_text = job_description

        resume_keywords = extract_technical_keywords(resume_text)
        job_keywords = extract_technical_keywords(job_text)

        score, labels = match_score(resume_keywords, job_keywords)

        sequence = ", ".join(sorted(resume_keywords | job_keywords))

        return {
            "scores": [score],
            "labels": labels,
            "sequence": sequence
        }
    except Exception as e:
        return {
            "scores": [0.0],
            "labels": [],
            "sequence": f"Error: {str(e)}"
        }

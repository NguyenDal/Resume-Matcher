from fastapi import FastAPI, File, UploadFile, HTTPException
import spacy
from transformers import pipeline

from pdfminer.high_level import extract_text
import io
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model and zero-shot-classification pipeline
nlp = spacy.load("en_core_web_sm")
job_matcher = pipeline('zero-shot-classification', model='facebook/bart-large-mnli')

def extract_resume_text(file: UploadFile):
    if file.filename.lower().endswith('.pdf'):
        # For PDFs
        content = file.file.read()
        text = extract_text(io.BytesIO(content))
        return text
    else:
        # For plain text
        content = file.file.read()
        return content.decode('utf-8')

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...)):
    try:
        resume_text = extract_resume_text(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # Extract keywords using spaCy (filter out non-words)
    doc = nlp(resume_text)
    keywords = [token.text for token in doc if token.is_alpha and token.pos_ in ['NOUN', 'PROPN', 'ADJ']]

    # Hardcoded job description for demo
    job_description = "Looking for a software developer with Python, JavaScript, and cloud experience."
    result = job_matcher(" ".join(keywords), candidate_labels=[job_description])

    return {"keywords": keywords, "matching_score": result}

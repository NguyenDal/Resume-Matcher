# Resume Matcher

A web app to check how well your resume matches a job description, see detailed requirement breakdown, and get personalized job application insights.

---

## Features

- Upload a resume (PDF or TXT)
- Paste a job description
- Instantly see a match score and which requirements are met/missing
- Get smart, tailored Q&A for your application (no mention of AI)
- User-friendly, modern interface

---

## Requirements

- Python 3.9+
- Node.js (v16+ recommended)
- npm (comes with Node.js)
- [OpenAI API Key](https://platform.openai.com/)

---

## Setup Instructions

### 1. Clone the Repository


git clone https://github.com/NguyenDal/Resume-Matcher.git
cd Resume-Matcher
### 2. Backend Setup (FastAPI)
a. (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

b. Install Python dependencies

pip install -r requirements.txt

If you don’t have a requirements.txt, use:

pip install fastapi uvicorn python-dotenv openai PyPDF2 nltk sentence-transformers

c. Configure environment variables
Create a .env file in your backend directory (where main.py is located) with:

OPENAI_API_KEY=your_openai_api_key_here

d. Start the FastAPI server
# If main.py is at root
py -m uvicorn main:app --reload
# If main.py is inside an 'app' folder:
py -m uvicorn app.main:app --reload
The server runs at: http://localhost:8000

3. Frontend Setup (React)
cd frontend
npm install
npm start
The frontend runs at: http://localhost:3000

Usage
Open http://localhost:3000 in your browser.

Upload your resume and paste the job description.

Click Check Match.

Review your match score, see detailed requirement breakdown, and use the fit Q&A for preparation.

Troubleshooting
CORS error?
Ensure the backend allows http://localhost:3000 in CORSMiddleware settings.

OpenAI key not found?
Double-check your .env file and restart the backend after updating it.

PDF extraction fails?
Use a non-password-protected, standard PDF.

Dependency errors?
Upgrade pip: pip install --upgrade pip and try again.

License
MIT License.
Feel free to use, fork, or contribute!
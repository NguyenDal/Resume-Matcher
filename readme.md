# TalentMatch

A web app to check how well your resume matches a job description, see detailed requirement breakdown, and get personalized job application insights.

---

## Features

- Upload a resume (PDF or TXT)
- Paste a job description
- Instantly see a match score and which requirements are met/missing
- Get smart, tailored Q&A for your application
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
#### Create and activate a virtual environment
python -m venv venv
##### Windows:
venv\Scripts\activate
##### MacOS/Linux:
source venv/bin/activate

#### Install Python dependencies

pip install -r requirements.txt

If you don’t have a requirements.txt, use:

pip install fastapi uvicorn python-dotenv openai PyPDF2 nltk sentence-transformers

#### Configure environment variables
Create a .env file in your backend directory with:

OPENAI_API_KEY=your_openai_api_key_here

#### Start the FastAPI server
##### If main.py is at root
py -m uvicorn main:app --reload
##### If main.py is inside an 'app' folder:
py -m uvicorn app.main:app --reload
The server runs at: http://localhost:8000

### 3. Frontend Setup (React)
cd frontend
npm install
npm start
The frontend runs at: http://localhost:3000

Usage
Open http://localhost:3000 in your browser.

Upload your resume and paste the job description.

Click Check Match.

Review your match score, see detailed requirement breakdown, and use the fit Q&A for preparation.

### 4. Troubleshooting
#### CORS error?
Ensure the backend allows http://localhost:3000 in CORSMiddleware settings.

#### OpenAI key not found?
Double-check your .env file and restart the backend after updating it.

#### PDF extraction fails?
Use a non-password-protected, standard PDF.

#### Dependency errors?
Upgrade pip: pip install --upgrade pip and try again.

### 5. Security
#### a. Password Hashing

User passwords are never stored in plain text.

When you register, your password is “hashed” using a strong algorithm (bcrypt or similar).
This means even if someone accesses the database, they can’t see or use your password.

During login, your password is checked by comparing the hash, not the real password.

#### b. User Authentication & JWT Tokens

After a successful login, the backend gives you an access token (called a JWT – JSON Web Token).

This token acts like a digital key, letting you access your own data or protected endpoints.

The token contains only your basic info (user id, email, and expiry date), and it’s cryptographically signed, so it cannot be tampered with.

#### c. Protected API Routes

Some API routes (like /me/ or other user data) require you to send your JWT token.

If you don’t include the token, or it’s expired/invalid, access is denied.

This makes sure that only logged-in users can see or edit their own info.

#### d. CORS (Cross-Origin Resource Sharing)

The backend is configured to only accept requests from your frontend (for example, http://localhost:3000).

This helps block unwanted requests from other websites or sources.

#### e. Environment Variables

Sensitive information (like your OpenAI API key and secret keys) should always go in your .env file.

Never commit your .env to git or share it publicly.

### 6. License
Apache License.
Feel free to use, fork, or contribute!
import React, { useState } from "react";
import axios from "axios";

const ResumeMatcher = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
    setResult(null);
  };

  const handleJobDescChange = (e) => {
    setJobDesc(e.target.value);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDesc) {
      alert("Please upload your resume and paste the job description.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_description", jobDesc);

    try {
      const res = await axios.post("http://localhost:8000/upload-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: "There was a problem processing your request." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">Resume Job Matching</h1>
        <h2 className="text-lg text-center text-gray-700 mb-6">AI-Powered Fit Analysis & Q&amp;A</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Upload your Resume <span className="text-xs text-gray-500">(.pdf, .txt):</span>
            </label>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
              "
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Paste Job Description:
            </label>
            <textarea
              rows={7}
              value={jobDesc}
              onChange={handleJobDescChange}
              placeholder="Paste the job description here..."
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 resize-vertical"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition"
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Match"}
          </button>
        </form>
        {result && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
            {result.error ? (
              <div className="text-red-500">{result.error}</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Match Score:</span>{" "}
                  <span className="text-2xl font-bold">
                    {result.scores?.[0] !== undefined
                      ? (result.scores[0] * 100).toFixed(1) + "%"
                      : "N/A"}
                  </span>
                </div>
                {/* Score Explanation */}
                <div className="mb-4">
                  <span className="font-semibold">Why this score?</span>
                  <p className="text-gray-800 whitespace-pre-line mt-1">{result.score_reason}</p>
                </div>

                {/* Met Requirements - Green */}
                {Array.isArray(result.met_requirements) && result.met_requirements.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-green-700 mb-2">You meet these requirements:</div>
                    <div className="flex flex-col gap-2">
                      {result.met_requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="border border-green-400 bg-green-50 text-green-900 rounded-lg p-3 font-medium"
                        >
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Requirements - Red */}
                {Array.isArray(result.missing_requirements) && result.missing_requirements.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-red-700 mb-2">You don't meet these requirements:</div>
                    <div className="flex flex-col gap-2">
                      {result.missing_requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="border border-red-400 bg-red-50 text-red-900 rounded-lg p-3 font-medium"
                        >
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggested Questions */}
                {Array.isArray(result.ai_suggestions) && result.ai_suggestions.length > 0 && (
                  <>
                    <div className="font-semibold text-blue-700 mb-2">
                      AI-Powered Fit Questions:
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.ai_suggestions.map((q, idx) => (
                        <div key={idx} className="border border-blue-300 rounded-lg bg-white">
                          <button
                            type="button"
                            className="w-full text-left p-3 font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-t-lg transition"
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                          >
                            {q.question}
                          </button>
                          {expandedIdx === idx && (
                            <div className="px-4 pb-4 pt-1 text-gray-800 bg-blue-50 rounded-b-lg border-t border-blue-200">
                              {q.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        <div className="mt-8 text-center text-gray-400 text-xs">Resume Matcher © 2025</div>
      </div>
    </div>
  );
};

export default ResumeMatcher;

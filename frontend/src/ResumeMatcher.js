import React, { useState } from "react";
import axios from "axios";

const ResumeMatcher = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      {/* Remove the red test box after verifying */}
      {/* <div className="bg-red-500 text-white p-8">If you see this in red, Tailwind is working!</div> */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">Resume Job Matching</h1>
        <h2 className="text-lg text-center text-gray-700 mb-6">Resume &amp; Job Description Matcher</h2>
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
              rows={6}
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
                    {(result.scores?.[0] * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Labels:</span>{" "}
                  {result.labels?.join(", ")}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Show Keywords</summary>
                  <div className="mt-1 text-sm text-gray-700 break-words">{result.sequence}</div>
                </details>
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

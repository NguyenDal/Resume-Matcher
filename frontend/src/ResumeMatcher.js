import React, { useState } from "react";
import axios from "axios";

const ResumeMatcher = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedReq, setExpandedReq] = useState(null);
  const [userMet, setUserMet] = useState([]);
  const [userMissing, setUserMissing] = useState([]);

  // Original met/missing requirements (from AI)
  const originalMet = result?.met_requirements || [];
  const originalMissing = result?.missing_requirements || [];

  // Calculate the effective met/missing requirements based on backend + user toggles
  const effectiveMet = [
    ...originalMet,
    ...userMet.filter(req => !originalMet.includes(req)),
  ].filter(req => !userMissing.includes(req));
  const effectiveMissing = [
    ...originalMissing,
    ...userMissing.filter(req => !originalMissing.includes(req)),
  ].filter(req => !userMet.includes(req));

  // Unique full requirement list
  const allRequirements = [...originalMet, ...originalMissing].filter(
    (v, i, a) => a.indexOf(v) === i
  );
  const requirementsMetCount = effectiveMet.length;
  const requirementsTotal = allRequirements.length;
  const requirementsMetScore =
    requirementsTotal > 0
      ? ((requirementsMetCount / requirementsTotal) * 100).toFixed(1)
      : "N/A";

  // Render expandable requirement box (works for both met and missing)
  const renderRequirementBox = (req, isMet) => (
    <div
      key={req}
      className={`border ${
        isMet
          ? "border-green-400 bg-green-50 text-green-900"
          : "border-red-400 bg-red-50 text-red-900"
      } rounded-lg p-0 font-medium`}
    >
      <button
        className="w-full text-left p-3 font-medium focus:outline-none"
        onClick={() => setExpandedReq(expandedReq === req ? null : req)}
      >
        {req}
      </button>
      {expandedReq === req && (
        <div
          className={`px-4 pb-4 pt-1 text-gray-800 ${
            isMet
              ? "bg-green-50 border-t border-green-200"
              : "bg-red-50 border-t border-red-200"
          } rounded-b-lg`}
        >
          <div className="mb-2">
            {result.requirement_explanations?.[req] || "Loading explanation..."}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-green-200 text-green-800 hover:bg-green-300 font-semibold"
              onClick={() => {
                // Move to met
                setUserMet(prev => Array.from(new Set([...prev, req])));
                setUserMissing(prev => prev.filter(x => x !== req));
                setExpandedReq(null);
              }}
            >
              Yes, I meet this
            </button>
            <button
              className="px-3 py-1 rounded bg-red-200 text-red-800 hover:bg-red-300 font-semibold"
              onClick={() => {
                // Move to missing
                setUserMissing(prev => Array.from(new Set([...prev, req])));
                setUserMet(prev => prev.filter(x => x !== req));
                setExpandedReq(null);
              }}
            >
              No, I don’t
            </button>
          </div>
          {/* Optionally show this: */}
          {originalMet.includes(req) && (
            <div className="mt-2 text-xs text-gray-500 italic">
            </div>
          )}
          {originalMissing.includes(req) && (
            <div className="mt-2 text-xs text-gray-500 italic">
            </div>
          )}
        </div>
      )}
    </div>
  );

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
    setResult(null);
    setUserMet([]);
    setUserMissing([]);
  };

  const handleJobDescChange = (e) => {
    setJobDesc(e.target.value);
    setResult(null);
    setUserMet([]);
    setUserMissing([]);
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
      setUserMet([]);
      setUserMissing([]);
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
                {/* Match Score */}
                <div className="mb-4">
                  <span className="font-semibold">Match Score:</span>{" "}
                  <span className="text-2xl font-bold text-green-700">
                    {requirementsMetScore}%
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({requirementsMetCount} of {requirementsTotal})
                  </span>
                </div>
                {/* Met Requirements */}
                {Array.isArray(effectiveMet) && effectiveMet.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-green-700 mb-2">You meet these requirements:</div>
                    <div className="flex flex-col gap-2">
                      {effectiveMet.map((req) => renderRequirementBox(req, true))}
                    </div>
                  </div>
                )}
                {/* Missing Requirements */}
                {Array.isArray(effectiveMissing) && effectiveMissing.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-red-700 mb-2">You don't meet these requirements:</div>
                    <div className="flex flex-col gap-2">
                      {effectiveMissing.map((req) => renderRequirementBox(req, false))}
                    </div>
                  </div>
                )}
                {/* AI Suggestions */}
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
                            onClick={() => setExpandedReq(expandedReq === "ai_" + idx ? null : "ai_" + idx)}
                          >
                            {q.question}
                          </button>
                          {expandedReq === "ai_" + idx && (
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

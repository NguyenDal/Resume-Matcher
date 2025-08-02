import React, { useState } from "react";
import axios from "axios";

const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/upload-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(response.data);
    } catch (error) {
      alert("Upload failed");
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Upload your resume (.txt or .pdf)</h2>
      <input type="file" onChange={handleFileChange} accept=".txt,.pdf" />
      <button onClick={handleSubmit}>Upload</button>
      {result && (
        <div>
          <h3>Result</h3>
          <p><b>Keywords:</b> {result.keywords && result.keywords.join(', ')}</p>
          <pre>{JSON.stringify(result.matching_score, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;

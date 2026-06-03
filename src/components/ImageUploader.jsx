import React, { useState } from 'react';
// Import the static remediation dictionary we made in Part 1
import remediesData from '../data/remedies.json';

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Handle local image file loading for preview rendering
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file)); // Generate temporary URL for <img> tag
      setPrediction(null); // Clear out previous results
      setError(null);
    }
  };

  // Asynchronous communication to your FastAPI engine running on 127.0.0.1:8000
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a target leaf image first.");
      return;
    }

    setLoading(true);
    setError(null);

    // Build the multipart/form-data payload required by your python model loader
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status code: ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Inference Connection Error:", err);
      setError("Failed to reach AgriShield core engine. Ensure Uvicorn is active.");
    } finally {
      setLoading(false);
    }
  };

  // Safe dictionary lookup to fetch treatment plans based on backend response
  const getRemedialDetails = (diseaseKey) => {
    return remediesData[diseaseKey] || {
      title: `Unmapped Key: [${diseaseKey}]`,
      severity: "Unknown",
      organic: "No verified organic treatment profile matches this machine identification key.",
      chemical: "Consult a local agricultural extension officer for broad-spectrum remediation alternatives.",
      prevention: "Isolate the infected plant zone to prevent cross-contamination vector paths."
    };
  };

  const treatment = prediction ? getRemedialDetails(prediction.disease) : null;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#2e7d32' }}>AgriShield Diagnostic Console</h2>
      
      {/* File Input Selection Wrapper */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #9ccc65', borderRadius: '8px', textAlign: 'center' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="leaf-file-input" />
        <label htmlFor="leaf-file-input" style={{ cursor: 'pointer', padding: '10px 20px', background: '#8bc34a', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>
          Select Leaf Image
        </label>
        {selectedFile && <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>{selectedFile.name}</div>}
      </div>

      {/* Local Image Preview Window */}
      {imagePreview && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={imagePreview} alt="Target leaf upload preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      {/* Submission Control Trigger */}
      <button onClick={handleUploadSubmit} disabled={loading || !selectedFile} style={{ width: '100%', padding: '12px', background: loading ? '#bdbdbd' : '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
        {loading ? "Processing AI Inference Model..." : "Analyze Crop Health"}
      </button>

      {/* Failure Feedback Alert */}
      {error && <div style={{ marginTop: '20px', padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '4px', borderLeft: '5px solid #c62828' }}>{error}</div>}

      {/* Production Result Output Mapping */}
      {prediction && treatment && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f1f8e9', borderRadius: '8px', border: '1px solid #c5e1a5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #a4c639', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#33691e' }}>{treatment.title}</h3>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: treatment.severity === 'High' ? '#ef5350' : treatment.severity === 'Moderate' ? '#ffb74d' : '#81c784', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
              Severity: {treatment.severity}
            </span>
          </div>

          <p style={{ margin: '5px 0 15px 0', fontSize: '14px', color: '#666' }}>
            Identification Confidence: <strong>{(prediction.confidence * 100).toFixed(2)}%</strong> 
            {prediction.mocked && <span style={{ color: '#e65100', marginLeft: '10px' }}>[MOCK MODE ACTIVE]</span>}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#1b5e20', display: 'block', marginBottom: '4px' }}>Organic Remediation:</strong>
            <span style={{ fontSize: '15px', color: '#333' }}>{treatment.organic}</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#b71c1c', display: 'block', marginBottom: '4px' }}>Chemical Control Alternative:</strong>
            <span style={{ fontSize: '15px', color: '#333' }}>{treatment.chemical}</span>
          </div>

          <div>
            <strong style={{ color: '#455a64', display: 'block', marginBottom: '4px' }}>Preventative Guidelines:</strong>
            <span style={{ fontSize: '15px', color: '#333' }}>{treatment.prevention}</span>
          </div>
        </div>
      )}
    </div>
  );
}
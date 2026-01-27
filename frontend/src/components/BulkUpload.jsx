import { useState } from "react";

export default function BulkUpload({ onUploadComplete, API_BASE }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a CSV file");
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${API_BASE}/api/students/bulk`, {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setFile(null);
                if (onUploadComplete) {
                    onUploadComplete();
                }
            } else {
                setResult({ error: data.error || "Upload failed" });
            }
        } catch (err) {
            setResult({ error: "Connection error. Please try again." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card bulk-upload-section">
            <h2 className="form-title">📤 Bulk Upload Students (CSV)</h2>
            <p className="upload-description">
                Upload a CSV file with columns: <code>name</code>, <code>email</code>, <code>repo_url</code>
            </p>

            <div className="file-upload-container">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="file-input"
                    id="csv-file"
                />
                <label htmlFor="csv-file" className="file-label">
                    {file ? `📄 ${file.name}` : "Choose CSV File"}
                </label>
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn-primary"
                    style={{ marginLeft: "1rem" }}
                >
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </div>

            {result && (
                <div className={`upload-result ${result.error ? "error" : "success"}`}>
                    {result.error ? (
                        <p>❌ {result.error}</p>
                    ) : (
                        <>
                            <p>✅ Upload Complete!</p>
                            <p>Imported: {result.imported} | Failed: {result.failed}</p>
                            {result.errors && result.errors.length > 0 && (
                                <details className="error-details">
                                    <summary>View Errors ({result.errors.length})</summary>
                                    <ul>
                                        {result.errors.map((err, idx) => (
                                            <li key={idx}>
                                                Row {err.row}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

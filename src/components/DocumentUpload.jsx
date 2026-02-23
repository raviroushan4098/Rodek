import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '../config/firebase';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB target

export default function DocumentUpload({ value, onChange, label, folder = 'documents' }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        // Check file type: jpg, png, or pdf
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
            alert('Please upload a JPG, PNG, or PDF file.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('File too large. Max size is 2MB.');
            return;
        }

        setUploading(true);
        setProgress(0);

        const ext = isPdf ? 'pdf' : (file.name.split('.').pop() || 'tmp');
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const storageRef = ref(firebaseStorage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snap) => {
                setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
            },
            (err) => {
                console.error('Upload error:', err);
                setUploading(false);
                alert('Upload failed. Make sure Firebase Storage is enabled.');
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                onChange(url);
                setUploading(false);
                setProgress(0);
            }
        );
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const isPdfValue = value && value.includes('.pdf');

    return (
        <div className="document-upload-wrap">
            <label className="document-upload-label">{label}</label>

            {value ? (
                <div className="document-preview">
                    {isPdfValue ? (
                        <div className="pdf-preview-card">
                            <span className="pdf-icon">📄</span>
                            <span>Document Uploaded (PDF)</span>
                        </div>
                    ) : (
                        <div className="image-preview">
                            <img src={value} alt="Preview" />
                        </div>
                    )}
                    <div className="image-preview-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
                            Replace
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange('')}>
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`image-dropzone ${dragActive ? 'dropzone-active' : ''} ${uploading ? 'dropzone-uploading' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    {uploading ? (
                        <div className="upload-progress">
                            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                            <span>{progress}% uploading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="dropzone-icon">📁</div>
                            <p className="dropzone-text">Tap to select method</p>
                            <p className="dropzone-hint">Browser or Camera</p>
                            <p className="dropzone-hint">JPG, PNG or PDF (Max 2MB)</p>
                        </>
                    )}
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
            />
        </div>
    );
}

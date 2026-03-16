import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '../config/firebase';
import heic2any from 'heic2any';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB limit
const COMPRESSION_TARGET = 1000 * 1024; // 1MB target for images

/**
 * Scale down and compress image — NO cropping.
 */
function compressImage(file, maxW = 1600, maxH = 1600) {
    return new Promise((resolve) => {
        if (file.size <= COMPRESSION_TARGET && file.type === 'image/jpeg') {
            return resolve(file);
        }

        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Scale down proportionally to fit within 1600x1600
            if (width > maxW || height > maxH) {
                const ratio = Math.min(maxW / width, maxH / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Iteratively reduce quality until under 1MB
            let quality = 0.90;
            const tryCompress = () => {
                canvas.toBlob(
                    (blob) => {
                        if (blob.size > COMPRESSION_TARGET && quality > 0.3) {
                            quality -= 0.05;
                            tryCompress();
                        } else {
                            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            tryCompress();
        };

        img.src = URL.createObjectURL(file);
    });
}

export default function DocumentUpload({ value, onChange, label, folder = 'documents' }) {
    const [uploading, setUploading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        // Check file type: jpg, png, or pdf, or HEIC
        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
        const isImage = file.type.startsWith('image/') || isHeic;
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
            alert('Please upload a JPG, PNG, PDF, or HEIC file.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('File too large. Max size is 30MB.');
            return;
        }

        let fileToUpload = file;
        
        if (isHeic) {
            setCompressing(true);
            try {
                const blob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.9
                });
                const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                fileToUpload = new File([finalBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
            } catch (err) {
                console.error('HEIC conversion failed:', err);
                alert('Failed to process HEIC file. Please try a standard JPG/PNG/PDF.');
                setCompressing(false);
                return;
            }
        }

        if (isImage && !isHeic) { // Standard images still need compression
            setCompressing(true);
            fileToUpload = await compressImage(fileToUpload);
            setCompressing(false);
        } else if (isHeic) {
            // Already compressed slightly during conversion, but let's run it through the standard compressor for consistency
            fileToUpload = await compressImage(fileToUpload);
            setCompressing(false);
        }

        setUploading(true);
        setProgress(0);

        const ext = isPdf ? 'pdf' : 'jpg';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const storageRef = ref(firebaseStorage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

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
                    className={`image-dropzone ${dragActive ? 'dropzone-active' : ''} ${uploading || compressing ? 'dropzone-uploading' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && !compressing && inputRef.current?.click()}
                >
                    {compressing ? (
                        <div className="upload-progress">
                            <div className="loading-spinner" />
                            <span>Resizing & compressing...</span>
                        </div>
                    ) : uploading ? (
                        <div className="upload-progress">
                            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                            <span>{progress}% uploading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="dropzone-icon">📁</div>
                            <p className="dropzone-text">Tap to select method</p>
                            <p className="dropzone-hint">Browser or Camera (Max 30MB)</p>
                            <p className="dropzone-hint">JPG, PNG, HEIC (Auto-compressed to 1MB) or PDF</p>
                        </>
                    )}
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf,.heic,.heif"
                style={{ display: 'none' }}
                onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
            />
        </div>
    );
}

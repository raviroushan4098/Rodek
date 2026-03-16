import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '../config/firebase';
import heic2any from 'heic2any';

const MAX_FILE_SIZE = 1000 * 1024; // 1MB target (Increased for clarity)
const MAX_DIMENSION = 1600;       // Increased from 1200 for better 4K source handling

/**
 * Scale down and compress image — NO cropping.
 * Keeps full image, just fits within maxW × maxH.
 */
function compressImage(file, maxW = 1600, maxH = 1200) {
    return new Promise((resolve) => {
        if (file.size <= MAX_FILE_SIZE && file.type === 'image/jpeg') {
            return resolve(file);
        }

        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Scale down proportionally to fit within maxW × maxH
            if (width > maxW || height > maxH) {
                const ratio = Math.min(maxW / width, maxH / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Iteratively reduce quality until under 1MB
            let quality = 0.92;
            const tryCompress = () => {
                canvas.toBlob(
                    (blob) => {
                        if (blob.size > MAX_FILE_SIZE && quality > 0.3) {
                            quality -= 0.05;
                            tryCompress();
                        } else if (blob.size > MAX_FILE_SIZE && width > 800) {
                            // Last resort: scale down further
                            canvas.width = Math.round(width * 0.8);
                            canvas.height = Math.round(height * 0.8);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob(
                                (finalBlob) => {
                                    resolve(new File([finalBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
                                },
                                'image/jpeg',
                                0.75
                            );
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

export default function ImageUpload({ value, onChange, folder = 'cars', maxWidth = 1600, maxHeight = 1200 }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

        if (!isHeic && !file.type.startsWith('image/')) return;

        if (file.size > 30 * 1024 * 1024) {
            alert('File too large. Max 30MB allowed.');
            return;
        }

        let processedFile = file;

        // Convert HEIC to JPEG if needed
        if (isHeic) {
            setCompressing(true);
            try {
                const blob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.9
                });
                // heic2any might return an array if the HEIC has multiple images
                const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                processedFile = new File([finalBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
            } catch (err) {
                console.error('HEIC conversion failed:', err);
                alert('Failed to process HEIC file. Please try a standard JPG/PNG.');
                setCompressing(false);
                return;
            }
        }

        setCompressing(true);
        const compressed = await compressImage(processedFile, maxWidth, maxHeight);
        setCompressing(false);

        setUploading(true);
        setProgress(0);

        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const storageRef = ref(firebaseStorage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, compressed);

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

    return (
        <div className="image-upload-wrap">
            {value ? (
                <div className="image-preview">
                    <img src={value} alt="Preview" />
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
                            <div className="dropzone-icon">📸</div>
                            <p className="dropzone-text">Drop image here or click to upload</p>
                            <p className="dropzone-hint">Supports JPG, PNG, WEBP, HEIC</p>
                            <p className="dropzone-hint">Auto-scaled to max {maxWidth}×{maxHeight}px · Under 1MB</p>
                        </>
                    )}
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                style={{ display: 'none' }}
                onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
            />
        </div>
    );
}

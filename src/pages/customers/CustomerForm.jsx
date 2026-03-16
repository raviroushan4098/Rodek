import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import DocumentUpload from '../../components/DocumentUpload';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

export default function CustomerForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', aadharNumber: '', licenseNumber: '', address: '', trustScore: 70,
        idProofUrl: '', collegeIdUrl: '', agreementUrl: ''
    });
    const [duplicateFound, setDuplicateFound] = useState(null);
    const [aadharChecking, setAadharChecking] = useState(false);
    const [isAadharVerified, setIsAadharVerified] = useState(false);

    useEffect(() => {
        if (isEdit) {
            apiFetch(`/api/customers/${id}`).then(c => {
                setForm({
                    name: c.name || '', email: c.email || '', phone: c.phone || '', aadharNumber: c.aadharNumber || '',
                    licenseNumber: c.licenseNumber || '', address: c.address || '', trustScore: c.trustScore || 70,
                    idProofUrl: c.idProofUrl || '', collegeIdUrl: c.collegeIdUrl || '', agreementUrl: c.agreementUrl || ''
                });
            }).catch(() => toast.error('Failed to load customer'));
        }
    }, [id, isEdit]);

    const checkAadhar = async (val) => {
        const sanitized = val.replace(/\D/g, '');
        console.log(`[Frontend] Checking Aadhar: ${sanitized}`);
        
        if (sanitized.length === 12 && !isEdit) {
            setAadharChecking(true);
            setIsAadharVerified(false);
            try {
                const res = await apiFetch(`/api/customers/verify?aadhar=${sanitized}`);
                console.log('[Frontend] Verify Response:', res);
                if (res.exists) {
                    setDuplicateFound(res.customer);
                    setIsAadharVerified(false);
                } else {
                    setDuplicateFound(null);
                    setIsAadharVerified(true);
                }
            } catch (err) {
                console.error('[Frontend] Aadhar check failed:', err);
                toast.error('Network error during global Aadhar lookup');
            } finally {
                setAadharChecking(false);
            }
        } else {
            setDuplicateFound(null);
            setIsAadharVerified(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (duplicateFound) return toast.error('Check existing customer details first');
        setLoading(true);
        try {
            if (isEdit) {
                await apiFetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(form) });
                toast.success('Customer updated!');
            } else {
                await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(form) });
                toast.success('Customer added!');
            }
            navigate('/customers');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => {
        const val = e.target.value;
        setForm(f => ({ ...f, [key]: val }));
        if (key === 'aadharNumber') checkAadhar(val);
    };

    return (
        <div>
            <h2 className="page-title">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit} className="form-card glass-panel">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Aadhar Number (Global ID) *</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                value={form.aadharNumber} 
                                onChange={set('aadharNumber')} 
                                placeholder="XXXX XXXX XXXX" 
                                required 
                                disabled={isEdit}
                                maxLength={14}
                                style={{ paddingRight: aadharChecking ? '2.5rem' : '0.85rem' }}
                            />
                            {aadharChecking && (
                                <div className="input-spinner-inline" />
                            )}
                            {isAadharVerified && !aadharChecking && (
                                <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} /> verified
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted mt-1">Global identifier used across all branches.</p>
                    </div>
                    <div className="form-group">
                        <label>Name *</label>
                        <input value={form.name} onChange={set('name')} placeholder="John Doe" required />
                    </div>
                    <div className="form-group">
                        <label>Phone *</label>
                        <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label>License Number</label>
                        <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="DL-12345" />
                    </div>
                    <div className="form-group form-group-full">
                        <label>Address</label>
                        <textarea value={form.address} onChange={set('address')} placeholder="Full address" rows={3} />
                    </div>
                </div>

                <div className="form-grid" style={{ marginTop: '1.5rem', gap: '1.5rem' }}>
                    <div className="form-group form-group-full">
                        <DocumentUpload
                            label="ID Proof"
                            value={form.idProofUrl}
                            onChange={(url) => setForm(f => ({ ...f, idProofUrl: url }))}
                            folder="customers/id_proofs"
                        />
                    </div>
                    <div className="form-group form-group-full">
                        <DocumentUpload
                            label="College ID Card"
                            value={form.collegeIdUrl}
                            onChange={(url) => setForm(f => ({ ...f, collegeIdUrl: url }))}
                            folder="customers/college_ids"
                        />
                    </div>
                    <div className="form-group form-group-full">
                        <DocumentUpload
                            label="Agreement"
                            value={form.agreementUrl}
                            onChange={(url) => setForm(f => ({ ...f, agreementUrl: url }))}
                            folder="customers/agreements"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/customers')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
                    </button>
                </div>
            </form>

            {duplicateFound && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                        <h3 className="text-amber" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Customer Already Registered</h3>
                        <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            This customer was already onboarded at the <span className="text-white font-bold">{duplicateFound.branch}</span> branch.
                        </p>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span className="text-muted text-sm">Full Name:</span><br />
                                <span className="font-medium">{duplicateFound.name}</span>
                            </div>
                            <div>
                                <span className="text-muted text-sm">System Trust Score:</span><br />
                                <span className={`badge badge-${duplicateFound.trustScore >= 80 ? 'emerald' : 'amber'}`}>
                                    {duplicateFound.trustScore}
                                </span>
                            </div>
                        </div>

                        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                            You don't need to re-register them. You can directly select this customer in the <span className="text-white">New Booking</span> screen using their Aadhar number.
                        </p>

                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ width: '100%' }} 
                            onClick={() => navigate('/customers')}
                        >
                            Return to List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

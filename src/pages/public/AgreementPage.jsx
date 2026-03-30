import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AgreementPage() {
    const { token } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const fetchAgreement = async () => {
            try {
                const res = await fetch(`/api/public/get-agreement?token=${token}`);
                const data = await res.json();
                
                if (!res.ok) {
                    setErrorCode(res.status);
                    throw new Error(data.error || 'Failed to fetch agreement');
                }
                
                setBooking(data);
                
                // Calculate initial time left
                if (data.expiresAt) {
                    const expiry = data.expiresAt._seconds ? data.expiresAt._seconds * 1000 : new Date(data.expiresAt).getTime();
                    setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAgreement();
    }, [token]);

    // Countdown Timer Logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError('This agreement link has expired.');
                    setErrorCode(410);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        if (seconds === null) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAccept = async () => {
        if (timeLeft === 0) {
            toast.error('Invitation has expired. Please request a new link.');
            return;
        }
        setSigning(true);
        try {
            const res = await fetch('/api/public/accept-agreement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to sign agreement');
            
            toast.success('Agreement Signed Successfully!');
            setBooking(prev => ({ ...prev, signed: true }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSigning(false);
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" />
            <p className="text-muted anim-pulse">Verifying secure link...</p>
        </div>
    );
    
    if (error || errorCode === 410) return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{errorCode === 410 ? '⏰' : '⚠️'}</div>
            <h2 style={{ color: errorCode === 410 ? 'var(--status-cancelled)' : 'inherit' }}>
                {errorCode === 410 ? 'Link Expired' : 'Invalid Agreement'}
            </h2>
            <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                {errorCode === 410 
                    ? 'For security, digital agreement links are only valid for 10 minutes. Please contact the 0-MILE office to receive a fresh link.' 
                    : error}
            </p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    if (booking?.signed) return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ color: 'var(--status-active)', fontSize: '4rem' }}>✅</h1>
            <h2>Agreement Signed</h2>
            <p className="text-muted">Thank you! Your booking is now officially confirmed. You can close this window.</p>
        </div>
    );

    return (
        <div className="public-agreement-container" style={{ padding: '1rem', maxWidth: '800px', margin: 'auto' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', borderTop: '4px solid var(--accent-color)' }}>
                {/* Expiry Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: timeLeft < 60 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255,255,255,0.05)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    marginBottom: '2rem'
                }}>
                    <span className="text-sm text-muted">Time to sign:</span>
                    <span style={{ 
                        fontWeight: 'bold', 
                        color: timeLeft < 60 ? 'var(--status-cancelled)' : 'var(--accent-color)',
                        fontFamily: 'monospace',
                        fontSize: '1.2rem'
                    }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontWeight: '800' }}>0-MILE TOUR & TRAVEL</h1>
                    <h3 style={{ opacity: 0.8 }}>SELF DRIVE CAR RENTAL AGREEMENT</h3>
                </div>

                <div className="agreement-details" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span className="text-muted">Customer</span>
                        <span className="font-bold">{booking.customer?.name}</span>
                    </div>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span className="text-muted">Vehicle</span>
                        <span className="font-bold">{booking.car?.make} {booking.car?.model} ({booking.car?.plateNumber})</span>
                    </div>
                    <div className="flex-between">
                        <span className="text-muted">Rental Period</span>
                        <span className="font-bold">{new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="agreement-text" style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    padding: '1.5rem', 
                    fontSize: '0.9rem', 
                    lineHeight: '1.7',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <h4 style={{ color: 'var(--accent-color)', marginBottom: '1rem', textTransform: 'uppercase' }}>0-MILE TOUR AND TRAVEL PRIVATE LIMITED</h4>
                    <p>__0-mile tour and travel private limited members have answered any question I have had.</p>
                    <p>__I have carefully read this agreement in its entirety and understood the contents.</p>
                    <p>● I am aware that this is an assumption of risk, waiver and release of liability and sign it voluntarily.</p>
                    <p>● I also understand that I should not and may not participate in this activity if I am under the influence of alcohol or drugs.</p>
                    <p>● If I am carrying any kind of drugs. It is only my responsibility. 0-mile tour and travel private limited have no concern in this matter.</p>
                    <p>● If I am involved in any illegal activity while using the car then I am only responsible for it, 0-mile tour and travel private limited l has the right to take back their vehicle.</p>
                    
                    <div style={{ margin: '30px 0', padding: '20px', borderLeft: '3px solid var(--accent-color)', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>I SOLEMNLY DECLARE THAT I HAVE THOROUGHLY READ THE TERMS AND CONDITION OF 0-mile tour and travel private limited AGREEMENT AND AGREE TO THEM.</p>
                        <p style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>___i assure you that i will not cross speed limit of 80 km/hr</p>
                    </div>

                    <h4 style={{ marginTop: '30px', color: 'var(--accent-color)', textAlign: 'center' }}>0-MILE TOUR AND TRAVEL PRIVATE LIMITED</h4>
                    <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>ASSUMPTION OF RISK, WAIVER AND RELEASE AGREEMENT</p>
                    
                    <p><strong>Assumption of Risk:</strong> I understand and accept that renting this Car and participating in Car Driving exposes me to many hazards and entail unavoidable risk of death, personal injury (including but not limited to severe spinal or head injury) and loss of or damage to Property. I also understand I should be in good physical health to participate in Self drive car.</p>
                    <p>I choose to participate in Self drive car in spite of these risks and hereby assume all risk of injury or loss of life to myself and loss of or damage to property arising out of renting this Self drive car.</p>
                    <p>I understand the inherent risk involved in using this equipment, and accept full responsibility for any and all such damage or injury which may result.</p>
                    
                    <p><strong>Waiver And Release:</strong> In consideration of 0-MILE renting me this Self drive car, I specifically release and forever discharge 0-MILE TOUR AND TRAVEL PRIVATE LIMITED and its affiliates, officers, agents, and employees from any and all liability or claims for injury, illness, death, loss or damage to property which I may suffer while renting this Self drive car.</p>
                    <p>This discharge specifically includes, but is not limited to, liability or claims for injury, illness, death or damage caused by the negligence of 0-MILE or its affiliates, officers, agents, or employees. It is my intent by the Waiver And Release Agreement to release 0-MILE and hold it. Harmless from all liability for any such property loss or damage, personal injury or loss of life, whether caused by the negligence of 0-MILE or whether based upon breach of contract, breach of warranty, or any other legal theory.</p>
                    <p>In signing this document, I fully recognize that if injury, illness, death or damage occurs to me while I am engaged in renting this Self drive car or participating in driving the car, I will have no right to make a claim or file a lawsuit against 0-MILE TOUR AND TRAVEL PRIVATE LIMITED or its affiliates, officers, agents or employees, even if they or any of them negligently cause my injury, illness, death or damage.</p>
                    
                    <p>__I realise the importance of SeatBelt. A Seat Belt has been recommended to me by 0-MILE TOUR AND TRAVEL PRIVATE LIMITED staff. If I do not use a Seat Belt l am doing so at my own will.</p>
                    <p>__I understand that this activity may result in severe injury, including but not limited to spinal or head injury.</p>
                    <p>__I understand that this activity may result in hazards posed by other Car and traffic or road conditions.</p>
                    <p style={{ fontWeight: 'bold', marginTop: '15px' }}>__if you want to extend car & Bike inform 1 day before*</p>
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                        onClick={handleAccept}
                        disabled={signing || timeLeft === 0}
                    >
                        {signing ? 'Processing Signature...' : 'I ACCEPT & SIGN DIGITALLY'}
                    </button>
                    <p className="text-muted text-xs" style={{ marginTop: '1.25rem' }}>
                        By clicking "I ACCEPT", you are providing a legally binding digital signature. 
                        Valid for {formatTime(timeLeft)} remaining.
                    </p>
                </div>
            </div>
        </div>
    );
}

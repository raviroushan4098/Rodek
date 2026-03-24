import { useState, useEffect } from 'react';
import { HiOutlineArrowDownTray, HiOutlineXMark, HiOutlineDevicePhoneMobile, HiOutlineComputerDesktop, HiOutlineShare } from 'react-icons/hi2';

// Detect platform
function getPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return { isIOS, isAndroid, isStandalone, isMobile: isIOS || isAndroid };
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [platform, setPlatform] = useState({ isIOS: false, isAndroid: false, isStandalone: false, isMobile: false });

    useEffect(() => {
        const p = getPlatform();
        setPlatform(p);

        // Already installed as standalone — don't show
        if (p.isStandalone) return;

        // Already dismissed this session
        if (sessionStorage.getItem('pwa-install-dismissed')) return;

        // For iOS: show banner immediately (no beforeinstallprompt support)
        if (p.isIOS) {
            // Small delay so the page loads first
            const timer = setTimeout(() => setShowBanner(true), 2000);
            return () => clearTimeout(timer);
        }

        // For Android / Desktop Chrome: listen for beforeinstallprompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setShowGuide(false);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        // Native prompt (Android / Desktop Chrome / Edge)
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
            return;
        }
        // iOS or browsers without beforeinstallprompt — show manual guide
        setShowGuide(true);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setShowGuide(false);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Banner */}
            <div className="install-prompt">
                <div className="install-prompt-content">
                    <HiOutlineArrowDownTray className="install-prompt-icon" />
                    <div className="install-prompt-text">
                        <strong>Install MetricStack</strong>
                        <span>
                            {platform.isIOS
                                ? 'Add to your Home Screen from Safari'
                                : platform.isAndroid
                                    ? 'Install the app on your phone'
                                    : 'Install the app for quick access'}
                        </span>
                    </div>
                    <button className="install-prompt-btn" onClick={handleInstall}>
                        {platform.isIOS ? 'How to Install' : 'Install'}
                    </button>
                    <button className="install-prompt-close" onClick={handleDismiss}>
                        <HiOutlineXMark />
                    </button>
                </div>
            </div>

            {/* Step-by-step Guide Modal */}
            {showGuide && (
                <div className="install-guide-overlay" onClick={() => setShowGuide(false)}>
                    <div className="install-guide-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="install-guide-header">
                            <h3>Install MetricStack</h3>
                            <button className="install-prompt-close" onClick={() => setShowGuide(false)}>
                                <HiOutlineXMark />
                            </button>
                        </div>

                        {platform.isIOS ? (
                            <div className="install-guide-body">
                                <p className="install-guide-subtitle">Follow these steps in <strong>Safari</strong>:</p>
                                <div className="install-steps">
                                    <div className="install-step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Tap the Share button</strong>
                                            <span>Tap <HiOutlineShare style={{ verticalAlign: 'middle', fontSize: '1.1em' }} /> at the bottom of Safari</span>
                                        </div>
                                    </div>
                                    <div className="install-step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Scroll down & tap "Add to Home Screen"</strong>
                                            <span>Look for the <strong>➕ Add to Home Screen</strong> option</span>
                                        </div>
                                    </div>
                                    <div className="install-step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Tap "Add"</strong>
                                            <span>Confirm by tapping <strong>Add</strong> in the top right corner</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="install-guide-note">
                                    <HiOutlineDevicePhoneMobile />
                                    <span>MetricStack will appear on your Home Screen like a native app!</span>
                                </div>
                            </div>
                        ) : platform.isAndroid ? (
                            <div className="install-guide-body">
                                <p className="install-guide-subtitle">Follow these steps in <strong>Chrome</strong>:</p>
                                <div className="install-steps">
                                    <div className="install-step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Tap the menu (⋮)</strong>
                                            <span>Tap the three dots in the top-right corner of Chrome</span>
                                        </div>
                                    </div>
                                    <div className="install-step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Tap "Install App" or "Add to Home Screen"</strong>
                                            <span>Select the install option from the menu</span>
                                        </div>
                                    </div>
                                    <div className="install-step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Tap "Install"</strong>
                                            <span>Confirm the installation in the popup</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="install-guide-note">
                                    <HiOutlineDevicePhoneMobile />
                                    <span>MetricStack will install and appear in your app drawer!</span>
                                </div>
                            </div>
                        ) : (
                            <div className="install-guide-body">
                                <p className="install-guide-subtitle">Install on your <strong>desktop</strong>:</p>
                                <div className="install-steps">
                                    <div className="install-step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Look for the install icon</strong>
                                            <span>Click the ⊕ icon in your browser's address bar</span>
                                        </div>
                                    </div>
                                    <div className="install-step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Click "Install"</strong>
                                            <span>Confirm in the popup dialog</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="install-guide-note">
                                    <HiOutlineComputerDesktop />
                                    <span>MetricStack will open in its own window like a desktop app!</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

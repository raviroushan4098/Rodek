import { useState, useEffect } from 'react';
import { apiFetch } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState('string');

    useEffect(() => {
        apiFetch('/api/settings').then(s => setSettings(s || [])).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleUpdate = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await apiFetch('/api/settings', {
                method: 'POST',
                body: JSON.stringify({ settings: settings.map(s => ({ key: s.key, value: s.value, type: s.type, description: s.description })) }),
            });
            setSettings(result || []);
            toast.success('Settings saved!');
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const handleAdd = async () => {
        if (!newKey) return;
        const updated = [...settings, { key: newKey, value: newValue, type: newType, description: '' }];
        setSettings(updated);
        setNewKey('');
        setNewValue('');
    };

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    return (
        <div>
            <div className="page-title-row">
                <h2 className="page-title">Settings</h2>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            <div className="glass-panel">
                <div className="settings-list">
                    {settings.map(s => (
                        <div key={s.key} className="setting-item">
                            <div className="setting-key">
                                <span className="font-medium">{s.key}</span>
                                <span className="text-muted text-sm">{s.type}</span>
                            </div>
                            <input
                                className="setting-input"
                                value={s.value}
                                onChange={e => handleUpdate(s.key, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <div className="setting-add">
                    <h4>Add New Setting</h4>
                    <div className="form-grid form-grid-3">
                        <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Key" />
                        <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value" />
                        <select value={newType} onChange={e => setNewType(e.target.value)}>
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary mt-3" onClick={handleAdd}>Add Setting</button>
                </div>
            </div>
        </div>
    );
}

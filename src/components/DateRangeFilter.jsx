import { useState, useEffect } from 'react';
import { HiOutlineCalendarDays } from 'react-icons/hi2';

export default function DateRangeFilter({ onFilterChange }) {
    // Default to the current month
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    });

    // Notify parent immediately on mount (so default "this month" applies)
    useEffect(() => {
        onFilterChange(dateRange);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newRange = { ...dateRange, [name]: value };
        setDateRange(newRange);
        onFilterChange(newRange);
    };

    return (
        <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <HiOutlineCalendarDays size={20} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleChange}
                    className="form-control"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', height: 'auto', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>to</span>
                <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleChange}
                    className="form-control"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', height: 'auto', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
            </div>
        </div>
    );
}

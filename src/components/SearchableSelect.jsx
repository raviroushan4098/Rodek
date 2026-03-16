import { useState, useEffect, useRef } from 'react';
import { HiOutlineChevronDown, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function SearchableSelect({ options, value, onChange, placeholder, labelKey = 'name', secondaryKey = 'aadharNumber', phoneKey = 'phone' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.id === value);

    // Filter options based on search
    const filteredOptions = options.filter(opt => {
        const query = search.toLowerCase();
        return (
            opt[labelKey]?.toLowerCase().includes(query) ||
            opt[secondaryKey]?.toLowerCase().includes(query) ||
            opt[phoneKey]?.toLowerCase().includes(query)
        );
    });

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="searchable-select" ref={containerRef}>
            <div className={`search-input-wrap ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <input
                    type="text"
                    readOnly={!isOpen}
                    placeholder={selectedOption ? `${selectedOption[labelKey]} (Aadhar: ${selectedOption[secondaryKey] || 'N/A'})` : placeholder}
                    value={isOpen ? search : ''}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ cursor: isOpen ? 'text' : 'pointer' }}
                />
                <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {search && (
                        <button 
                            type="button" 
                            className="search-clear-btn" 
                            onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                        >
                            <HiOutlineXMark />
                        </button>
                    )}
                    <HiOutlineChevronDown style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div className="search-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <div
                                key={opt.id}
                                className={`search-option ${value === opt.id ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt)}
                            >
                                <div className="option-primary">{opt[labelKey]}</div>
                                <div className="option-secondary">
                                    Aadhar: {opt[secondaryKey] || 'N/A'} • {opt[phoneKey]}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="search-no-results">
                            <HiOutlineMagnifyingGlass style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.3 }} />
                            <p>No customers found matching "{search}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

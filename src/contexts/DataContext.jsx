import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext(null);

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
}

export function DataProvider({ children }) {
    const [cache, setCache] = useState({});

    // Update cache for a specific key
    const updateCache = useCallback((key, data) => {
        setCache(prev => ({
            ...prev,
            [key]: data
        }));
    }, []);

    // Clear specific or all cache (useful for logout)
    const clearCache = useCallback((key = null) => {
        if (key) {
            setCache(prev => {
                const newCache = { ...prev };
                delete newCache[key];
                return newCache;
            });
        } else {
            setCache({});
        }
    }, []);

    return (
        <DataContext.Provider value={{ cache, updateCache, clearCache }}>
            {children}
        </DataContext.Provider>
    );
}

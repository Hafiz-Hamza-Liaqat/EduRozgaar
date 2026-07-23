import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { monetizationApi } from '../services/listingsService';

const AdSlotsContext = createContext({ slots: [], loading: true });

export function AdSlotsProvider({ children }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    monetizationApi.adSlots()
      .then((res) => {
        if (!cancelled) setSlots(res.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ slots, loading }), [slots, loading]);

  return (
    <AdSlotsContext.Provider value={value}>
      {children}
    </AdSlotsContext.Provider>
  );
}

export function useAdSlots() {
  return useContext(AdSlotsContext);
}

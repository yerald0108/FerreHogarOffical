import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteLoadingIndicator() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '100%' }} />
    </div>
  );
}

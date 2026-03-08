import { useEffect, useCallback } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'favorites_seen_count';

function getSeenCount(userId: string): number {
  try {
    const val = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function setSeenCount(userId: string, count: number) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, String(count));
  } catch {}
}

export function useNewFavoritesBadge() {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const currentCount = favorites.length;
  const seenCount = user ? getSeenCount(user.id) : 0;
  const newCount = Math.max(0, currentCount - seenCount);

  const markAsSeen = useCallback(() => {
    if (user && currentCount > 0) {
      setSeenCount(user.id, currentCount);
    }
  }, [user, currentCount]);

  // If favorites decrease (removal), adjust seen count down
  useEffect(() => {
    if (user && currentCount < seenCount) {
      setSeenCount(user.id, currentCount);
    }
  }, [user, currentCount, seenCount]);

  return { newCount, markAsSeen };
}

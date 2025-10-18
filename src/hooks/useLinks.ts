import { useState, useEffect, useCallback } from 'react';
// FIX: Replaced path alias with a relative path to fix module resolution errors.
import type { Link, NotificationType } from '../types';

type SetNotification = (notification: { message: string; type: NotificationType } | null) => void;

export function useLinks(setNotification: SetNotification) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/links');
      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }
      const data: Link[] = await response.json();
      setLinks(data.sort((a, b) => b.createdAt - a.createdAt)); // Sort by newest first
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setNotification({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createLink = async (destinationUrl: string): Promise<Link | null> => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create link');
      }
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
      return null;
    }
  };

  const updateLink = async ({ id, destinationUrl }: { id: string; destinationUrl: string }): Promise<Link | null> => {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update link');
      }
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
      return null;
    }
  };

  const deleteLink = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete link');
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
      return false;
    }
  };

  return {
    links,
    isLoading,
    error,
    createLink,
    updateLink,
    deleteLink,
    refreshLinks: fetchLinks,
  };
}

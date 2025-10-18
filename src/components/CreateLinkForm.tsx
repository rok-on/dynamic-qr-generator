import React, { useState } from 'react';
// FIX: Replaced path aliases with relative paths to fix module resolution errors.
import { useLinks } from '../hooks/useLinks';
import type { Link, NotificationType } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Spinner from './ui/Spinner';

interface CreateLinkFormProps {
  onCreate: (newLink: Link) => void;
  setNotification: (notification: { message: string; type: NotificationType } | null) => void;
}

export default function CreateLinkForm({ onCreate, setNotification }: CreateLinkFormProps) {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createLink } = useLinks(setNotification);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!destinationUrl.trim()) {
      setNotification({ message: 'Please enter a destination URL.', type: 'error' });
      return;
    }
    
    try {
        new URL(destinationUrl);
    } catch (_) {
        setNotification({ message: 'Please enter a valid URL (e.g., https://example.com)', type: 'error' });
        return;
    }

    setIsLoading(true);
    const newLink = await createLink(destinationUrl);
    setIsLoading(false);

    if (newLink) {
      onCreate(newLink);
      setDestinationUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-900/50 rounded-lg border border-gray-700 shadow-lg">
      <label htmlFor="destinationUrl" className="block text-lg font-medium text-gray-300 mb-2">
        New Destination URL
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          id="destinationUrl"
          type="url"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://your-long-url.com/goes-here"
          className="flex-grow"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="flex-shrink-0">
          {isLoading ? (
            <>
              <Spinner className="w-5 h-5 mr-2" />
              Generating...
            </>
          ) : (
            'Generate Dynamic QR'
          )}
        </Button>
      </div>
       <p className="text-sm text-gray-500 mt-3">Enter the final URL where you want your QR code to redirect.</p>
    </form>
  );
}

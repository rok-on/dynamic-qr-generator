
import React, { useState, useEffect } from 'react';
import { useLinks } from '@/hooks/useLinks';
import type { Link, NotificationType } from '@/types';
import CreateLinkForm from '@/components/CreateLinkForm';
import LinkCard from '@/components/LinkCard';
import Notification from '@/components/Notification';
import { QrCode, Link as LinkIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

export default function App() {
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const { links, isLoading, error, refreshLinks } = useLinks(setNotification);

  useEffect(() => {
    if (error) {
      setNotification({ message: error, type: 'error' });
    }
  }, [error]);
  
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLinkCreated = (newLink: Link) => {
    refreshLinks();
    showNotification('QR Code created successfully!', 'success');
  };

  const handleLinkUpdated = () => {
    refreshLinks();
    showNotification('Link updated successfully!', 'success');
  };

  const handleLinkDeleted = () => {
    refreshLinks();
    showNotification('Link deleted successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
                <QrCode className="w-12 h-12 text-cyan-400"/>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 text-transparent bg-clip-text">
                    Dynamic QR Code Generator
                </h1>
            </div>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Create QR codes that you can update anytime, anywhere. Print once, redirect forever.
            </p>
        </header>

        <section className="max-w-2xl mx-auto mb-16">
          <CreateLinkForm onCreate={handleLinkCreated} setNotification={setNotification} />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <LinkIcon className="w-6 h-6 text-gray-500" />
            <h2 className="text-3xl font-bold text-gray-200">Your Dynamic Links</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner />
              <p className="ml-4 text-lg text-gray-400">Loading your links...</p>
            </div>
          ) : links.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {links.map((link: Link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onUpdate={handleLinkUpdated}
                  onDelete={handleLinkDeleted}
                  setNotification={setNotification}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900 rounded-lg border border-dashed border-gray-700">
              <p className="text-gray-400 text-lg">You haven't created any dynamic QR codes yet.</p>
              <p className="text-gray-500 mt-2">Use the form above to get started!</p>
            </div>
          )}
        </section>
      </main>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

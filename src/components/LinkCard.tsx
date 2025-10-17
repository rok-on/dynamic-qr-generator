
import React, { useState, useRef } from 'react';
// FIX: The 'qrcode.react' library exports QRCodeCanvas and QRCodeSVG, not QRCode. Using QRCodeCanvas as QRCode because the download functionality expects a canvas element.
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import type { Link, NotificationType } from '../types';
import { useLinks } from '../hooks/useLinks';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { Check, Clipboard, Download, Edit, Trash2, X, ExternalLink } from 'lucide-react';

interface LinkCardProps {
  link: Link;
  onUpdate: () => void;
  onDelete: () => void;
  setNotification: (notification: { message: string; type: NotificationType } | null) => void;
}

export default function LinkCard({ link, onUpdate, onDelete, setNotification }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDestinationUrl, setNewDestinationUrl] = useState(link.destinationUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { updateLink, deleteLink } = useLinks(setNotification);

  const handleUpdate = async () => {
    if (newDestinationUrl === link.destinationUrl) {
      setIsEditing(false);
      return;
    }

    try {
        new URL(newDestinationUrl);
    } catch (_) {
        setNotification({ message: 'Please enter a valid URL.', type: 'error' });
        return;
    }

    setIsUpdating(true);
    const updated = await updateLink({ id: link.id, destinationUrl: newDestinationUrl });
    setIsUpdating(false);

    if (updated) {
      onUpdate();
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      setIsDeleting(true);
      const success = await deleteLink(link.id);
      setIsDeleting(false);
      if (success) {
        onDelete();
      }
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${link.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-center items-center p-4 bg-white rounded-lg mb-4" ref={qrCodeRef}>
          <QRCode value={link.shortUrl} size={160} level="H" />
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-gray-400">Short URL</label>
                <div className="flex items-center gap-2 mt-1">
                    <Input value={link.shortUrl} readOnly className="text-sm" />
                    <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy URL">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-400">Destination URL</label>
                {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                        <Input
                        value={newDestinationUrl}
                        onChange={(e) => setNewDestinationUrl(e.target.value)}
                        className="text-sm"
                        disabled={isUpdating}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between mt-1 text-gray-300 bg-gray-800 px-3 py-2 rounded-md">
                        <p className="text-sm truncate">{link.destinationUrl}</p>
                        <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-cyan-400 hover:text-cyan-300">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">Created: {new Date(link.createdAt).toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 p-3 flex gap-2">
        {isEditing ? (
            <>
                <Button variant="success" onClick={handleUpdate} disabled={isUpdating} className="w-full">
                    {isUpdating ? <Spinner className="w-4 h-4 mr-2"/> : <Check className="w-4 h-4 mr-2"/>} Save
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isUpdating} className="w-full">
                    <X className="w-4 h-4 mr-2"/> Cancel
                </Button>
            </>
        ) : (
            <>
                <Button variant="secondary" onClick={() => setIsEditing(true)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                 <Button variant="danger" size="icon" onClick={handleDelete} disabled={isDeleting} title="Delete Link">
                    {isDeleting ? <Spinner className="w-4 h-4"/> : <Trash2 className="w-4 h-4" />}
                </Button>
            </>
        )}
      </div>
    </Card>
  );
}
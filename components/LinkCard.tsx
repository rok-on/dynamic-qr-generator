import React, { useState, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import type { Link, NotificationType, QROptions } from '../types';
import { useLinks } from '../hooks/useLinks';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { Check, Clipboard, Download, Edit, Trash2, X, ExternalLink, BarChart2, Settings, FileImage, Type as TypeIcon } from 'lucide-react';
import CustomizeQrModal from './CustomizeQrModal';
import Dropdown from './ui/Dropdown';

interface LinkCardProps {
  link: Link;
  onUpdate: () => void;
  onDelete: () => void;
  setNotification: (notification: { message: string; type: NotificationType } | null) => void;
}

const defaultQrOptions: QROptions = {
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'H',
    imageSettings: null,
};

export default function LinkCard({ link, onUpdate, onDelete, setNotification }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [newDestinationUrl, setNewDestinationUrl] = useState(link.destinationUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeSvgRef = useRef<HTMLDivElement>(null);
  const { updateLink, deleteLink } = useLinks(setNotification);

  const handleUpdateUrl = async () => {
    let fullUrl = newDestinationUrl.trim();
    if (!fullUrl) {
      setNotification({ message: 'Destination URL cannot be empty.', type: 'error' });
      return;
    }

    // Handle protocol-relative URLs and URLs without a scheme.
    if (fullUrl.startsWith('//')) {
        fullUrl = `https:${fullUrl}`;
    } else if (!/^[a-z][a-z0-9+.-]*:/.test(fullUrl)) {
        fullUrl = `https://${fullUrl}`;
    }

    if (fullUrl === link.destinationUrl) {
      setIsEditing(false);
      return;
    }

    try {
      new URL(fullUrl);
    } catch (_) {
      setNotification({ message: 'Please enter a valid URL.', type: 'error' });
      return;
    }

    setIsUpdating(true);
    const updated = await updateLink(link.id, { destinationUrl: fullUrl });
    setIsUpdating(false);

    if (updated) {
      onUpdate();
      setIsEditing(false);
    }
  };
  
  const handleSaveCustomization = async (newOptions: QROptions) => {
    setIsUpdating(true);
    const updated = await updateLink(link.id, { qrOptions: newOptions });
    setIsUpdating(false);
    if (updated) {
        setNotification({ message: 'QR Code updated successfully!', type: 'success'});
        onUpdate();
        setIsCustomizing(false);
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

  const handleDownloadPng = () => {
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

  const handleDownloadSvg = () => {
    const svgEl = qrCodeSvgRef.current?.querySelector('svg');
    if (svgEl) {
        if (!svgEl.getAttribute('xmlns')) {
            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode-${link.id}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };
  
  const currentQrOptions = { ...defaultQrOptions, ...link.qrOptions };
  const qrProps = {
    value: link.shortUrl,
    size: 160,
    level: currentQrOptions.level,
    fgColor: currentQrOptions.fgColor,
    bgColor: currentQrOptions.bgColor,
    imageSettings: currentQrOptions.imageSettings || undefined,
  };

  const downloadOptions = [
    { label: 'Download PNG', onClick: handleDownloadPng, icon: <FileImage className="w-4 h-4" /> },
    { label: 'Download SVG', onClick: handleDownloadSvg, icon: <TypeIcon className="w-4 h-4" /> }
  ];

  return (
    <>
    <Card>
      <div className="p-6">
        <div className="flex justify-center items-center p-4 rounded-lg mb-4" style={{ backgroundColor: currentQrOptions.bgColor }}>
          <div ref={qrCodeRef}>
             <QRCodeCanvas {...qrProps} />
          </div>
          <div ref={qrCodeSvgRef} style={{ display: 'none' }}>
            <QRCodeSVG {...qrProps} />
          </div>
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
                    <div className="flex flex-col gap-2 mt-1">
                        <Input
                          value={newDestinationUrl}
                          onChange={(e) => setNewDestinationUrl(e.target.value)}
                          className="text-sm"
                          disabled={isUpdating}
                        />
                         <div className="flex gap-2">
                             <Button variant="success" size="normal" onClick={handleUpdateUrl} disabled={isUpdating} className="w-full text-xs">
                                {isUpdating ? <Spinner className="w-4 h-4 mr-2"/> : <Check className="w-4 h-4 mr-2"/>} Save
                            </Button>
                            <Button variant="secondary" size="normal" onClick={() => setIsEditing(false)} disabled={isUpdating} className="w-full text-xs">
                                <X className="w-4 h-4 mr-2"/> Cancel
                            </Button>
                         </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mt-1 text-gray-300 bg-gray-800 px-3 py-2 rounded-md">
                        <p className="text-sm truncate">{link.destinationUrl}</p>
                        <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-cyan-400 hover:text-cyan-300 flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-700/50">
                <p>Created: {new Date(link.createdAt).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 font-medium text-gray-400">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <span>{link.scanCount ?? 0} scans</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 p-3 flex gap-2">
            <>
                <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} className="flex-1" disabled={isEditing}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                 <Button variant="secondary" onClick={() => setIsCustomizing(true)} className="flex-1">
                    <Settings className="w-4 h-4 mr-2" /> Customize
                </Button>
                <Dropdown
                    trigger={
                        <Button variant="ghost" title="Download QR Code">
                            <Download className="w-4 h-4" />
                        </Button>
                    }
                    options={downloadOptions}
                />
                 <Button variant="danger" size="icon" onClick={handleDelete} disabled={isDeleting} title="Delete Link">
                    {isDeleting ? <Spinner className="w-4 h-4"/> : <Trash2 className="w-4 h-4" />}
                </Button>
            </>
      </div>
    </Card>
    {isCustomizing && (
        <CustomizeQrModal
            isOpen={isCustomizing}
            onClose={() => setIsCustomizing(false)}
            link={link}
            onSave={handleSaveCustomization}
            isSaving={isUpdating}
        />
    )}
    </>
  );
}
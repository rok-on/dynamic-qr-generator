import React, { useState, useMemo, useRef } from 'react';
import type { Link, QROptions } from '../types';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { X, Image as ImageIcon, Trash2, Download, FileImage, Type as TypeIcon } from 'lucide-react';
import Dropdown from './ui/Dropdown';

interface CustomizeQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link;
  onSave: (newOptions: QROptions) => Promise<void>;
  isSaving: boolean;
}

const defaultQrOptions: QROptions = {
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'H',
    imageSettings: null,
};

const IMAGE_MAX_DIMENSION = 60; // Max width/height for the logo

export default function CustomizeQrModal({ isOpen, onClose, link, onSave, isSaving }: CustomizeQrModalProps) {
  const [options, setOptions] = useState<QROptions>({
    ...defaultQrOptions,
    ...link.qrOptions,
  });
  const qrPreviewRef = useRef<HTMLDivElement>(null);
  const qrPreviewSvgRef = useRef<HTMLDivElement>(null);

  const qrProps = useMemo(() => ({
    value: link.shortUrl,
    size: 220,
    level: options.level,
    fgColor: options.fgColor,
    bgColor: options.bgColor,
    imageSettings: options.imageSettings || undefined,
  }), [link.shortUrl, options]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height) {
            if (width > IMAGE_MAX_DIMENSION) {
              height *= IMAGE_MAX_DIMENSION / width;
              width = IMAGE_MAX_DIMENSION;
            }
          } else {
            if (height > IMAGE_MAX_DIMENSION) {
              width *= IMAGE_MAX_DIMENSION / height;
              height = IMAGE_MAX_DIMENSION;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type);
          
          setOptions(prev => ({ ...prev, imageSettings: { src: dataUrl, height, width, excavate: true }, level: 'H' }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
     e.target.value = ''; // Reset file input
  };

  const removeImage = () => {
    setOptions(prev => ({ ...prev, imageSettings: null }));
  }

  const handleSave = () => {
    onSave(options);
  }

  const handleDownloadPng = () => {
    const canvas = qrPreviewRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${link.id}-custom.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  const handleDownloadSvg = () => {
    const svgEl = qrPreviewSvgRef.current?.querySelector('svg');
    if (svgEl) {
        if (!svgEl.getAttribute('xmlns')) {
            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode-${link.id}-custom.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };
  
  const downloadOptions = [
    { label: 'Download PNG', onClick: handleDownloadPng, icon: <FileImage className="w-4 h-4" /> },
    { label: 'Download SVG', onClick: handleDownloadSvg, icon: <TypeIcon className="w-4 h-4" /> }
  ];


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-3xl flex flex-col md:flex-row gap-8 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold text-white">Customize QR Code</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Dots Color</label>
                    <input type="color" value={options.fgColor} onChange={e => setOptions(p => ({ ...p, fgColor: e.target.value }))} className="w-full h-10 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Background Color</label>
                    <input type="color" value={options.bgColor} onChange={e => setOptions(p => ({ ...p, bgColor: e.target.value }))} className="w-full h-10 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Error Correction</label>
                <select value={options.level} onChange={e => setOptions(p => ({ ...p, level: e.target.value as QROptions['level'] }))} className="w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-200">
                    <option value="L">Low (7% recovery)</option>
                    <option value="M">Medium (15% recovery)</option>
                    <option value="Q">Quartile (25% recovery)</option>
                    <option value="H">High (30% recovery)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">High level is recommended when adding a logo.</p>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-gray-400 mb-1">Center Logo</label>
                 <div className="flex gap-2">
                    <label htmlFor="logo-upload" className="flex-grow">
                        <Button as="span" variant="secondary" className="w-full cursor-pointer">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {options.imageSettings ? 'Change Logo' : 'Upload Image'}
                        </Button>
                        <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleFileChange} />
                    </label>
                    {options.imageSettings && (
                        <Button size="icon" variant="danger" onClick={removeImage} title="Remove Logo">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                 </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : null}
                    Save Changes
                </Button>
                <Button variant="secondary" onClick={onClose} disabled={isSaving} className="w-full">Cancel</Button>
            </div>
        </div>
        
        <div className="flex-shrink-0 bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center">
            <div className="flex justify-between items-center w-full mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Live Preview</h3>
               <Dropdown
                    trigger={
                        <Button variant="ghost" size="icon" title="Download Preview">
                            <Download className="w-5 h-5" />
                        </Button>
                    }
                    options={downloadOptions}
                />
            </div>
            <div ref={qrPreviewRef} className="p-4 rounded-md" style={{ backgroundColor: options.bgColor }}>
              <QRCodeCanvas {...qrProps} />
               <div ref={qrPreviewSvgRef} style={{ display: 'none' }}>
                <QRCodeSVG {...qrProps} />
              </div>
            </div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
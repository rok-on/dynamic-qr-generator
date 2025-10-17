export interface QRImageSettings {
  src: string; // base64 data URL
  height: number;
  width: number;
  excavate: boolean;
}

export interface QROptions {
  fgColor: string;
  bgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
  imageSettings?: QRImageSettings | null;
}

export interface Link {
  id: string;
  destinationUrl: string;
  shortUrl: string;
  createdAt: number;
  scanCount: number;
  updatedAt: number;
  qrOptions?: QROptions;
}

export type NotificationType = 'success' | 'error';
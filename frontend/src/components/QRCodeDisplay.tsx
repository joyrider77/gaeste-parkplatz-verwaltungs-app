import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  url: string;
  parkplatzId: bigint;
}

export default function QRCodeDisplay({ url, parkplatzId }: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Verify the URL uses the correct domain
    if (!url.startsWith('https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=')) {
      console.warn('QR Code URL does not use the expected domain:', url);
    }

    // Create a QR code using an external service
    // Using QR Server API which is free and doesn't require authentication
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    const img = document.createElement('img');
    img.src = qrCodeUrl;
    img.alt = 'QR Code';
    img.className = 'w-full h-full';
    img.onerror = () => {
      // Fallback: show URL as text if QR code generation fails
      containerRef.current!.innerHTML = `
        <div class="flex items-center justify-center h-full text-center p-4">
          <div>
            <p class="text-sm text-muted-foreground mb-2">QR-Code konnte nicht geladen werden</p>
            <p class="text-xs break-all">${url}</p>
          </div>
        </div>
      `;
    };
    
    containerRef.current.appendChild(img);
  }, [url]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link in Zwischenablage kopiert!');
  };

  const handleOpenLink = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-card">
      <div className="text-sm font-medium text-muted-foreground">
        QR-Code für Parkplatz #{parkplatzId.toString()}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 bg-white rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer group w-[200px] h-[200px]"
      >
        <div 
          ref={containerRef} 
          className="w-full h-full group-hover:scale-105 transition-transform"
        />
      </a>
      <div className="text-xs text-center text-muted-foreground break-all max-w-[250px] px-2">
        {url}
      </div>
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleCopyLink}
        >
          <Copy className="h-4 w-4" />
          Link kopieren
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleOpenLink}
        >
          <ExternalLink className="h-4 w-4" />
          Link öffnen
        </Button>
      </div>
    </div>
  );
}

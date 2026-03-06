import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  address: string;
}

export function QRCode({ address }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && address && containerRef.current) {
      // Determine if we're in mobile or desktop based on container width
      const isMobile = containerRef.current.clientWidth <= 120;
      const qrSize = isMobile ? 100 : 130; // Adjusted size based on container

      // Generate QR code with the Bitcoin address
      QRCodeLib.toCanvas(
        canvasRef.current,
        address,
        {
          width: qrSize,
          margin: 0,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error('Error generating QR code:', error);
          console.log('QR Code generated successfully with address:', address);
        }
      );
    }
  }, [address]);

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <span className="text-white text-[10px] md:text-xs font-bold">
        Send your LTC here:
      </span>
      <div
        ref={containerRef}
        className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] bg-white p-[10px] rounded-xl flex items-center justify-center"
      >
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

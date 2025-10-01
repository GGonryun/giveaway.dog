import { toast } from 'sonner';

export const downloadQRCode = (svgElement: SVGSVGElement, size: number) => {
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = size;
  canvas.height = size;

  img.onload = () => {
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
};

export const shareQRCode = async (svgElement: SVGSVGElement, size: number) => {
  if (!svgElement) return;

  const svg = svgElement;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = size;
  canvas.height = size;

  img.onload = async () => {
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        }
      });
    }
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
};

export const openQRCodeInNewTab = (svgElement: SVGSVGElement, size: number) => {
  if (!svgElement) return;

  try {
    const svg = svgElement;
    const svgData = new XMLSerializer().serializeToString(svg);

    // Open the tab immediately to avoid popup blockers
    const newTab = window.open('', '_blank');
    if (!newTab) {
      toast.error('Please allow popups for this site');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (ctx) {
        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        // Draw the QR code
        ctx.drawImage(img, 0, 0);

        // Convert to PNG data URL and update the tab
        const dataUrl = canvas.toDataURL('image/png');

        // Write HTML to display the image
        newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>QR Code</title>
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  img {
                    max-width: 100%;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  }
                  h1 {
                    color: #333;
                    margin-bottom: 20px;
                  }
                </style>
              </head>
              <body>
                <h1>QR Code</h1>
                <img src="${dataUrl}" alt="QR Code" />
              </body>
            </html>
          `);
        newTab.document.close();
      }
    };

    img.onerror = () => {
      newTab.close();
      toast.error('Failed to open QR code in new tab');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  } catch (err) {
    console.error('Failed to open QR code in new tab:', err);
    toast.error('Failed to open QR code in new tab');
  }
};

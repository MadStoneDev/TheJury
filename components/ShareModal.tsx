"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import {
  IconCopy,
  IconCheck,
  IconBrandX,
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconMail,
  IconDownload,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollCode: string;
  pollUrl: string;
}

export default function ShareModal({
  open,
  onOpenChange,
  pollCode,
  pollUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [pollUrl]);

  const handleDownloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `poll-qr-${pollCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded!");
    };

    img.src = url;
  }, [pollCode]);

  const shareText = `Vote on this poll: ${pollUrl}`;

  const socialLinks = [
    {
      name: "X / Twitter",
      icon: IconBrandX,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      icon: IconBrandWhatsapp,
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Facebook",
      icon: IconBrandFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`,
    },
    {
      name: "Email",
      icon: IconMail,
      url: `mailto:?subject=${encodeURIComponent("Vote on this poll")}&body=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Direct Link */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Direct Link
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pollUrl}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm rounded-md transition-colors"
              >
                {copied ? (
                  <IconCheck size={16} />
                ) : (
                  <IconCopy size={16} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">QR Code</h4>
            <div className="flex items-center gap-4">
              <div
                ref={qrRef}
                className="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <QRCodeSVG value={pollUrl} size={128} />
              </div>
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm rounded-md transition-colors"
              >
                <IconDownload size={16} />
                Download QR
              </button>
            </div>
          </div>

          {/* Social Sharing */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Share on Social
            </h4>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm rounded-md transition-colors"
                  title={social.name}
                >
                  <social.icon size={18} />
                  <span className="hidden sm:inline">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

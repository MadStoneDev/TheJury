"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { Button } from "@/components/ui/button";

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
      name: "X",
      icon: IconBrandX,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      color: "hover:bg-foreground/10 hover:text-foreground",
    },
    {
      name: "WhatsApp",
      icon: IconBrandWhatsapp,
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: "hover:bg-green-500/10 hover:text-green-500",
    },
    {
      name: "Facebook",
      icon: IconBrandFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`,
      color: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    {
      name: "Email",
      icon: IconMail,
      url: `mailto:?subject=${encodeURIComponent("Vote on this poll")}&body=${encodeURIComponent(shareText)}`,
      color: "hover:bg-amber-500/10 hover:text-amber-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Direct Link */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Direct Link
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-muted truncate font-mono text-foreground">
                {pollUrl}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="brand"
                size="sm"
                className="gap-1.5 shrink-0"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <IconCheck size={14} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <IconCopy size={14} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              QR Code
            </h4>
            <div className="flex items-center gap-4">
              <div
                ref={qrRef}
                className="p-3 bg-white border-2 border-emerald-500/20 rounded-xl"
              >
                <QRCodeSVG value={pollUrl} size={128} />
              </div>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <IconDownload size={14} />
                Download QR
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Share on Social
            </h4>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-11 h-11 flex items-center justify-center rounded-full border border-border text-muted-foreground transition-colors ${social.color}`}
                  title={social.name}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// components/EmbedCodeGenerator.tsx
"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EmbedCodeGeneratorProps {
  pollCode: string;
}

export default function EmbedCodeGenerator({
  pollCode,
}: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("400");

  const baseUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "https://thejury.app"
  }/embed/${pollCode}`;
  const embedUrl = `${baseUrl}?origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

  const embedCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  sandbox="allow-scripts allow-same-origin allow-forms"
></iframe>

<script>
  // Auto-resize iframe when poll content changes
  window.addEventListener('message', function(event) {
    if (event.data.type === 'resize') {
      const iframe = document.querySelector('iframe[src*="${pollCode}"]');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Embed code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy embed code");
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Embed This Poll
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Width
          </label>
          <Input
            type="text"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="100%"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Initial Height
          </label>
          <Input
            type="text"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="400"
          />
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Embed Code
        </label>
        <pre className="bg-slate-950 text-emerald-400 border border-border rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">
          {embedCode}
        </pre>
        <Button
          onClick={copyToClipboard}
          variant="brand"
          size="sm"
          className="absolute top-7 right-2 gap-1"
        >
          {copied ? (
            <>
              <IconCheck size={12} />
              Copied!
            </>
          ) : (
            <>
              <IconCopy size={12} />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-muted-foreground">
        The iframe will automatically resize to fit the poll content. You can
        customize the width and initial height above.
      </div>
    </div>
  );
}

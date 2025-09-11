// components/EmbedCodeGenerator.tsx - Component to generate embed codes
"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";

interface EmbedCodeGeneratorProps {
  pollCode: string;
}

export default function EmbedCodeGenerator({
  pollCode,
}: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("400");

  const embedUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "https://thejury.app"
  }/embed/${pollCode}`;

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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Embed This Poll
      </h3>

      <div className="space-y-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="100%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Height
            </label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="400"
            />
          </div>
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embed Code
        </label>
        <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto text-gray-800 font-mono">
          {embedCode}
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-8 right-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-50 transition-colors flex items-center gap-1 text-neutral-600"
        >
          {copied ? (
            <>
              <IconCheck size={12} className="text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <IconCopy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <strong>Note:</strong> The iframe will automatically resize to fit the
        poll content. You can customize the width and initial height above.
      </div>
    </div>
  );
}

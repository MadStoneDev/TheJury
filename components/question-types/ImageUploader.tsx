"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  imageUrl: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({
  imageUrl,
  onChange,
  label,
}: ImageUploaderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <Input
        type="url"
        placeholder="https://example.com/image.jpg"
        value={imageUrl}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
      {imageUrl && (
        <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

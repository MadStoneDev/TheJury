"use client";

import { QRCodeSVG } from "qrcode.react";

interface PresenterQRCodeProps {
  pollCode: string;
  answerUrl: string;
}

export default function PresenterQRCode({ pollCode, answerUrl }: PresenterQRCodeProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-white p-3 rounded-xl">
        <QRCodeSVG value={answerUrl} size={160} />
      </div>
      <div>
        <p className="text-sm text-white/60 mb-1">Scan to vote</p>
        <p className="text-3xl font-mono font-bold text-white tracking-wider">
          {pollCode}
        </p>
        <p className="text-xs text-white/40 mt-1 max-w-[200px] truncate">
          {answerUrl}
        </p>
      </div>
    </div>
  );
}

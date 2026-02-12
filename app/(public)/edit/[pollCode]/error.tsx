"use client";

import Link from "next/link";
import { Container } from "@/components/Container";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-500 text-6xl mb-4">&#x26A0;&#xFE0F;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error.message || "Failed to load the poll editor. Please try again."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center justify-center space-x-2"
            >
              <IconRefresh size={20} />
              <span>Try Again</span>
            </button>
            <Link
              href="/dashboard"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center justify-center space-x-2"
            >
              <IconArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

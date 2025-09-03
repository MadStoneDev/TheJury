"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const HeroButtons = () => {
  const [pollCode, setPollCode] = useState("");
  const router = useRouter();

  const handlePollCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pollCode.trim()) {
      router.push(`/answer/${pollCode.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-8 w-full">
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center">
        <Link
          href={`/create`}
          className="px-8 py-4 text-lg font-medium text-center text-white bg-emerald-800 rounded-md hover:bg-emerald-900 transition-colors"
        >
          Create Your First Poll
        </Link>
      </div>

      <div className="w-full">
        <p className="text-sm text-neutral-500 mb-2">
          Got a poll code? Jump right in:
        </p>
        <form onSubmit={handlePollCodeSubmit} className="flex w-full max-w-sm">
          <input
            type="text"
            value={pollCode}
            onChange={(e) => setPollCode(e.target.value.toUpperCase())}
            placeholder="Enter poll code"
            className="flex-1 min-w-0 px-4 py-2 border border-r-0 border-gray-300 rounded-l-md outline-none focus:ring-2 ring-neutral-400 focus:ring-emerald-600 focus:border-transparent"
            maxLength={10}
          />
          <button
            type="submit"
            disabled={!pollCode.trim() || pollCode.length < 8}
            className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-medium rounded-r-md border border-emerald-800 transition-colors flex-shrink-0"
          >
            Vote
          </button>
        </form>
      </div>
    </div>
  );
};

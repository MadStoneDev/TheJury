"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col items-start space-y-8">
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center">
        <a
          href="/create"
          className="px-8 py-4 text-lg font-medium text-center text-white bg-emerald-800 rounded-md hover:bg-emerald-900 transition-colors"
        >
          Create Your First Poll
        </a>
      </div>

      <div className="w-full max-w-md">
        <p className="text-sm text-neutral-500 mb-2">
          Got a poll code? Jump right in:
        </p>
        <form onSubmit={handlePollCodeSubmit} className="flex">
          <input
            type="text"
            value={pollCode}
            onChange={(e) => setPollCode(e.target.value.toUpperCase())}
            placeholder="Enter poll code"
            className="flex-1 px-4 py-2 rounded-l-md outline-none focus:ring-2 ring-neutral-400 focus:ring-emerald-600 focus:border-transparent"
            maxLength={10}
          />
          <button
            type="submit"
            disabled={!pollCode.trim() || pollCode.length < 8}
            className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-medium rounded-r-md transition-colors"
          >
            Vote
          </button>
        </form>
      </div>
    </div>
  );
};

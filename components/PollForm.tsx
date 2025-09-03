// components/PollForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { IconPlus, IconX, IconCopy, IconCheck } from "@tabler/icons-react";
import { generateUniquePollCode } from "@/utils/pollCodeGenerator";
import {
  createPoll,
  updatePoll,
  getPollByCode,
  getCurrentUser,
} from "@/lib/supabaseHelpers";

interface PollOption {
  id: string;
  text: string;
}

interface PollFormData {
  question: string;
  description: string;
  options: PollOption[];
  allowMultiple: boolean;
  isActive: boolean;
  hasTimeLimit: boolean;
  startDate: string;
  endDate: string;
}

interface PollFormProps {
  pollCode?: string; // Optional pollCode for editing
}

export default function PollForm({ pollCode }: PollFormProps) {
  const router = useRouter();
  const isEditing = !!pollCode;

  const [formData, setFormData] = useState<PollFormData>({
    question: "",
    description: "",
    options: [
      { id: "1", text: "" },
      { id: "2", text: "" },
    ],
    allowMultiple: false,
    isActive: true,
    hasTimeLimit: false,
    startDate: "",
    endDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPollCode, setGeneratedPollCode] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");
  const [pollId, setPollId] = useState<string>("");

  useEffect(() => {
    const loadPoll = async () => {
      if (isEditing && pollCode) {
        setIsLoading(true);
        try {
          const poll = await getPollByCode(pollCode);
          if (!poll) {
            setError("Poll not found");
            return;
          }

          // Check if current user owns this poll
          const user = await getCurrentUser();
          if (!user || poll.user_id !== user.id) {
            setError("You don't have permission to edit this poll");
            return;
          }

          // Convert poll data to form format
          setFormData({
            question: poll.question,
            description: poll.description || "",
            options: poll.options?.map((opt, index) => ({
              id: (index + 1).toString(),
              text: opt.text,
            })) || [
              { id: "1", text: "" },
              { id: "2", text: "" },
            ],
            allowMultiple: poll.allow_multiple,
            isActive: poll.is_active,
            hasTimeLimit: poll.has_time_limit,
            startDate: poll.start_date
              ? new Date(poll.start_date).toISOString().slice(0, 16)
              : "",
            endDate: poll.end_date
              ? new Date(poll.end_date).toISOString().slice(0, 16)
              : "",
          });

          setGeneratedPollCode(poll.code);
          setPollId(poll.id);
        } catch (err) {
          console.error("Error loading poll:", err);
          setError("Failed to load poll");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPoll();
  }, [isEditing, pollCode]);

  const addOption = () => {
    const newId = (formData.options.length + 1).toString();
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: newId, text: "" }],
    }));
  };

  const removeOption = (id: string) => {
    if (formData.options.length <= 2) return; // Minimum 2 options
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option.id !== id),
    }));
  };

  const updateOption = (id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === id ? { ...option, text } : option,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      // Check authentication
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("You must be logged in to create or edit polls");
      }

      // Basic validation
      if (!formData.question.trim()) {
        throw new Error("Please enter a question");
      }

      const validOptions = formData.options.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        throw new Error("Please provide at least 2 options");
      }

      // Validate time limit dates if enabled
      if (formData.hasTimeLimit) {
        if (formData.startDate && formData.endDate) {
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          if (startDate >= endDate) {
            throw new Error("End date must be after start date");
          }
        }
      }

      let pollCode = generatedPollCode;
      let createdPollId: string | null = pollId;

      if (!isEditing) {
        // Generate poll code for new polls
        try {
          pollCode = await generateUniquePollCode();
          setGeneratedPollCode(pollCode);
        } catch (codeError) {
          throw new Error(
            "Unable to generate unique poll code. Please try again.",
          );
        }

        // Create new poll
        const pollData = {
          code: pollCode,
          user_id: user.id,
          question: formData.question.trim(),
          description: formData.description.trim() || null,
          allow_multiple: formData.allowMultiple,
          is_active: formData.isActive,
          has_time_limit: formData.hasTimeLimit,
          start_date:
            formData.hasTimeLimit && formData.startDate
              ? new Date(formData.startDate).toISOString()
              : null,
          end_date:
            formData.hasTimeLimit && formData.endDate
              ? new Date(formData.endDate).toISOString()
              : null,
        };

        createdPollId = await createPoll(pollData, validOptions);

        if (!createdPollId) {
          throw new Error("Failed to create poll");
        }
      } else {
        // Update existing poll
        const pollData = {
          question: formData.question.trim(),
          description: formData.description.trim() || null,
          allow_multiple: formData.allowMultiple,
          is_active: formData.isActive,
          has_time_limit: formData.hasTimeLimit,
          start_date:
            formData.hasTimeLimit && formData.startDate
              ? new Date(formData.startDate).toISOString()
              : null,
          end_date:
            formData.hasTimeLimit && formData.endDate
              ? new Date(formData.endDate).toISOString()
              : null,
        };

        const success = await updatePoll(pollId, pollData, validOptions);

        if (!success) {
          throw new Error("Failed to update poll");
        }
      }

      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const copyPollLink = async () => {
    const link = `${window.location.origin}/answer/${generatedPollCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPollCode = async () => {
    await navigator.clipboard.writeText(generatedPollCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading poll...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-emerald-600 text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {isEditing ? "Poll Updated!" : "Poll Created!"}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Your poll is live and ready to collect votes.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Share your poll:
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded border p-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Poll Code</div>
                      <div className="font-mono font-bold text-lg">
                        {generatedPollCode}
                      </div>
                    </div>
                    <button
                      onClick={copyPollCode}
                      className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded transition-colors"
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded border p-3">
                    <div className="flex-1 truncate">
                      <div className="text-sm text-gray-500">Direct Link</div>
                      <div className="font-mono text-sm text-gray-700 truncate">
                        {`${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                        }/answer/${generatedPollCode}`}
                      </div>
                    </div>
                    <button
                      onClick={copyPollLink}
                      className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded transition-colors"
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  View All Polls
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium transition-colors"
                >
                  {isEditing ? "Edit Another" : "Create Another"}
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditing ? "Edit Poll" : "Create New Poll"}
              </h1>
              <p className="text-gray-600">
                {isEditing
                  ? "Make changes to your poll"
                  : "Build a poll that gets results"}
              </p>
              {isEditing && (
                <div className="mt-2 text-sm text-gray-500">
                  Poll Code:{" "}
                  <span className="font-mono font-semibold">{pollCode}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  placeholder="What's your question?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Add context or instructions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options *
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3"
                    >
                      <span className="text-gray-500 text-sm w-8">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          updateOption(option.id, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(option.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <IconX size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 flex items-center space-x-2 text-emerald-800 hover:text-emerald-900 font-medium"
                >
                  <IconPlus size={16} />
                  <span>Add Another Option</span>
                </button>
              </div>

              {/* Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Poll Settings
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowMultiple}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          allowMultiple: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Allow multiple selections
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Poll is active (people can vote)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasTimeLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hasTimeLimit: e.target.checked,
                          startDate: e.target.checked ? prev.startDate : "",
                          endDate: e.target.checked ? prev.endDate : "",
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Set time limit for voting
                    </span>
                  </label>

                  {formData.hasTimeLimit && (
                    <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Poll will only accept votes between these dates. Leave
                        empty to allow voting indefinitely.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium text-lg transition-colors"
                >
                  {isSaving
                    ? "Saving..."
                    : isEditing
                      ? "Update Poll"
                      : "Create Poll"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}

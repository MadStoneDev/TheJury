// components/PollForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import {
  IconPlus,
  IconX,
  IconCopy,
  IconCheck,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";
import { generateUniquePollCode } from "@/utils/pollCodeGenerator";
import {
  createPoll,
  updatePoll,
  getPollByCode,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

interface PollOption {
  id: string;
  text: string;
  optionOrder?: number;
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

// SortableOption component
interface SortableOptionProps {
  option: PollOption;
  index: number;
  updateOption: (id: string, text: string) => void;
  removeOption: (id: string) => void;
  canRemove: boolean;
}

function SortableOption({
  option,
  index,
  updateOption,
  removeOption,
  canRemove,
}: SortableOptionProps) {
  // States
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center space-x-2 p-2 pl-0 bg-white border rounded-lg transition-all ${
        isDragging ? "shadow-lg border-emerald-300" : "border-neutral-300"
      } overflow-hidden`}
    >
      {/* Confirm delete */}
      <div
        className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center flex-wrap gap-2 bg-white text-neutral-900 ${
          isDeleting
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        } transition-all duration-300 ease-in-out`}
      >
        <p>Delete this option?</p>
        <div className={`flex items-center space-x-2 text-sm`}>
          <button
            type="button"
            onClick={() => removeOption(option.id)}
            className={`p-1 flex items-center space-x-1 rounded-lg border border-red-500 hover:bg-red-500 hover:text-white transition-colors`}
          >
            <IconTrash size={18} />
            <p>
              Yes<span className={`hidden md:inline`}>, delete it</span>
            </p>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleting(false)}
            className={`p-1 flex items-center space-x-1 rounded-lg border border-neutral-400 hover:bg-neutral-400 transition-colors`}
          >
            <IconX size={18} />
            <p>
              No<span className={`hidden md:inline`}>, keep it</span>
            </p>
          </button>
        </div>
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 touch-none"
        aria-label="Drag to reorder"
      >
        <IconGripVertical size={20} />
      </div>

      {/* Option number */}
      <div className="hidden sm:flex flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full items-center justify-center">
        {index + 1}
      </div>

      {/* Option input */}
      <input
        type="text"
        value={option.text}
        onChange={(e) => updateOption(option.id, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1 px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        required
      />

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="flex-shrink-0 text-neutral-400 hover:text-red-600 transition-colors p-1"
          aria-label="Remove option"
        >
          <IconTrash size={18} />
        </button>
      )}
    </div>
  );
}

export default function PollForm({ pollCode }: PollFormProps) {
  const router = useRouter();
  const isEditing = !!pollCode;

  // Configure sensors for both mouse/touch interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay before touch drag starts (helps with scrolling)
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const [formData, setFormData] = useState<PollFormData>({
    question: "",
    description: "",
    options: [
      { id: "1", text: "", optionOrder: 0 },
      { id: "2", text: "", optionOrder: 1 },
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
  const [copiedPoll, setCopiedPoll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

          // Convert poll data to form format, sort by option_order
          const sortedOptions =
            poll.options?.sort(
              (a, b) => (a.option_order || 0) - (b.option_order || 0),
            ) || [];

          setFormData({
            question: poll.question,
            description: poll.description || "",
            options:
              sortedOptions.length > 0
                ? sortedOptions.map((opt, index) => ({
                    id: (index + 1).toString(),
                    text: opt.text,
                    optionOrder: opt.option_order || index,
                  }))
                : [
                    { id: "1", text: "", optionOrder: 0 },
                    { id: "2", text: "", optionOrder: 1 },
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
    const newOrder =
      Math.max(...formData.options.map((opt) => opt.optionOrder || 0)) + 1;
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: newId, text: "", optionOrder: newOrder },
      ],
    }));
  };

  const removeOption = (id: string) => {
    if (formData.options.length <= 2) return; // Minimum 2 options
    setFormData((prev) => {
      const filteredOptions = prev.options.filter((option) => option.id !== id);
      // Reorder remaining options
      const reorderedOptions = filteredOptions.map((option, index) => ({
        ...option,
        optionOrder: index,
      }));
      return {
        ...prev,
        options: reorderedOptions,
      };
    });
  };

  const updateOption = (id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === id ? { ...option, text } : option,
      ),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormData((prev) => {
        const oldIndex = prev.options.findIndex(
          (item) => item.id === active.id,
        );
        const newIndex = prev.options.findIndex((item) => item.id === over!.id);

        const newOptions = [...prev.options];
        const [reorderedItem] = newOptions.splice(oldIndex, 1);
        newOptions.splice(newIndex, 0, reorderedItem);

        // Update option orders
        const updatedOptions = newOptions.map((option, index) => ({
          ...option,
          optionOrder: index,
        }));

        return {
          ...prev,
          options: updatedOptions,
        };
      });
    }
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
          console.error("Error generating poll code:", codeError);
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
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPollCode = async () => {
    await navigator.clipboard.writeText(generatedPollCode);
    setCopiedPoll(true);
    setTimeout(() => setCopiedPoll(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading poll...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center">
              <div className="text-emerald-600 text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-4">
                {isEditing ? "Poll Updated!" : "Poll Created!"}
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Your poll is live and ready to collect votes.
              </p>

              <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Share your poll:
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded border p-3">
                    <div className="flex-1 truncate">
                      <div className="text-sm text-neutral-500">
                        Direct Link
                      </div>
                      <div className="font-mono text-sm text-neutral-900 truncate">
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
                      {copiedLink ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-x-4">
                <button
                  onClick={() =>
                    router.push(`/dashboard/results/${generatedPollCode}`)
                  }
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  View Poll
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="border border-neutral-300 hover:border-neutral-400 text-neutral-700 px-6 py-3 rounded-md font-medium transition-colors"
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
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {isEditing ? "Edit Poll" : "Create New Poll"}
              </h1>
              <p className="text-neutral-600">
                {isEditing
                  ? "Make changes to your poll"
                  : "Build a poll that gets results"}
              </p>
              {isEditing && (
                <div className="mt-2 text-sm text-neutral-500">
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                  className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                  className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Answer Options *
                </label>
                <div className="text-xs text-neutral-500 mb-3">
                  Drag the grip handle to reorder options
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                  <SortableContext
                    items={formData.options.map((option) => option.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <SortableOption
                          key={option.id}
                          option={option}
                          index={index}
                          updateOption={updateOption}
                          removeOption={removeOption}
                          canRemove={formData.options.length > 2}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

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
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="font-medium text-neutral-900 mb-3">
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
                      className="w-4 h-4 text-emerald-600 bg-neutral-100 border-neutral-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">
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
                      className="w-4 h-4 text-emerald-600 bg-neutral-100 border-neutral-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">
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
                      className="w-4 h-4 text-emerald-600 bg-neutral-100 border-neutral-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">
                      Set time limit for voting
                    </span>
                  </label>

                  {formData.hasTimeLimit && (
                    <div className="mt-4 p-4 bg-white rounded border border-neutral-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
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
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium text-lg transition-colors"
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
                  className="px-6 py-3 border border-neutral-300 hover:border-neutral-400 text-neutral-700 rounded-md font-medium transition-colors"
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

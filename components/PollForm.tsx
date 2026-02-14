// components/PollForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  IconPlus,
  IconX,
  IconCopy,
  IconCheck,
  IconGripVertical,
  IconTrash,
  IconLoader2,
  IconChartBar,
  IconArrowLeft,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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
      className={`relative flex items-center space-x-2 p-2 pl-0 bg-card border rounded-xl transition-all ${
        isDragging ? "shadow-lg border-emerald-500/50" : "border-border"
      } overflow-hidden`}
    >
      {/* Confirm delete */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center flex-wrap gap-2 bg-card/95 backdrop-blur-sm z-10"
          >
            <p className="text-sm text-foreground">Delete this option?</p>
            <div className="flex items-center space-x-2 text-sm">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeOption(option.id)}
              >
                <IconTrash size={14} />
                Yes, delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleting(false)}
              >
                <IconX size={14} />
                Keep it
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Drag to reorder"
      >
        <IconGripVertical size={20} />
      </div>

      {/* Option number */}
      <div className="hidden sm:flex flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-xs font-semibold rounded-full items-center justify-center">
        {index + 1}
      </div>

      {/* Option input */}
      <Input
        type="text"
        value={option.text}
        onChange={(e) => updateOption(option.id, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1"
        required
      />

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
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
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
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
    if (formData.options.length <= 2) return;
    setFormData((prev) => {
      const filteredOptions = prev.options.filter((option) => option.id !== id);
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
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("You must be logged in to create or edit polls");
      }

      if (!formData.question.trim()) {
        throw new Error("Please enter a question");
      }

      const validOptions = formData.options.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        throw new Error("Please provide at least 2 options");
      }

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
        try {
          pollCode = await generateUniquePollCode();
          setGeneratedPollCode(pollCode);
        } catch (codeError) {
          console.error("Error generating poll code:", codeError);
          throw new Error(
            "Unable to generate unique poll code. Please try again.",
          );
        }

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

      // Fire confetti on success
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#14b8a6", "#34d399", "#6ee7b7"],
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border bg-card overflow-hidden shadow-lg"
          >
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="p-6 sm:p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"
              >
                <IconCheck className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <h1 className="text-2xl font-display text-foreground mb-2">
                {isEditing ? "Poll Updated!" : "Poll Created!"}
              </h1>
              <p className="text-muted-foreground mb-8">
                Your poll is live and ready to collect votes.
              </p>

              <div className="rounded-xl border bg-muted/50 p-5 mb-6">
                <h3 className="font-semibold text-foreground mb-4 text-sm">
                  Share your poll:
                </h3>

                <div className="flex items-center gap-2 bg-card rounded-lg border p-3">
                  <div className="flex-1 truncate">
                    <div className="text-xs text-muted-foreground mb-0.5">
                      Direct Link
                    </div>
                    <div className="font-mono text-sm text-foreground truncate">
                      {`${
                        typeof window !== "undefined"
                          ? window.location.origin
                          : ""
                      }/answer/${generatedPollCode}`}
                    </div>
                  </div>
                  <Button
                    onClick={copyPollLink}
                    variant="brand"
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <IconCheck size={14} />
                    ) : (
                      <IconCopy size={14} />
                    )}
                    {copiedLink ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="brand"
                  onClick={() =>
                    router.push(`/dashboard/results/${generatedPollCode}`)
                  }
                  className="gap-1.5"
                >
                  <IconChartBar size={16} />
                  View Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSuccess(false)}
                >
                  {isEditing ? "Edit Again" : "Create Another"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <IconArrowLeft size={18} className="mr-1.5" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border bg-card overflow-hidden shadow-lg"
        >
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-4 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display text-foreground mb-2">
                {isEditing ? "Edit Poll" : "Create New Poll"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing
                  ? "Make changes to your poll"
                  : "Build a poll that gets results"}
              </p>
              {isEditing && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Poll Code:{" "}
                  <span className="font-mono font-semibold bg-muted px-2 py-0.5 rounded">
                    {pollCode}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
              >
                <div className="text-destructive text-sm">{error}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Poll Question *
                </label>
                <Input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  placeholder="What's your question?"
                  className="text-lg h-12"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
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
                  className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 transition-shadow"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Answer Options *
                </label>
                <div className="text-xs text-muted-foreground mb-3">
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

                <motion.button
                  type="button"
                  onClick={addOption}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="mt-3 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50 transition-colors text-sm font-medium"
                >
                  <IconPlus size={16} />
                  Add Another Option
                </motion.button>
              </div>

              {/* Settings */}
              <div className="rounded-xl border bg-muted/50 p-4">
                <h3 className="font-semibold text-foreground mb-4 text-sm">
                  Poll Settings
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.allowMultiple}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            allowMultiple: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-colors flex items-center justify-center">
                        <IconCheck
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100"
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                      Allow multiple selections
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-colors flex items-center justify-center">
                        <IconCheck
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100"
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                      Poll is active (people can vote)
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
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
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-colors flex items-center justify-center">
                        <IconCheck
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100"
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                      Set time limit for voting
                    </span>
                  </label>

                  <AnimatePresence>
                    {formData.hasTimeLimit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-card rounded-xl border border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Start Date & Time
                              </label>
                              <Input
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    startDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                End Date & Time
                              </label>
                              <Input
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    endDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Poll will only accept votes between these dates.
                            Leave empty to allow voting indefinitely.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  variant="brand"
                  size="xl"
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <>
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Poll"
                  ) : (
                    "Create Poll"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

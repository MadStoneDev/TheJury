// components/PollForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  IconLock,
  IconChevronDown,
  IconSparkles,
} from "@tabler/icons-react";
import { generateUniquePollCode } from "@/utils/pollCodeGenerator";
import {
  createPoll,
  updatePoll,
  getPollByCode,
  getCurrentUser,
  getProfile,
  getActivePollCount,
} from "@/lib/supabaseHelpers";
import type { QuestionInput } from "@/lib/supabaseHelpers";
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
import UpgradeModal from "@/components/UpgradeModal";
import { getFeatureLimit, canUseFeature } from "@/lib/featureGate";
import type { Feature } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";
import {
  QUESTION_TYPES,
  questionTypeHasOptions,
  getDefaultSettings,
  type QuestionType,
} from "@/lib/questionTypes";
import { QuestionTypeConfig } from "@/components/question-types";
import ImageUploader from "@/components/question-types/ImageUploader";
import { getTemplateById } from "@/lib/templates";
import AIGenerateModal from "@/components/AIGenerateModal";
import { hashPassword } from "@/lib/passwordUtils";
import { ABTestSetup } from "@/components/ab-testing";
import type { ABVariant } from "@/components/ab-testing";
import { createABExperiment } from "@/lib/supabaseHelpers";

interface PollOption {
  id: string;
  text: string;
  optionOrder?: number;
  image_url?: string;
}

interface QuestionFormData {
  id?: string; // DB id when editing
  questionText: string;
  questionType: string;
  allowMultiple: boolean;
  settings: Record<string, unknown>;
  options: PollOption[];
}

interface PollFormProps {
  pollCode?: string;
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

      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Drag to reorder"
      >
        <IconGripVertical size={20} />
      </div>

      <div className="hidden sm:flex flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-xs font-semibold rounded-full items-center justify-center">
        {index + 1}
      </div>

      <Input
        type="text"
        value={option.text}
        onChange={(e) => updateOption(option.id, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1"
        required
      />

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

// QuestionCard component
interface QuestionCardProps {
  question: QuestionFormData;
  questionIndex: number;
  totalQuestions: number;
  sensors: ReturnType<typeof useSensors>;
  onUpdate: (updated: QuestionFormData) => void;
  onRemove: () => void;
  canRemove: boolean;
  userTier: TierName;
  onUpgradeRequest: (feature: Feature) => void;
}

function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  sensors,
  onUpdate,
  onRemove,
  canRemove,
  userTier,
  onUpgradeRequest,
}: QuestionCardProps) {
  const addOption = () => {
    const newId = `q${questionIndex}-${question.options.length + 1}-${Date.now()}`;
    const newOrder =
      Math.max(...question.options.map((o) => o.optionOrder || 0), 0) + 1;
    onUpdate({
      ...question,
      options: [
        ...question.options,
        { id: newId, text: "", optionOrder: newOrder },
      ],
    });
  };

  const removeOption = (id: string) => {
    if (question.options.length <= 2) return;
    const filtered = question.options
      .filter((o) => o.id !== id)
      .map((o, i) => ({ ...o, optionOrder: i }));
    onUpdate({ ...question, options: filtered });
  };

  const updateOption = (id: string, text: string) => {
    onUpdate({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIdx = question.options.findIndex((i) => i.id === active.id);
      const newIdx = question.options.findIndex((i) => i.id === over!.id);
      const newOpts = [...question.options];
      const [moved] = newOpts.splice(oldIdx, 1);
      newOpts.splice(newIdx, 0, moved);
      onUpdate({
        ...question,
        options: newOpts.map((o, i) => ({ ...o, optionOrder: i })),
      });
    }
  };

  const hasOptions = questionTypeHasOptions(question.questionType);
  const isImageChoice = question.questionType === "image_choice";

  const handleTypeChange = (newType: string) => {
    const typeDef = QUESTION_TYPES.find((t) => t.value === newType);
    if (!typeDef) return;

    // Check tier gating
    if (typeDef.featureKey && !canUseFeature(userTier, typeDef.featureKey)) {
      onUpgradeRequest(typeDef.featureKey);
      return;
    }

    const defaults = getDefaultSettings(newType as QuestionType);
    onUpdate({
      ...question,
      questionType: newType,
      settings: defaults,
      // Reset options if switching to a type that doesn't use options
      options: typeDef.hasOptions
        ? question.options.length >= 2
          ? question.options
          : [
              { id: `q${questionIndex}-0-${Date.now()}`, text: "", optionOrder: 0 },
              { id: `q${questionIndex}-1-${Date.now()}`, text: "", optionOrder: 1 },
            ]
        : [],
    });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {totalQuestions > 1 ? `Question ${questionIndex + 1}` : "Question"}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <IconTrash size={14} />
            Remove
          </button>
        )}
      </div>

      {/* Question Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Question Type
        </label>
        <div className="relative">
          <select
            value={question.questionType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
          >
            {QUESTION_TYPES.map((qt) => {
              const locked =
                qt.featureKey !== null && !canUseFeature(userTier, qt.featureKey);
              return (
                <option key={qt.value} value={qt.value}>
                  {qt.label}
                  {locked ? " 🔒" : ""}
                </option>
              );
            })}
          </select>
          <IconChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {QUESTION_TYPES.find((t) => t.value === question.questionType)
            ?.description || ""}
        </p>
      </div>

      {/* Question Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Question *
        </label>
        <Input
          type="text"
          value={question.questionText}
          onChange={(e) =>
            onUpdate({ ...question, questionText: e.target.value })
          }
          placeholder="What's your question?"
          className="text-lg h-12"
          required
        />
      </div>

      {/* Type-specific config (rating_scale, reaction) */}
      <QuestionTypeConfig
        type={question.questionType as QuestionType}
        settings={question.settings}
        onChange={(settings) => onUpdate({ ...question, settings })}
      />

      {/* Options — only shown for types that have options */}
      {hasOptions && (
        <div className="mb-4 mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            {isImageChoice ? "Image Options *" : "Answer Options *"}
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
              items={question.options.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={option.id}>
                    <SortableOption
                      option={option}
                      index={index}
                      updateOption={updateOption}
                      removeOption={removeOption}
                      canRemove={question.options.length > 2}
                    />
                    {isImageChoice && (
                      <div className="ml-8 mt-1">
                        <ImageUploader
                          imageUrl={option.image_url || ""}
                          onChange={(url) =>
                            onUpdate({
                              ...question,
                              options: question.options.map((o) =>
                                o.id === option.id
                                  ? { ...o, image_url: url }
                                  : o,
                              ),
                            })
                          }
                          label="Image URL"
                        />
                      </div>
                    )}
                  </div>
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
      )}

      {/* Question Settings — allow_multiple only for types with options */}
      {hasOptions && question.questionType !== "reaction" && (
        <label className="flex items-center cursor-pointer group mt-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={question.allowMultiple}
              onChange={(e) =>
                onUpdate({ ...question, allowMultiple: e.target.checked })
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
      )}
    </div>
  );
}

export default function PollForm({ pollCode }: PollFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = !!pollCode;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  // Poll metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [pollPassword, setPollPassword] = useState("");
  const [abVariants, setAbVariants] = useState<ABVariant[]>([]);

  // Questions
  const [questions, setQuestions] = useState<QuestionFormData[]>([
    {
      questionText: "",
      questionType: "multiple_choice",
      allowMultiple: false,
      settings: {},
      options: [
        { id: "1", text: "", optionOrder: 0 },
        { id: "2", text: "", optionOrder: 1 },
      ],
    },
  ]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPollCode, setGeneratedPollCode] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string>("");
  const [pollId, setPollId] = useState<string>("");

  // Tier & upgrade
  const [userTier, setUserTier] = useState<TierName>("free");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<Feature>("maxQuestionsPerPoll");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Load user tier
      const user = await getCurrentUser();
      if (user) {
        const profile = await getProfile(user.id);
        if (profile?.subscription_tier) {
          setUserTier(profile.subscription_tier as TierName);
        }
      }

      // Load template if specified in query params
      if (!isEditing) {
        const templateId = searchParams.get("template");
        if (templateId) {
          const template = getTemplateById(templateId);
          if (template) {
            if (template.questions.length > 1) {
              setTitle(template.name);
              setDescription(template.description);
            }
            setQuestions(
              template.questions.map((q, qi) => ({
                questionText: q.question_text,
                questionType: q.question_type,
                allowMultiple: q.allow_multiple,
                settings: q.settings,
                options:
                  q.options.length > 0
                    ? q.options.map((o, oi) => ({
                        id: `t${qi}-${oi}-${Date.now()}`,
                        text: o.text,
                        optionOrder: oi,
                      }))
                    : [
                        { id: `t${qi}-0-${Date.now()}`, text: "", optionOrder: 0 },
                        { id: `t${qi}-1-${Date.now()}`, text: "", optionOrder: 1 },
                      ],
              })),
            );
          }
        }
      }

      // Load poll data if editing
      if (isEditing && pollCode) {
        setIsLoading(true);
        try {
          const poll = await getPollByCode(pollCode);
          if (!poll) {
            setError("Poll not found");
            return;
          }

          if (!user || poll.user_id !== user.id) {
            setError("You don't have permission to edit this poll");
            return;
          }

          setTitle(poll.question);
          setDescription(poll.description || "");
          setIsActive(poll.is_active);
          setHasTimeLimit(poll.has_time_limit);
          setStartDate(
            poll.start_date
              ? new Date(poll.start_date).toISOString().slice(0, 16)
              : "",
          );
          setEndDate(
            poll.end_date
              ? new Date(poll.end_date).toISOString().slice(0, 16)
              : "",
          );
          setGeneratedPollCode(poll.code);
          setPollId(poll.id);
          setHasPassword(!!poll.password_hash);

          // Load questions
          if (poll.questions && poll.questions.length > 0) {
            setQuestions(
              poll.questions.map((q, qi) => ({
                id: q.id,
                questionText: q.question_text,
                questionType: q.question_type,
                allowMultiple: q.allow_multiple,
                settings: q.settings || {},
                options:
                  q.options.length > 0
                    ? q.options.map((opt, oi) => ({
                        id: `q${qi}-${oi}-${opt.id}`,
                        text: opt.text,
                        optionOrder: opt.option_order,
                        image_url: opt.image_url,
                      }))
                    : [
                        { id: `q${qi}-0`, text: "", optionOrder: 0 },
                        { id: `q${qi}-1`, text: "", optionOrder: 1 },
                      ],
              })),
            );
          } else {
            // Legacy: single question from poll data
            const sortedOptions =
              poll.options?.sort(
                (a, b) => (a.option_order || 0) - (b.option_order || 0),
              ) || [];

            setQuestions([
              {
                questionText: poll.question,
                questionType: "multiple_choice",
                allowMultiple: poll.allow_multiple,
                settings: {},
                options:
                  sortedOptions.length > 0
                    ? sortedOptions.map((opt, i) => ({
                        id: `q0-${i}`,
                        text: opt.text,
                        optionOrder: opt.option_order || i,
                      }))
                    : [
                        { id: "q0-0", text: "", optionOrder: 0 },
                        { id: "q0-1", text: "", optionOrder: 1 },
                      ],
              },
            ]);
          }
        } catch (err) {
          console.error("Error loading poll:", err);
          setError("Failed to load poll");
        } finally {
          setIsLoading(false);
        }
      }
    };

    init();
  }, [isEditing, pollCode]);

  const questionLimit = getFeatureLimit(userTier, "maxQuestionsPerPoll");
  const canAddQuestion =
    questionLimit === -1 || questions.length < questionLimit;

  const addQuestion = () => {
    if (!canAddQuestion) {
      setUpgradeFeature("maxQuestionsPerPoll");
      setUpgradeModalOpen(true);
      return;
    }
    const qi = questions.length;
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionType: "multiple_choice",
        allowMultiple: false,
        settings: {},
        options: [
          { id: `q${qi}-0-${Date.now()}`, text: "", optionOrder: 0 },
          { id: `q${qi}-1-${Date.now()}`, text: "", optionOrder: 1 },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updated: QuestionFormData) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
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

      // For single-question polls, use the question text as the poll title
      const pollTitle =
        questions.length === 1
          ? questions[0].questionText.trim()
          : title.trim();

      if (!pollTitle) {
        throw new Error(
          questions.length === 1
            ? "Please enter a question"
            : "Please enter a poll title",
        );
      }

      // Validate each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) {
          throw new Error(`Please enter text for Question ${i + 1}`);
        }
        // Only validate options for types that use them
        if (questionTypeHasOptions(q.questionType)) {
          const validOpts = q.options.filter((o) => o.text.trim());
          if (validOpts.length < 2) {
            throw new Error(
              `Please provide at least 2 options for Question ${i + 1}`,
            );
          }
        }
      }

      if (hasTimeLimit && startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
          throw new Error("End date must be after start date");
        }
      }

      // Check active poll limit when creating a new active poll
      if (!isEditing && isActive) {
        const limit = getFeatureLimit(userTier, "maxActivePolls");
        if (limit !== -1) {
          const activeCount = await getActivePollCount(user.id);
          if (activeCount >= limit) {
            setUpgradeModalOpen(true);
            throw new Error(
              `You've reached your limit of ${limit} active polls.`,
            );
          }
        }
      }

      // Hash password if set
      const passwordHash = hasPassword && pollPassword.trim()
        ? await hashPassword(pollPassword.trim())
        : null;

      let code = generatedPollCode;

      if (!isEditing) {
        code = await generateUniquePollCode();
        setGeneratedPollCode(code);

        const pollData = {
          code,
          user_id: user.id,
          question: pollTitle,
          description: description.trim() || null,
          allow_multiple: questions[0].allowMultiple,
          is_active: isActive,
          has_time_limit: hasTimeLimit,
          start_date:
            hasTimeLimit && startDate
              ? new Date(startDate).toISOString()
              : null,
          end_date:
            hasTimeLimit && endDate ? new Date(endDate).toISOString() : null,
          password_hash: passwordHash,
        };

        const questionsInput: QuestionInput[] = questions.map((q) => ({
          question_text: q.questionText.trim(),
          question_type: q.questionType,
          allow_multiple: q.allowMultiple,
          settings: q.settings,
          options: questionTypeHasOptions(q.questionType)
            ? q.options
                .filter((o) => o.text.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  ...(o.image_url ? { image_url: o.image_url } : {}),
                }))
            : [],
        }));

        const fallbackOptions = questions[0].options
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim() }));

        const createdPollId = await createPoll(
          pollData,
          fallbackOptions,
          questionsInput,
        );

        if (!createdPollId) {
          throw new Error("Failed to create poll");
        }

        // Create A/B experiment if variants were configured
        if (abVariants.length >= 2) {
          await createABExperiment(
            createdPollId,
            `${pollTitle} - A/B Test`,
            abVariants.map((v) => ({
              name: v.name,
              questionText: v.questionText,
              weight: v.weight,
            })),
          );
        }
      } else {
        const pollData = {
          question: pollTitle,
          description: description.trim() || null,
          allow_multiple: questions[0].allowMultiple,
          is_active: isActive,
          has_time_limit: hasTimeLimit,
          start_date:
            hasTimeLimit && startDate
              ? new Date(startDate).toISOString()
              : null,
          end_date:
            hasTimeLimit && endDate ? new Date(endDate).toISOString() : null,
          password_hash: passwordHash,
        };

        const questionsInput = questions.map((q) => ({
          id: q.id,
          question_text: q.questionText.trim(),
          question_type: q.questionType,
          allow_multiple: q.allowMultiple,
          settings: q.settings,
          options: questionTypeHasOptions(q.questionType)
            ? q.options
                .filter((o) => o.text.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  ...(o.image_url ? { image_url: o.image_url } : {}),
                }))
            : [],
        }));

        const success = await updatePoll(
          pollId,
          pollData,
          undefined,
          questionsInput,
        );

        if (!success) {
          throw new Error("Failed to update poll");
        }
      }

      setShowSuccess(true);

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
                      {`${typeof window !== "undefined" ? window.location.origin : ""}/answer/${generatedPollCode}`}
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

  const isSingleQuestion = questions.length === 1;

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
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setAiModalOpen(true)}
                >
                  <IconSparkles size={14} className="text-emerald-500" />
                  Generate with AI
                </Button>
              )}
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
              {/* Multi-question: show title + description separately */}
              {!isSingleQuestion && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Poll Title *
                    </label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your poll a title"
                      className="text-lg h-12"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add context or instructions..."
                      rows={2}
                      className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 transition-shadow"
                    />
                  </div>
                </>
              )}

              {/* Single-question: description field */}
              {isSingleQuestion && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add context or instructions..."
                    rows={3}
                    className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 transition-shadow"
                  />
                </div>
              )}

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    questionIndex={i}
                    totalQuestions={questions.length}
                    sensors={sensors}
                    onUpdate={(updated) => updateQuestion(i, updated)}
                    onRemove={() => removeQuestion(i)}
                    canRemove={questions.length > 1}
                    userTier={userTier}
                    onUpgradeRequest={(feature) => {
                      setUpgradeFeature(feature);
                      setUpgradeModalOpen(true);
                    }}
                  />
                ))}

                {/* Add Question button */}
                <motion.button
                  type="button"
                  onClick={addQuestion}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50 transition-colors text-sm font-medium"
                >
                  {canAddQuestion ? (
                    <IconPlus size={16} />
                  ) : (
                    <IconLock size={16} />
                  )}
                  Add Question
                  {!canAddQuestion && (
                    <span className="text-xs text-muted-foreground/60 ml-1">
                      (Pro)
                    </span>
                  )}
                </motion.button>

                {userTier === "free" && (
                  <p className="text-xs text-muted-foreground text-center">
                    {questions.length} / {questionLimit} questions
                    {questions.length >= questionLimit && (
                      <>
                        {" — "}
                        <button
                          type="button"
                          onClick={() => setUpgradeModalOpen(true)}
                          className="text-emerald-500 hover:text-emerald-400 underline"
                        >
                          Upgrade for unlimited
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* A/B Testing (Team tier, new polls only, single question) */}
              {!isEditing && questions.length === 1 && canUseFeature(userTier, "abTesting") && (
                <ABTestSetup
                  variants={abVariants}
                  onChange={setAbVariants}
                  baseQuestionText={questions[0]?.questionText || ""}
                />
              )}

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
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
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
                        checked={hasTimeLimit}
                        onChange={(e) => {
                          if (!canUseFeature(userTier, "scheduling")) {
                            setUpgradeFeature("scheduling");
                            setUpgradeModalOpen(true);
                            return;
                          }
                          setHasTimeLimit(e.target.checked);
                          if (!e.target.checked) {
                            setStartDate("");
                            setEndDate("");
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-colors flex items-center justify-center">
                        <IconCheck
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100"
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-foreground group-hover:text-foreground/80 transition-colors flex items-center gap-1.5">
                      Set time limit for voting
                      {!canUseFeature(userTier, "scheduling") && (
                        <IconLock size={12} className="text-muted-foreground" />
                      )}
                    </span>
                  </label>

                  <AnimatePresence>
                    {hasTimeLimit && (
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
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                End Date & Time
                              </label>
                              <Input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Poll will only accept votes between these dates.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Protection */}
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={hasPassword}
                        onChange={(e) => {
                          if (!canUseFeature(userTier, "passwordProtect")) {
                            setUpgradeFeature("passwordProtect");
                            setUpgradeModalOpen(true);
                            return;
                          }
                          setHasPassword(e.target.checked);
                          if (!e.target.checked) {
                            setPollPassword("");
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-colors flex items-center justify-center">
                        <IconCheck
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100"
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-foreground group-hover:text-foreground/80 transition-colors flex items-center gap-1.5">
                      Password protect this poll
                      {!canUseFeature(userTier, "passwordProtect") && (
                        <IconLock size={12} className="text-muted-foreground" />
                      )}
                    </span>
                  </label>

                  <AnimatePresence>
                    {hasPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-card rounded-xl border border-border">
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Poll Password
                          </label>
                          <Input
                            type="text"
                            value={pollPassword}
                            onChange={(e) => setPollPassword(e.target.value)}
                            placeholder="Enter a password for voters"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Voters will need this password to access the poll.
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

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature={upgradeFeature}
      />

      {/* AI Generate Modal */}
      <AIGenerateModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApply={(poll) => {
          if (poll.questions.length > 1) {
            setTitle(poll.title);
            setDescription(poll.description);
          } else {
            setDescription(poll.description);
          }
          setQuestions(
            poll.questions.map((q, qi) => ({
              questionText: q.question_text,
              questionType: q.question_type,
              allowMultiple: q.allow_multiple,
              settings: {},
              options:
                q.options.length > 0
                  ? q.options.map((o, oi) => ({
                      id: `ai${qi}-${oi}-${Date.now()}`,
                      text: o.text,
                      optionOrder: oi,
                    }))
                  : [
                      { id: `ai${qi}-0-${Date.now()}`, text: "", optionOrder: 0 },
                      { id: `ai${qi}-1-${Date.now()}`, text: "", optionOrder: 1 },
                    ],
            })),
          );
        }}
      />
    </div>
  );
}

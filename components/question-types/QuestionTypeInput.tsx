"use client";

import type { PollQuestion } from "@/lib/supabaseHelpers";
import RatingScaleInput from "./RatingScaleInput";
import RankedChoiceInput from "./RankedChoiceInput";
import ImageOptionInput from "./ImageOptionInput";
import OpenEndedInput from "./OpenEndedInput";
import ReactionPollInput from "./ReactionPollInput";

interface QuestionTypeInputProps {
  question: PollQuestion;
  /** Selected option IDs (for multiple_choice, image_choice) */
  selectedOptions: string[];
  /** Toggle an option ID on/off */
  onToggleOption: (optionId: string) => void;
  /** Structured answer data (for rating_scale, ranked_choice, open_ended, reaction) */
  answerData: Record<string, unknown>;
  /** Update structured answer data */
  onAnswerChange: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}

/**
 * Dispatcher component that renders the correct input UI based on question type.
 * For multiple_choice, the parent handles rendering (option buttons).
 * This component handles all other types.
 */
export default function QuestionTypeInput({
  question,
  selectedOptions,
  onToggleOption,
  answerData,
  onAnswerChange,
  disabled,
}: QuestionTypeInputProps) {
  switch (question.question_type) {
    case "rating_scale":
      return (
        <RatingScaleInput
          settings={question.settings}
          value={(answerData.rating as number) ?? null}
          onChange={(v) => onAnswerChange({ ...answerData, rating: v })}
          disabled={disabled}
        />
      );

    case "ranked_choice":
      return (
        <RankedChoiceInput
          options={question.options.map((o) => ({ id: o.id, text: o.text }))}
          rankings={(answerData.rankings as string[]) ?? []}
          onChange={(rankings) =>
            onAnswerChange({ ...answerData, rankings })
          }
          disabled={disabled}
        />
      );

    case "image_choice":
      return (
        <ImageOptionInput
          options={question.options.map((o) => ({
            id: o.id,
            text: o.text,
            image_url: o.image_url,
          }))}
          selected={selectedOptions}
          onToggle={onToggleOption}
          allowMultiple={question.allow_multiple}
          disabled={disabled}
        />
      );

    case "open_ended":
      return (
        <OpenEndedInput
          value={(answerData.text as string) ?? ""}
          onChange={(text) => onAnswerChange({ ...answerData, text })}
          disabled={disabled}
        />
      );

    case "reaction": {
      const emojis = (question.settings.emojis as string[]) ?? [
        "👍", "👎", "❤️", "😂", "😮", "😢",
      ];
      return (
        <ReactionPollInput
          emojis={emojis}
          selected={selectedOptions}
          onToggle={onToggleOption}
          disabled={disabled}
        />
      );
    }

    default:
      // multiple_choice — handled by the parent's renderOptionButton
      return null;
  }
}

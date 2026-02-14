"use client";

import type { QuestionType } from "@/lib/questionTypes";
import RatingScaleConfig from "./RatingScaleConfig";
import ReactionPollConfig from "./ReactionPollConfig";

interface QuestionTypeConfigProps {
  type: QuestionType;
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

/**
 * Dispatcher component that renders type-specific configuration UI in the PollForm.
 * Only rating_scale and reaction have custom config — others use the standard options editor.
 */
export default function QuestionTypeConfig({
  type,
  settings,
  onChange,
}: QuestionTypeConfigProps) {
  switch (type) {
    case "rating_scale":
      return <RatingScaleConfig settings={settings} onChange={onChange} />;
    case "reaction":
      return <ReactionPollConfig settings={settings} onChange={onChange} />;
    default:
      return null;
  }
}

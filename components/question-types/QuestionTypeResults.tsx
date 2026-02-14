"use client";

import type { QuestionResult } from "@/lib/supabaseHelpers";
import RatingScaleResults from "./RatingScaleResults";
import RankedChoiceResults from "./RankedChoiceResults";
import OpenEndedResults from "./OpenEndedResults";
import ReactionPollResults from "./ReactionPollResults";

interface QuestionTypeResultsProps {
  questionResult: QuestionResult;
  totalVoters: number;
}

/**
 * Dispatcher component that renders the correct results visualization based on question type.
 * For multiple_choice and image_choice, the parent handles rendering (bar charts).
 * This component handles all specialized result types.
 */
export default function QuestionTypeResults({
  questionResult,
  totalVoters,
}: QuestionTypeResultsProps) {
  switch (questionResult.question_type) {
    case "rating_scale":
      if (questionResult.ratingData) {
        return <RatingScaleResults data={questionResult.ratingData} />;
      }
      return null;

    case "ranked_choice":
      if (questionResult.rankedData) {
        return (
          <RankedChoiceResults
            data={questionResult.rankedData}
            totalVoters={totalVoters}
          />
        );
      }
      return null;

    case "open_ended":
      if (questionResult.openEndedData) {
        return <OpenEndedResults data={questionResult.openEndedData} />;
      }
      return null;

    case "reaction":
      return (
        <ReactionPollResults
          results={questionResult.results}
          totalVoters={totalVoters}
        />
      );

    default:
      // multiple_choice, image_choice — handled by parent (standard bar results)
      return null;
  }
}

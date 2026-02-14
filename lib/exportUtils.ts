import type { PollResult, QuestionResult } from "@/lib/supabaseHelpers";

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportResultsToCSV(
  pollQuestion: string,
  pollCode: string,
  results: PollResult[],
  totalVoters: number,
) {
  const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

  const lines: string[] = [];

  // Metadata comment row
  lines.push(
    `# Poll: ${escapeCsvField(pollQuestion)} | Code: ${pollCode} | Total Voters: ${totalVoters} | Exported: ${new Date().toISOString()}`,
  );

  // Header
  lines.push("Option,Votes,Percentage");

  // Data rows
  for (const result of results) {
    const percentage =
      totalVoters > 0
        ? ((result.vote_count / totalVoters) * 100).toFixed(1)
        : "0.0";
    lines.push(
      `${escapeCsvField(result.option_text)},${result.vote_count},${percentage}%`,
    );
  }

  // Total row
  lines.push(`Total,${totalVotes},`);

  downloadCsv(lines.join("\n"), pollCode);
}

export function exportQuestionResultsToCSV(
  pollTitle: string,
  pollCode: string,
  questionResults: QuestionResult[],
  totalVoters: number,
) {
  const lines: string[] = [];

  // Metadata comment row
  lines.push(
    `# Poll: ${escapeCsvField(pollTitle)} | Code: ${pollCode} | Total Voters: ${totalVoters} | Questions: ${questionResults.length} | Exported: ${new Date().toISOString()}`,
  );

  for (const qr of questionResults) {
    // Question section header
    lines.push("");
    lines.push(
      `# Question ${qr.question_order}: ${escapeCsvField(qr.question_text)}`,
    );
    lines.push("Option,Votes,Percentage");

    let questionTotal = 0;
    for (const result of qr.results) {
      const percentage =
        totalVoters > 0
          ? ((result.vote_count / totalVoters) * 100).toFixed(1)
          : "0.0";
      lines.push(
        `${escapeCsvField(result.option_text)},${result.vote_count},${percentage}%`,
      );
      questionTotal += result.vote_count;
    }

    lines.push(`Subtotal,${questionTotal},`);
  }

  downloadCsv(lines.join("\n"), pollCode);
}

function downloadCsv(csvContent: string, pollCode: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split("T")[0];
  const filename = `poll-results-${pollCode}-${date}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

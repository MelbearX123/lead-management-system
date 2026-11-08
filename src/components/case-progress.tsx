import { capitalize } from "@/lib/format";
import { type Progress, progressStages } from "@/lib/lead-states";

export function CaseProgress({ progress }: { progress: Progress }) {
  const current = progressStages.indexOf(progress);

  return (
    <ol className="flex gap-2 text-sm">
      {progressStages.map((stage, index) => (
        <li
          key={stage}
          aria-current={index === current ? "step" : undefined}
          className={`flex-1 border-t-4 pt-2 ${
            index <= current ? "border-green-600 text-gray-900" : "border-gray-200 text-gray-400"
          } ${index === current ? "font-semibold" : ""}`}
        >
          {capitalize(stage)}
        </li>
      ))}
    </ol>
  );
}

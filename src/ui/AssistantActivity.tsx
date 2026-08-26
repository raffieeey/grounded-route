import type { AssistantActivity } from "@/domain/verdict.ts";

interface AssistantActivityProps {
  activity: AssistantActivity[];
}

export default function AssistantActivity({ activity }: AssistantActivityProps) {
  if (activity.length === 0) return null;
  const recent = activity.slice(-3).reverse();
  return (
    <section
      className="assistant-activity"
      aria-label="Assistant activity"
      role="region"
    >
      <h2>Assistant activity</h2>
      <p className="assistant-intro">
        A browser assistant using WebMCP proposed the following in this shared workspace. You remain the only approver and exporter.
      </p>
      <ul className="assistant-list" role="list">
        {recent.map((a) => (
          <li key={a.id} className={`assistant-item kind-${a.kind}`}>
            <span className="assistant-kind">{a.kind}</span>
            <span className="assistant-summary">{a.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

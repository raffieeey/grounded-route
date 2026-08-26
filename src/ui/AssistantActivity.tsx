import type { AssistantActivity } from "@/domain/verdict.ts";

interface AssistantActivityProps {
  activity: AssistantActivity[];
}

function relativeTime(timestamp: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"} ago`;
}

export default function AssistantActivity({ activity }: AssistantActivityProps) {
  if (activity.length === 0) return null;
  const recent = activity.slice(-3).reverse();
  return (
    <section
      className="assistant-activity assistant-banner assistant-banner--sticky"
      aria-label="Assistant activity"
      role="region"
    >
      <div className="assistant-banner__heading">
        <span className="assistant-pulse" aria-hidden="true">AI</span>
        <div>
          <h2>Agent is acting</h2>
          <p className="assistant-intro">Proposals only — you remain the approver and exporter.</p>
        </div>
      </div>
      <ul className="assistant-list" role="list">
        {recent.map((a) => (
          <li key={a.id} className={`assistant-item assistant-item--new kind-${a.kind}`}>
            <span className="assistant-kind">{a.kind}</span>
            <span className="assistant-summary">{a.summary}</span>
            <time className="assistant-time" dateTime={a.timestamp}>
              {relativeTime(a.timestamp)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

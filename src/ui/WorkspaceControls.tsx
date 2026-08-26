import type { RouteProfile } from "@/contracts/types.ts";

interface WorkspaceControlsProps {
  started: boolean;
  activeProfileId: string | null;
  profiles: RouteProfile[];
  onStart: () => void;
  onClear: () => void;
  onSelectProfile: (id: string) => void;
}

export default function WorkspaceControls({
  started,
  activeProfileId,
  profiles,
  onStart,
  onClear,
  onSelectProfile,
}: WorkspaceControlsProps) {
  return (
    <section aria-label="Session controls">
      {!started ? (
        <button
          className="btn-primary touch-target cta-start landing-cta"
          onClick={onStart}
          aria-label="Start a route-impact check"
        >
          Start a route-impact check
        </button>
      ) : (
        <div className="session-actions">
          <span className="session-label">Illustrative corridor loaded.</span>
          <button
            className="btn-secondary touch-target"
            onClick={onClear}
            aria-label="Clear current session"
          >
            Clear current session
          </button>
        </div>
      )}

      {started && (
        <div className="profiles" role="group" aria-label="Select a mobility profile">
          <p className="profiles-prompt">Select a mobility profile to see your route-impact check.</p>
          {profiles.map((p) => (
            <button
              key={p.id}
              className={`profile-button touch-target${activeProfileId === p.id ? " active" : ""}`}
              onClick={() => onSelectProfile(p.id)}
              aria-pressed={activeProfileId === p.id}
              aria-label={p.label}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

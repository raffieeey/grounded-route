import type { RouteProfile } from "@/contracts/types.ts";

interface WorkspaceControlsProps {
  loaded: boolean;
  activeProfileId: string | null;
  profiles: RouteProfile[];
  onLoad: () => void;
  onClear: () => void;
  onSelectProfile: (id: string) => void;
}

export default function WorkspaceControls({
  loaded,
  activeProfileId,
  profiles,
  onLoad,
  onClear,
  onSelectProfile,
}: WorkspaceControlsProps) {
  return (
    <section aria-label="Session controls">
      {!loaded ? (
        <button
          className="btn-primary"
          onClick={onLoad}
          aria-label="Load illustrative demo"
        >
          Load illustrative demo
        </button>
      ) : (
        <button
          className="btn-secondary"
          onClick={onClear}
          aria-label="Clear current session"
        >
          Clear current session
        </button>
      )}

      {loaded && (
        <div className="profiles" role="group" aria-label="Select a profile">
          {profiles.map((p) => (
            <button
              key={p.id}
              className={activeProfileId === p.id ? "active" : ""}
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

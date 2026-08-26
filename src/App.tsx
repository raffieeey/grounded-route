import { useState, useMemo } from "react";
import "./styles/main.css";
import scenarios from "../data/demo_scenarios.json";
import profiles from "../data/route_profiles.json";
import sourceClaims from "../data/source_claims.json";
import mappings from "../data/scenario_impact_mappings.json";

export default function App() {
  const scenario = scenarios[0];
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [activeProfileId]
  );

  const scenarioMappings = useMemo(
    () => mappings.filter((m) => m.scenarioId === scenario.id),
    []
  );

  return (
    <div>
      <header>
        <h1>{scenario.title}</h1>
        <p className="scenario-meta">{scenario.areaBoundsDescription}</p>
      </header>

      <section className="disclaimer" role="note">
        {scenario.disclaimer}
      </section>

      <section>
        <h2>Select a profile</h2>
        <div className="profiles">
          {profiles.map((p) => (
            <button
              key={p.id}
              className={activeProfileId === p.id ? "active" : ""}
              onClick={() => setActiveProfileId(p.id)}
              aria-pressed={activeProfileId === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activeProfile && (
          <p className="scenario-meta">{activeProfile.description}</p>
        )}
      </section>

      <section className="stats">
        <h2>Evidence summary</h2>
        <ul>
          <li>Source claims: {sourceClaims.length}</li>
          <li>Scenario mappings: {scenarioMappings.length}</li>
          <li>Segments in scenario: {scenario.defaultSegmentIds.length}</li>
          <li>Profiles: {profiles.length}</li>
        </ul>
      </section>
    </div>
  );
}

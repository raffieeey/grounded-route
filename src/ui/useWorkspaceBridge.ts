import { useState, useRef, useCallback } from "react";
import type { DomainState } from "@/contracts/types.ts";

export interface WorkspaceBridge {
  getState: () => DomainState;
  replaceState: (next: DomainState, reason: string) => void;
  announce?: (message: string) => void;
}

export function useWorkspaceBridge(initial: DomainState): {
  state: DomainState;
  bridge: WorkspaceBridge;
} {
  const [state, setState] = useState(initial);
  const stateRef = useRef(state);

  const replaceState = useCallback((next: DomainState, reason: string) => {
    setState(next);
    stateRef.current = next;
    // Announce via aria-live through DOM side-effect if needed
    const live = document.getElementById("workspace-announcer");
    if (live) {
      live.textContent = reason;
      // Clear after screen reader has had time to pick it up
      setTimeout(() => {
        if (live.textContent === reason) live.textContent = "";
      }, 1500);
    }
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const bridge: WorkspaceBridge = {
    getState,
    replaceState,
    announce: (message: string) => {
      const live = document.getElementById("workspace-announcer");
      if (live) {
        live.textContent = message;
        setTimeout(() => {
          if (live.textContent === message) live.textContent = "";
        }, 1500);
      }
    },
  };

  return { state, bridge };
}

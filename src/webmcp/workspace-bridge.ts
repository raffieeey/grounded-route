/**
 * WorkspaceBridge — the only channel the WebMCP adapter uses to observe and
 * commit domain state. The adapter never touches the DOM directly; it reads
 * via getState and commits via replaceState exactly once per successful
 * mutation with a compact, human-visible reason summary.
 */
import type { DomainState } from "@/contracts/types.ts";

export interface WorkspaceBridge {
  getState: () => DomainState;
  replaceState: (next: DomainState, reason: string) => void;
  announce?: (message: string) => void;
}

export interface MemoryBridge extends WorkspaceBridge {
  readonly replaceStateCalls: number;
  readonly lastReason: string | null;
}

export function createMemoryBridge(initial: DomainState): MemoryBridge {
  let current: DomainState = initial;
  let calls = 0;
  let lastReason: string | null = null;
  return {
    getState: () => current,
    replaceState: (next, reason) => {
      current = next;
      calls += 1;
      lastReason = reason;
    },
    get replaceStateCalls(): number {
      return calls;
    },
    get lastReason(): string | null {
      return lastReason;
    },
  };
}

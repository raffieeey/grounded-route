/**
 * Browser-native WebMCP model-context contracts (FDN-003).
 *
 * Mirrors the live-checked `document.modelContext` API shape:
 *   await document.modelContext.registerTool({ name, description, inputSchema,
 *     annotations, execute }, { signal });
 *   document.modelContext.executeTool(tool, jsonArgs);
 *
 * `exposedTo` is intentionally NOT modelled.
 */

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface ToolExecutionContext {
  signal: AbortSignal;
}

export interface RegisteredTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  annotations: ToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    ctx: ToolExecutionContext
  ) => Promise<string>;
}

export interface ModelContext {
  registerTool: (
    tool: RegisteredTool,
    options?: { signal?: AbortSignal }
  ) => Promise<unknown>;
  executeTool?: (
    tool: RegisteredTool,
    args: Record<string, unknown>
  ) => Promise<string>;
}

export interface DocumentLike {
  modelContext?: ModelContext;
}

export interface ToolRegistered {
  unavailable: false;
  registeredTool: RegisteredTool;
}

export interface ToolUnavailable {
  unavailable: true;
  reason: string;
}

export type RegistrationResult = ToolRegistered | ToolUnavailable;

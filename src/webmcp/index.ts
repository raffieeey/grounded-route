/**
 * Public entry point for the Grounded Route WebMCP layer (FDN-003).
 */
export {
  registerWebMcpTools,
  WEBMCP_TOOL_NAMES,
  type RegisterOptions,
} from "@/webmcp/adapter.ts";

export {
  createMemoryBridge,
  type WorkspaceBridge,
  type MemoryBridge,
} from "@/webmcp/workspace-bridge.ts";

export {
  type RegisteredTool,
  type RegistrationResult,
  type ToolRegistered,
  type ToolUnavailable,
  type ModelContext,
  type DocumentLike,
  type ToolInputSchema,
  type ToolAnnotations,
} from "@/webmcp/model-context.ts";

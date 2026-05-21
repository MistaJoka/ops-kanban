import { getToolDefinition } from './tool-registry';
import { requiresApproval } from './risk-classifier';

export type ToolExecutionContext = {
  organizationId: string;
  userId: string;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
};

export async function executeToolCall(params: {
  toolName: string;
  input: unknown;
  context: ToolExecutionContext;
}) {
  const tool = getToolDefinition(params.toolName);
  if (!tool) throw new Error(`Unknown tool: ${params.toolName}`);

  if (!tool.requiredRoles.includes(params.context.role)) {
    throw new Error(`Role ${params.context.role} cannot use ${params.toolName}.`);
  }

  const parsedInput = tool.schema.parse(params.input);

  if (requiresApproval(tool.riskLevel)) {
    return {
      status: 'approval_required',
      riskLevel: tool.riskLevel,
      toolName: params.toolName,
      input: parsedInput,
      message: 'This action requires approval before execution.',
    };
  }

  // Route to actual domain tools here.
  return {
    status: 'executed',
    riskLevel: tool.riskLevel,
    toolName: params.toolName,
    input: parsedInput,
    message: 'Tool executed. Wire this to the matching domain service.',
  };
}

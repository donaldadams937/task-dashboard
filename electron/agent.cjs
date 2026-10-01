const OpenAI = require('openai');
const {
  listFiles,
  readFile,
  runCommand,
  writeFile,
} = require('./workspace.cjs');

const MAX_AGENT_STEPS = 30;

const tools = [
  {
    type: 'function',
    name: 'list_files',
    description: 'List project files recursively. Dependency and build directories are omitted.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative directory path. Defaults to the project root.' },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'read_file',
    description: 'Read a UTF-8 text file in the project workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path.' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'write_file',
    description: 'Create or replace a UTF-8 text file in the project workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path.' },
        content: { type: 'string', description: 'Complete file content.' },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'run_command',
    description: 'Run git, node, npm, or npx in the project workspace without a shell.',
    parameters: {
      type: 'object',
      properties: {
        program: { type: 'string', enum: ['git', 'node', 'npm', 'npx'] },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Individual command arguments, such as ["test"] or ["create", "vite@latest", ".", "--", "--template", "react"].',
        },
      },
      required: ['program', 'args'],
      additionalProperties: false,
    },
  },
];

async function executeTool(toolCall, workspace, signal) {
  const input = JSON.parse(toolCall.arguments || '{}');
  switch (toolCall.name) {
    case 'list_files':
      return listFiles(workspace, input.path);
    case 'read_file':
      return readFile(workspace, input.path);
    case 'write_file':
      return writeFile(workspace, input.path, input.content);
    case 'run_command':
      return runCommand(workspace, input.program, input.args, signal);
    default:
      throw new Error(`Unknown tool: ${toolCall.name}`);
  }
}

async function runAgent({ apiKey, model, prompt, workspace, signal, onEvent }) {
  const client = new OpenAI({ apiKey });
  const instructions = `You are UnbeltedTech, an autonomous senior software engineer.
Build the complete application requested by the user inside the empty project workspace.
Work iteratively: inspect files, create implementation and tests, install only necessary dependencies,
run the smallest relevant tests, fix failures, and finish only when the app builds successfully.
Never access paths outside the workspace. Do not merely explain code: create it.
Prefer maintainable, accessible, secure implementations and concise dependency choices.
In your final response, summarize what works and give the exact command to start the application.`;

  onEvent({ type: 'status', message: 'Planning the application' });
  let response = await client.responses.create({
    model,
    instructions,
    input: prompt,
    tools,
  }, { signal });

  for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
    const calls = response.output.filter((item) => item.type === 'function_call');
    if (calls.length === 0) {
      const message = response.output_text?.trim() || 'Build completed.';
      onEvent({ type: 'completed', message });
      return message;
    }

    const toolOutputs = [];
    for (const call of calls) {
      onEvent({
        type: 'tool',
        name: call.name,
        input: JSON.parse(call.arguments || '{}'),
      });

      try {
        const output = await executeTool(call, workspace, signal);
        onEvent({ type: 'tool-result', name: call.name, output });
        toolOutputs.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output,
        });
      } catch (error) {
        const output = `Tool error: ${error.message}`;
        onEvent({ type: 'tool-result', name: call.name, output, failed: true });
        toolOutputs.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output,
        });
      }
    }

    onEvent({ type: 'status', message: `Building and verifying (step ${step + 2})` });
    response = await client.responses.create({
      model,
      instructions,
      previous_response_id: response.id,
      input: toolOutputs,
      tools,
    }, { signal });
  }

  throw new Error(`The agent reached its ${MAX_AGENT_STEPS}-step safety limit.`);
}

module.exports = { executeTool, runAgent, tools };

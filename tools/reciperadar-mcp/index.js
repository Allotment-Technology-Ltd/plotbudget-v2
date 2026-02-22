#!/usr/bin/env node
/**
 * MCP server that exposes one tool: run_reciperadar_bootstrap
 * Runs tools/reciperadar/bootstrap-full.sh (clone, start stack, cron, webhook).
 * Add this server in Cursor: Settings → Tools & MCP → Add MCP server, command: node, args: [absolute path to this index.js]
 * Or use .cursor/mcp.json in the project.
 */
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = new Server(
  { name: 'reciperadar-bootstrap', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'run_reciperadar_bootstrap',
      description: 'Run the RecipeRadar full bootstrap: clone repo if needed, start Docker stack, install monthly cron, start update webhook with generated secret. Use when you want to deploy or (re)configure RecipeRadar with no manual steps.',
      inputSchema: {
        type: 'object',
        properties: {
          repo_path: {
            type: 'string',
            description: 'Path to the plotbudget repo (directory containing tools/reciperadar). If omitted, uses the workspace root or current directory.',
          },
          install_cron: {
            type: 'boolean',
            description: 'Install monthly cron for stack updates (default true).',
            default: true,
          },
          start_webhook: {
            type: 'boolean',
            description: 'Start the update webhook and print GitHub secret values (default true).',
            default: true,
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'run_reciperadar_bootstrap') {
    return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
  }
  const args = request.params.arguments ?? {};
  const repoPath = args.repo_path || process.cwd();
  const installCron = args.install_cron !== false ? '1' : '0';
  const startWebhook = args.start_webhook !== false ? '1' : '0';

  const scriptPath = path.resolve(repoPath, 'tools', 'reciperadar', 'bootstrap-full.sh');

  return new Promise((resolve) => {
    const child = spawn('bash', [scriptPath], {
      cwd: repoPath,
      env: {
        ...process.env,
        INSTALL_CRON: installCron,
        START_WEBHOOK: startWebhook,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      const out = stdout.trim() || '(no output)';
      const err = stderr.trim();
      const text = [
        code === 0 ? 'Bootstrap finished successfully.' : `Bootstrap exited with code ${code}.`,
        '',
        '--- stdout ---',
        out,
        ...(err ? ['', '--- stderr ---', err] : []),
      ].join('\n');
      resolve({
        content: [{ type: 'text', text }],
        isError: code !== 0,
      });
    });
    child.on('error', (err) => {
      resolve({
        content: [{ type: 'text', text: `Failed to run bootstrap: ${err.message}` }],
        isError: true,
      });
    });
  });
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so we don't break the JSON-RPC stream
  console.error('RecipeRadar bootstrap MCP server running on stdio');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

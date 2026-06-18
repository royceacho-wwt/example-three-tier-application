#!/usr/bin/env node

/**
 * MCP Server for codebase utilities
 * Provides slash commands for the Pieces terminal
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { execSync } = require('child_process');
const path = require('path');

const server = new Server(
  {
    name: 'codebase-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'todos',
        description: 'Search for all TODO comments in the codebase',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Optional: filter results by file pattern (e.g., "src/api" or "*.js")',
            },
          },
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'todos') {
    try {
      const repoRoot = process.cwd();
      const filter = args?.filter || '';

      // Build grep command to find TODO comments
      // Searches for TODO, FIXME, HACK, XXX, NOTE patterns
      const patterns = ['TODO', 'FIXME', 'HACK', 'XXX', 'NOTE'];
      const grepPattern = patterns.join('\\|');

      // Exclude common directories
      const excludeDirs = [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'coverage',
        'postgres_data',
      ];

      let command = `grep -rn -E "(${grepPattern})" . `;
      excludeDirs.forEach((dir) => {
        command += `--exclude-dir=${dir} `;
      });

      // Add file filter if provided
      if (filter) {
        command += `--include="${filter}" `;
      }

      command += '2>/dev/null || true';

      const output = execSync(command, {
        cwd: repoRoot,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (!output.trim()) {
        return {
          content: [
            {
              type: 'text',
              text: '✨ No TODOs found in the codebase! Everything is squeaky clean.',
            },
          ],
        };
      }

      // Parse and format the output
      const lines = output.trim().split('\n');
      const grouped = {};

      lines.forEach((line) => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, file, lineNum, content] = match;
          if (!grouped[file]) {
            grouped[file] = [];
          }
          grouped[file].push({ lineNum: parseInt(lineNum), content: content.trim() });
        }
      });

      // Format output
      let result = `📝 Found ${lines.length} TODO(s) across ${Object.keys(grouped).length} file(s)\n\n`;

      Object.entries(grouped).forEach(([file, todos]) => {
        result += `📄 ${file}\n`;
        todos.forEach(({ lineNum, content }) => {
          result += `   Line ${lineNum}: ${content}\n`;
        });
        result += '\n';
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching for TODOs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Codebase Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
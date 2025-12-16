#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "graph-visualizations",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Store graphs for visualization
const graphStore = new Map();
let graphIdCounter = 0;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_graph_visualization",
        description: "Create a graph visualization from a semantic model graph. Returns a URL to view the visualization.",
        inputSchema: {
          type: "object",
          properties: {
            graph: {
              type: "object",
              description: "Graph data with entities and relationships",
              properties: {
                entities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      name: { type: "string" },
                      properties: { type: "object" }
                    },
                    required: ["id", "type", "name"]
                  }
                },
                relationships: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      source: { type: "string" },
                      target: { type: "string" },
                      type: { type: "string" },
                      properties: { type: "object" }
                    },
                    required: ["source", "target", "type"]
                  }
                }
              },
              required: ["entities", "relationships"]
            },
            visualizationType: {
              type: "string",
              enum: ["force-directed", "chord", "heatmap", "tree"],
              description: "Type of visualization to create",
              default: "force-directed"
            },
            title: {
              type: "string",
              description: "Optional title for the visualization"
            }
          },
          required: ["graph"]
        }
      },
      {
        name: "list_visualization_types",
        description: "List all available visualization types and their descriptions",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_visualization_types") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            visualizations: [
              {
                type: "force-directed",
                name: "Force-Directed Graph",
                description: "Interactive network graph with physics simulation. Best for exploring relationships and network structure.",
                bestFor: "General purpose, relationship exploration, network analysis"
              },
              {
                type: "chord",
                name: "Chord Diagram",
                description: "Circular layout showing relationships between entities as connecting arcs. Best for visualizing flow and connections.",
                bestFor: "Relationship density, flow patterns, interconnections"
              },
              {
                type: "heatmap",
                name: "Relationship Heat Map",
                description: "Matrix visualization showing relationship intensity between entity types. Best for pattern recognition.",
                bestFor: "Pattern recognition, relationship density by type, overview analysis"
              },
              {
                type: "tree",
                name: "Hierarchical Tree",
                description: "Tree layout showing hierarchical relationships. Best for organizational structures.",
                bestFor: "Hierarchies, organizational structures, parent-child relationships"
              }
            ]
          }, null, 2)
        }
      ]
    };
  }

  if (name === "create_graph_visualization") {
    const { graph, visualizationType = "force-directed", title = "Graph Visualization" } = args;

    // Validate graph structure
    if (!graph.entities || !Array.isArray(graph.entities)) {
      throw new Error("Graph must contain an entities array");
    }
    if (!graph.relationships || !Array.isArray(graph.relationships)) {
      throw new Error("Graph must contain a relationships array");
    }

    // Store graph data
    const graphId = `graph_${++graphIdCounter}`;
    graphStore.set(graphId, { graph, visualizationType, title, timestamp: Date.now() });

    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}/view?id=${graphId}&type=${visualizationType}`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            graphId: graphId,
            url: url,
            visualizationType: visualizationType,
            title: title,
            stats: {
              entities: graph.entities.length,
              relationships: graph.relationships.length,
              entityTypes: [...new Set(graph.entities.map(e => e.type))],
              relationshipTypes: [...new Set(graph.relationships.map(r => r.type))]
            }
          }, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Export graph store for web server
export { graphStore };

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Graph Visualizations MCP Server running on stdio");
}

main();


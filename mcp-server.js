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
              enum: ["force-directed", "chord", "heatmap", "tree", "swimlane", "sankey"],
              description: "Type of visualization to create. Options: force-directed (network), chord (circular), heatmap (matrix), tree (hierarchical), swimlane (process flows), sankey (flow volume)",
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
        name: "get_graph",
        description: "Retrieve a graph by its ID. Returns the complete graph data including entities and relationships.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: {
              type: "string",
              description: "The ID of the graph to retrieve"
            }
          },
          required: ["graphId"]
        }
      },
      {
        name: "update_graph",
        description: "Update an existing graph visualization with new data or properties.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: {
              type: "string",
              description: "The ID of the graph to update"
            },
            graph: {
              type: "object",
              description: "Updated graph data with entities and relationships",
              properties: {
                entities: { type: "array" },
                relationships: { type: "array" }
              }
            },
            visualizationType: {
              type: "string",
              enum: ["force-directed", "chord", "heatmap", "tree", "swimlane", "sankey"],
              description: "Update the visualization type. Options: force-directed (network), chord (circular), heatmap (matrix), tree (hierarchical), swimlane (process flows), sankey (flow volume)"
            },
            title: {
              type: "string",
              description: "Update the visualization title"
            }
          },
          required: ["graphId"]
        }
      },
      {
        name: "query_graph",
        description: "Query a graph to find specific entities or relationships by type, ID, or other criteria.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: {
              type: "string",
              description: "The ID of the graph to query"
            },
            entityId: {
              type: "string",
              description: "Find a specific entity by ID"
            },
            entityType: {
              type: "string",
              description: "Filter entities by type"
            },
            relationshipType: {
              type: "string",
              description: "Filter relationships by type"
            },
            nodeIds: {
              type: "array",
              items: { type: "string" },
              description: "Get subgraph for specific node IDs"
            }
          },
          required: ["graphId"]
        }
      },
      {
        name: "list_graphs",
        description: "List all stored graphs with their metadata.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "delete_graph",
        description: "Delete a graph by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            graphId: {
              type: "string",
              description: "The ID of the graph to delete"
            }
          },
          required: ["graphId"]
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
              },
              {
                type: "swimlane",
                name: "Swimlane Diagram",
                description: "Process flow visualization with horizontal lanes for different teams/roles. Shows cross-functional workflows and handoffs.",
                bestFor: "Process flows across teams, role-based workflows, responsibility boundaries, cross-team processes"
              },
              {
                type: "sankey",
                name: "Sankey Flow Diagram",
                description: "Flow visualization where connection width represents volume/importance. Excellent for identifying bottlenecks.",
                bestFor: "Process chains, resource flows, value streams, bottleneck identification, flow volume analysis"
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
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    graphStore.set(graphId, { 
      graph, 
      visualizationType, 
      title, 
      timestamp: Date.now(),
      metadata: {
        entityCount: graph.entities.length,
        relationshipCount: graph.relationships.length,
        entityTypes: [...new Set(graph.entities.map(e => e.type))],
        relationshipTypes: [...new Set(graph.relationships.map(r => r.type))]
      }
    });

    const url = `${baseUrl}/view?id=${graphId}&type=${visualizationType}`;

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
            metadata: graphStore.get(graphId).metadata
          }, null, 2)
        }
      ]
    };
  }

  if (name === "get_graph") {
    const { graphId } = args;
    const graphData = graphStore.get(graphId);

    if (!graphData) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            graphId: graphId,
            ...graphData
          }, null, 2)
        }
      ]
    };
  }

  if (name === "update_graph") {
    const { graphId, graph, visualizationType, title } = args;
    const existingGraph = graphStore.get(graphId);

    if (!existingGraph) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    // Validate if graph data is provided
    if (graph && (!graph.entities || !graph.relationships)) {
      throw new Error("Invalid graph format: must contain entities and relationships arrays");
    }

    // Update graph data
    const updatedData = {
      graph: graph || existingGraph.graph,
      visualizationType: visualizationType || existingGraph.visualizationType,
      title: title || existingGraph.title,
      timestamp: Date.now(),
      metadata: graph ? {
        entityCount: graph.entities.length,
        relationshipCount: graph.relationships.length,
        entityTypes: [...new Set(graph.entities.map(e => e.type))],
        relationshipTypes: [...new Set(graph.relationships.map(r => r.type))]
      } : existingGraph.metadata
    };

    graphStore.set(graphId, updatedData);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const url = `${baseUrl}/view?id=${graphId}&type=${updatedData.visualizationType}`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            graphId: graphId,
            url: url,
            message: "Graph updated successfully",
            metadata: updatedData.metadata
          }, null, 2)
        }
      ]
    };
  }

  if (name === "query_graph") {
    const { graphId, entityId, entityType, relationshipType, nodeIds } = args;
    const graphData = graphStore.get(graphId);

    if (!graphData) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    const { graph } = graphData;
    let result = { entities: [], relationships: [] };

    // Query by specific entity ID
    if (entityId) {
      const entity = graph.entities.find(e => e.id === entityId);
      if (entity) {
        result.entities.push(entity);
        result.relationships = graph.relationships.filter(
          r => r.source === entityId || r.target === entityId
        );
      }
    }

    // Query by entity type
    if (entityType) {
      result.entities = graph.entities.filter(e => e.type === entityType);
    }

    // Query by relationship type
    if (relationshipType) {
      result.relationships = graph.relationships.filter(r => r.type === relationshipType);
    }

    // Query by multiple node IDs
    if (nodeIds && Array.isArray(nodeIds)) {
      result.entities = graph.entities.filter(e => nodeIds.includes(e.id));
      result.relationships = graph.relationships.filter(
        r => nodeIds.includes(r.source) && nodeIds.includes(r.target)
      );
    }

    // If no filters provided, return full graph
    if (!entityId && !entityType && !relationshipType && !nodeIds) {
      result = graph;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            graphId: graphId,
            query: { entityId, entityType, relationshipType, nodeIds },
            result: result,
            resultStats: {
              entitiesFound: result.entities.length,
              relationshipsFound: result.relationships.length
            }
          }, null, 2)
        }
      ]
    };
  }

  if (name === "list_graphs") {
    const graphs = Array.from(graphStore.entries()).map(([id, data]) => ({
      graphId: id,
      title: data.title,
      visualizationType: data.visualizationType,
      timestamp: data.timestamp,
      metadata: data.metadata
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            count: graphs.length,
            graphs: graphs
          }, null, 2)
        }
      ]
    };
  }

  if (name === "delete_graph") {
    const { graphId } = args;

    if (!graphStore.has(graphId)) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    graphStore.delete(graphId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Graph ${graphId} deleted successfully`
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


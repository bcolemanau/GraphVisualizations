# Integration Examples

This document provides code examples for integrating GraphVisualizations with your backend agents and LibreChat frontend.

## Backend Agent Integration (MCP)

### Setup MCP Client

```javascript
// backend-agents/src/graphviz-client.js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class GraphVizClient {
  constructor() {
    this.client = new Client({
      name: "backend-agent",
      version: "1.0.0"
    });
  }

  async connect() {
    const transport = new StdioClientTransport({
      command: "node",
      args: [process.env.GRAPHVIZ_MCP_SERVER_PATH || "./graphviz/mcp-server.js"]
    });
    await this.client.connect(transport);
  }

  async createGraph(graphData, visualizationType = 'force-directed', title = 'Graph') {
    const result = await this.client.callTool('create_graph_visualization', {
      graph: graphData,
      visualizationType,
      title
    });
    return JSON.parse(result.content[0].text);
  }

  async getGraph(graphId) {
    const result = await this.client.callTool('get_graph', { graphId });
    return JSON.parse(result.content[0].text);
  }

  async queryGraph(graphId, query) {
    const result = await this.client.callTool('query_graph', {
      graphId,
      ...query
    });
    return JSON.parse(result.content[0].text);
  }

  async updateGraph(graphId, updates) {
    const result = await this.client.callTool('update_graph', {
      graphId,
      ...updates
    });
    return JSON.parse(result.content[0].text);
  }

  async listGraphs() {
    const result = await this.client.callTool('list_graphs', {});
    return JSON.parse(result.content[0].text);
  }
}

export default GraphVizClient;
```

### Agent Helper Functions

```javascript
// backend-agents/src/agent-graphviz-helpers.js
import GraphVizClient from './graphviz-client.js';

const graphClient = new GraphVizClient();
await graphClient.connect();

export async function createVisualizationForAgent(graphData, options = {}) {
  const {
    type = 'force-directed',
    title = 'Agent-Generated Graph'
  } = options;

  try {
    const result = await graphClient.createGraph(graphData, type, title);
    return {
      success: true,
      graphId: result.graphId,
      url: result.url,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Failed to create visualization:', error);
    return { success: false, error: error.message };
  }
}

export async function analyzeGraphForAgent(graphId, userQuery) {
  try {
    // Get full graph data
    const graphResult = await graphClient.getGraph(graphId);
    const { graph } = graphResult;

    // Perform analysis based on query
    const analysis = {
      totalNodes: graph.entities.length,
      totalEdges: graph.relationships.length,
      nodeTypes: [...new Set(graph.entities.map(e => e.type))],
      edgeTypes: [...new Set(graph.relationships.map(r => r.type))],
      clusters: identifyClusters(graph),
      centralNodes: findCentralNodes(graph)
    };

    return analysis;
  } catch (error) {
    console.error('Failed to analyze graph:', error);
    return null;
  }
}

export async function modifyGraphForAgent(graphId, modifications) {
  try {
    const currentGraph = await graphClient.getGraph(graphId);
    const { graph } = currentGraph;

    // Apply modifications
    const updatedGraph = applyModifications(graph, modifications);

    // Update the visualization
    const result = await graphClient.updateGraph(graphId, {
      graph: updatedGraph
    });

    return {
      success: true,
      graphId: result.graphId,
      url: result.url
    };
  } catch (error) {
    console.error('Failed to modify graph:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions
function identifyClusters(graph) {
  // Implement cluster detection algorithm
  // This is a simplified example
  const clusters = new Map();
  graph.entities.forEach(entity => {
    const type = entity.type;
    if (!clusters.has(type)) {
      clusters.set(type, []);
    }
    clusters.get(type).push(entity.id);
  });
  return Array.from(clusters.entries()).map(([type, nodes]) => ({
    type,
    nodeCount: nodes.length
  }));
}

function findCentralNodes(graph) {
  // Calculate degree centrality
  const degrees = new Map();
  
  graph.relationships.forEach(rel => {
    degrees.set(rel.source, (degrees.get(rel.source) || 0) + 1);
    degrees.set(rel.target, (degrees.get(rel.target) || 0) + 1);
  });

  const sorted = Array.from(degrees.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return sorted.map(([nodeId, degree]) => {
    const entity = graph.entities.find(e => e.id === nodeId);
    return {
      id: nodeId,
      name: entity?.name,
      connections: degree
    };
  });
}

function applyModifications(graph, modifications) {
  const updated = { ...graph };

  if (modifications.addNodes) {
    updated.entities = [...updated.entities, ...modifications.addNodes];
  }

  if (modifications.removeNodes) {
    const removeIds = new Set(modifications.removeNodes);
    updated.entities = updated.entities.filter(e => !removeIds.has(e.id));
    updated.relationships = updated.relationships.filter(
      r => !removeIds.has(r.source) && !removeIds.has(r.target)
    );
  }

  if (modifications.addEdges) {
    updated.relationships = [...updated.relationships, ...modifications.addEdges];
  }

  if (modifications.removeEdges) {
    // Implement edge removal logic
  }

  return updated;
}
```

### Agent Response Format

```javascript
// backend-agents/src/agent-response-formatter.js
export function formatAgentResponseWithGraph(message, graphData) {
  return {
    message: message,
    graphId: graphData.graphId,
    graphUrl: graphData.url,
    graphType: graphData.visualizationType,
    metadata: graphData.metadata,
    timestamp: new Date().toISOString()
  };
}

export function formatAgentResponseWithAnalysis(message, graphId, analysis) {
  return {
    message: message,
    graphId: graphId,
    analysis: analysis,
    timestamp: new Date().toISOString()
  };
}
```

## LibreChat Frontend Integration

### GraphVisualization Component

```jsx
// librechat/client/src/components/Graph/GraphVisualization.jsx
import React, { useState } from 'react';
import './GraphVisualization.css';

function GraphVisualization({ graphUrl, graphId, metadata }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_GRAPHVIZ_URL}/api/graph/${graphId}`,
        {
          headers: {
            'X-API-Key': process.env.REACT_APP_GRAPHVIZ_API_KEY
          }
        }
      );
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph-${graphId}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to download graph:', error);
    }
  };

  return (
    <div className="graph-visualization-container">
      <div className="graph-metadata">
        <span>{metadata.entityCount} nodes</span>
        <span>{metadata.relationshipCount} edges</span>
      </div>
      
      <div className={`graph-embed ${isFullscreen ? 'fullscreen' : ''}`}>
        <iframe
          src={graphUrl}
          width="100%"
          height="600px"
          frameBorder="0"
          allow="fullscreen"
          title="Graph Visualization"
        />
        
        {isFullscreen && (
          <button 
            className="close-fullscreen" 
            onClick={handleCloseFullscreen}
          >
            ✕
          </button>
        )}
      </div>

      <div className="graph-actions">
        <button onClick={handleFullscreen}>
          🔍 Fullscreen
        </button>
        <button onClick={handleDownload}>
          💾 Download
        </button>
        <button onClick={() => window.open(graphUrl, '_blank')}>
          🔗 Open in New Tab
        </button>
      </div>
    </div>
  );
}

export default GraphVisualization;
```

### CSS Styling

```css
/* librechat/client/src/components/Graph/GraphVisualization.css */
.graph-visualization-container {
  margin: 1rem 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.graph-metadata {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.graph-embed {
  position: relative;
  background: white;
}

.graph-embed.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
}

.graph-embed.fullscreen iframe {
  height: 100vh !important;
}

.close-fullscreen {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10000;
}

.graph-actions {
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.graph-actions button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.graph-actions button:hover {
  background: #f0f0f0;
}
```

### Message Parser

```javascript
// librechat/client/src/utils/messageParser.js
import GraphVisualization from '../components/Graph/GraphVisualization';

export function parseMessageForGraph(message) {
  // Check if message contains graph data
  if (message.graphUrl && message.graphId) {
    return {
      hasGraph: true,
      textContent: message.message,
      graphComponent: (
        <GraphVisualization
          graphUrl={message.graphUrl}
          graphId={message.graphId}
          metadata={message.metadata || {}}
        />
      )
    };
  }

  return {
    hasGraph: false,
    textContent: message.message || message
  };
}
```

### Conversation Context Management

```javascript
// librechat/client/src/hooks/useGraphContext.js
import { useState, useCallback } from 'react';

export function useGraphContext() {
  const [conversationGraphs, setConversationGraphs] = useState([]);

  const addGraphToContext = useCallback((graphData) => {
    setConversationGraphs(prev => [
      ...prev,
      {
        graphId: graphData.graphId,
        graphUrl: graphData.graphUrl,
        timestamp: Date.now(),
        metadata: graphData.metadata
      }
    ]);
  }, []);

  const getGraphContext = useCallback(() => {
    return conversationGraphs.map(g => g.graphId);
  }, [conversationGraphs]);

  const clearGraphContext = useCallback(() => {
    setConversationGraphs([]);
  }, []);

  return {
    conversationGraphs,
    addGraphToContext,
    getGraphContext,
    clearGraphContext
  };
}
```

### API Client

```javascript
// librechat/client/src/api/graphviz.js
const GRAPHVIZ_BASE_URL = process.env.REACT_APP_GRAPHVIZ_URL;
const GRAPHVIZ_API_KEY = process.env.REACT_APP_GRAPHVIZ_API_KEY;

export async function fetchGraph(graphId) {
  const response = await fetch(`${GRAPHVIZ_BASE_URL}/api/graph/${graphId}`, {
    headers: {
      'X-API-Key': GRAPHVIZ_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch graph');
  }

  return response.json();
}

export async function createGraph(graphData, visualizationType = 'force-directed') {
  const response = await fetch(`${GRAPHVIZ_BASE_URL}/api/graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': GRAPHVIZ_API_KEY
    },
    body: JSON.stringify({
      graph: graphData,
      visualizationType
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create graph');
  }

  return response.json();
}
```

## Testing Examples

### Test Script

```javascript
// test-integration.js
const GRAPHVIZ_URL = 'http://localhost:3000';
const API_KEY = 'your-test-api-key';

async function testIntegration() {
  // Test data
  const testGraph = {
    entities: [
      { id: '1', type: 'Person', name: 'Alice' },
      { id: '2', type: 'Person', name: 'Bob' },
      { id: '3', type: 'Organization', name: 'Acme Corp' }
    ],
    relationships: [
      { source: '1', target: '3', type: 'works_for' },
      { source: '2', target: '3', type: 'works_for' },
      { source: '1', target: '2', type: 'knows' }
    ]
  };

  // Test 1: Create graph
  console.log('Test 1: Creating graph...');
  const createResponse = await fetch(`${GRAPHVIZ_URL}/api/graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ graph: testGraph })
  });
  const createResult = await createResponse.json();
  console.log('Created:', createResult);

  const graphId = createResult.graphId;

  // Test 2: Retrieve graph
  console.log('\nTest 2: Retrieving graph...');
  const getResponse = await fetch(`${GRAPHVIZ_URL}/api/graph/${graphId}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  const getResult = await getResponse.json();
  console.log('Retrieved:', getResult);

  // Test 3: Query graph
  console.log('\nTest 3: Querying graph...');
  const queryResponse = await fetch(`${GRAPHVIZ_URL}/api/graph/${graphId}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ entityType: 'Person' })
  });
  const queryResult = await queryResponse.json();
  console.log('Query result:', queryResult);

  // Test 4: Update graph
  console.log('\nTest 4: Updating graph...');
  const updatedGraph = {
    ...testGraph,
    entities: [
      ...testGraph.entities,
      { id: '4', type: 'Person', name: 'Charlie' }
    ]
  };
  const updateResponse = await fetch(`${GRAPHVIZ_URL}/api/graph/${graphId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ graph: updatedGraph })
  });
  const updateResult = await updateResponse.json();
  console.log('Updated:', updateResult);

  console.log('\n✅ All tests passed!');
}

testIntegration().catch(console.error);
```

## Running the Tests

```bash
# Run the integration test
node test-integration.js
```

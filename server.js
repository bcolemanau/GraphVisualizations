import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory graph store (shared with MCP server when needed)
const graphStore = new Map();
let graphIdCounter = 0;

// Load API keys from environment variable
const validApiKeys = new Set(
  (process.env.API_KEYS || '').split(',').filter(key => key.trim())
);

// API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
  // Skip auth for public routes
  if (req.path === '/' || req.path === '/view' || req.path.startsWith('/public')) {
    return next();
  }

  // Check for API key in header
  const apiKey = req.headers['x-api-key'];
  
  // Allow requests without API key if no keys are configured (development mode)
  if (validApiKeys.size === 0) {
    return next();
  }

  if (!apiKey || !validApiKeys.has(apiKey)) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required' 
    });
  }

  next();
};

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development if ALLOWED_ORIGINS is not set
    if (!process.env.ALLOWED_ORIGINS) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve the main page at root
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Serve the main visualization page
app.get('/view', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Apply API key auth to all /api routes
app.use('/api', apiKeyAuth);

// API endpoint to create/store a graph
app.post('/api/graph', (req, res) => {
  const { graph, visualizationType = 'force-directed', title = 'Graph Visualization' } = req.body;

  if (!graph || !graph.entities || !graph.relationships) {
    return res.status(400).json({ error: 'Invalid graph format' });
  }

  const graphId = `graph_${++graphIdCounter}`;
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  
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

  res.json({
    success: true,
    graphId,
    url: `${baseUrl}/view?id=${graphId}&type=${visualizationType}`,
    metadata: graphStore.get(graphId).metadata
  });
});

// API endpoint to retrieve a graph
app.get('/api/graph/:id', (req, res) => {
  const graphData = graphStore.get(req.params.id);
  
  if (!graphData) {
    return res.status(404).json({ error: 'Graph not found' });
  }

  res.json(graphData);
});

// API endpoint to list all graphs
app.get('/api/graphs', (req, res) => {
  const graphs = Array.from(graphStore.entries()).map(([id, data]) => ({
    graphId: id,
    title: data.title,
    visualizationType: data.visualizationType,
    timestamp: data.timestamp,
    metadata: data.metadata
  }));

  res.json({
    success: true,
    count: graphs.length,
    graphs
  });
});

// API endpoint to update a graph
app.put('/api/graph/:id', (req, res) => {
  const { id } = req.params;
  const existingGraph = graphStore.get(id);
  
  if (!existingGraph) {
    return res.status(404).json({ error: 'Graph not found' });
  }

  const { graph, visualizationType, title } = req.body;

  // Validate if graph data is provided
  if (graph && (!graph.entities || !graph.relationships)) {
    return res.status(400).json({ error: 'Invalid graph format' });
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

  graphStore.set(id, updatedData);
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  res.json({
    success: true,
    graphId: id,
    url: `${baseUrl}/view?id=${id}&type=${updatedData.visualizationType}`,
    metadata: updatedData.metadata
  });
});

// API endpoint to delete a graph
app.delete('/api/graph/:id', (req, res) => {
  const { id } = req.params;
  
  if (!graphStore.has(id)) {
    return res.status(404).json({ error: 'Graph not found' });
  }

  graphStore.delete(id);
  res.json({
    success: true,
    message: 'Graph deleted successfully'
  });
});

// API endpoint to query graph data
app.post('/api/graph/:id/query', (req, res) => {
  const { id } = req.params;
  const graphData = graphStore.get(id);
  
  if (!graphData) {
    return res.status(404).json({ error: 'Graph not found' });
  }

  const { entityId, entityType, relationshipType, nodeIds } = req.body;
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

  res.json({
    success: true,
    graphId: id,
    result
  });
});

app.listen(PORT, () => {
  console.log(`Graph Visualization Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} to use the interactive interface`);
});

export { graphStore };


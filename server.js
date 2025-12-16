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

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve the main page at root
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// API endpoint to create/store a graph
app.post('/api/graph', (req, res) => {
  const { graph, visualizationType = 'force-directed', title = 'Graph Visualization' } = req.body;

  if (!graph || !graph.entities || !graph.relationships) {
    return res.status(400).json({ error: 'Invalid graph format' });
  }

  const graphId = `graph_${++graphIdCounter}`;
  graphStore.set(graphId, { graph, visualizationType, title, timestamp: Date.now() });

  res.json({
    success: true,
    graphId,
    url: `/view?id=${graphId}&type=${visualizationType}`
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

// Serve the main visualization page
app.get('/view', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Graph Visualization Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} to use the interactive interface`);
});

export { graphStore };


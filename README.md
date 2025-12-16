# Graph Visualizations with MCP Integration

A powerful graph visualization service that provides multiple interactive visualization types for semantic model graphs. Includes Model Context Protocol (MCP) integration for seamless agent interaction.

## Features

### 🎨 Multiple Visualization Types

1. **Force-Directed Graph** - Interactive network with physics simulation
   - Best for: General purpose, relationship exploration, network analysis
   - Features: Draggable nodes, zoom/pan, physics-based layout

2. **Chord Diagram** - Circular layout showing relationship flows
   - Best for: Relationship density, flow patterns, interconnections
   - Features: Circular arcs, connection ribbons, hover details

3. **Heat Map** - Matrix visualization of relationship intensity
   - Best for: Pattern recognition, relationship density by type, overview analysis
   - Features: Color-coded intensity, entity type matrix, quick overview

4. **Hierarchical Tree** - Tree layout for hierarchical structures
   - Best for: Organizational structures, parent-child relationships
   - Features: Collapsible nodes, depth visualization, clear hierarchy

### 🤖 MCP Integration

The service exposes two MCP tools for agent integration:

- `create_graph_visualization` - Create visualizations programmatically
- `list_visualization_types` - Get information about available visualization types

## Installation

```bash
# Install dependencies
npm install

# Start the web server
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

## Usage

### Web Interface

1. Open your browser to `http://localhost:3000`
2. Paste your graph JSON or click "Load Example"
3. Select a visualization type
4. Click "Visualize" to render

### Graph Format

Your graph should follow this structure:

```json
{
  "entities": [
    {
      "id": "unique_id",
      "type": "EntityType",
      "name": "Display Name",
      "properties": {
        "key": "value"
      }
    }
  ],
  "relationships": [
    {
      "source": "source_entity_id",
      "target": "target_entity_id",
      "type": "RELATIONSHIP_TYPE",
      "properties": {
        "key": "value"
      }
    }
  ]
}
```

### API Endpoints

**POST /api/graph**
Create a new graph visualization:

```bash
curl -X POST http://localhost:3000/api/graph \
  -H "Content-Type: application/json" \
  -d '{
    "graph": { ... },
    "visualizationType": "force-directed",
    "title": "My Graph"
  }'
```

**GET /api/graph/:id**
Retrieve a stored graph:

```bash
curl http://localhost:3000/api/graph/graph_1
```

## MCP Integration

### Setting Up MCP Server

The MCP server runs on stdio and can be integrated into any MCP-compatible environment.

#### Cursor IDE Configuration

Add to your Cursor settings (`~/.cursor/config/settings.json` or workspace `.cursorrules`):

```json
{
  "mcpServers": {
    "graph-visualizations": {
      "command": "node",
      "args": ["C:/path/to/GraphVisualizations/mcp-server.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

#### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "graph-visualizations": {
      "command": "node",
      "args": ["C:/path/to/GraphVisualizations/mcp-server.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

### Using MCP Tools from Agents

**List available visualization types:**

```
Agent: List available graph visualization types
```

**Create a visualization:**

```
Agent: Create a force-directed graph visualization from this data: [paste graph JSON]
```

The agent will receive a URL like `http://localhost:3000/view?id=graph_1&type=force-directed` that you can open in your browser.

## Example Usage in Agents

### Example 1: Simple Visualization Request

```
User: Visualize this semantic graph showing my company structure
[paste graph JSON]

Agent uses create_graph_visualization tool:
- graph: [parsed JSON]
- visualizationType: "force-directed"
- title: "Company Structure"

Returns: http://localhost:3000/view?id=graph_1&type=force-directed
```

### Example 2: Exploring Different Views

```
User: Show me the same graph as a chord diagram

Agent uses create_graph_visualization tool:
- Same graph data
- visualizationType: "chord"
- title: "Company Structure - Flow View"

Returns: http://localhost:3000/view?id=graph_2&type=chord
```

### Example 3: Comparing Visualizations

```
User: Create heat map and tree visualizations to compare

Agent creates two visualizations with different types,
returns both URLs for comparison
```

## Features & Interactions

### Interactive Controls

- **Zoom & Pan**: Mouse wheel to zoom, click and drag to pan (force-directed, tree)
- **Node Dragging**: Drag nodes to reposition (force-directed)
- **Hover Details**: Hover over nodes and edges for detailed information
- **Reset View**: Reset zoom and pan to default
- **Export SVG**: Download visualization as SVG file

### Visual Encoding

- **Colors**: Entity types are color-coded consistently across visualizations
- **Size**: Nodes maintain consistent sizing for readability
- **Labels**: Entity names and types displayed with truncation for long names
- **Tooltips**: Rich information on hover including all properties

## Graph Statistics

The interface displays real-time statistics:
- Total entities and relationships
- Entity type distribution
- Relationship type distribution
- Type breakdowns

## Technical Details

### Dependencies

- **Express**: Web server
- **D3.js**: Visualization library
- **@modelcontextprotocol/sdk**: MCP integration
- **CORS**: Cross-origin resource sharing

### Architecture

```
├── server.js           # Web server
├── mcp-server.js       # MCP server (stdio)
├── public/
│   ├── index.html      # Main UI
│   ├── styles.css      # Styling
│   ├── app.js          # Main application logic
│   ├── force-directed.js
│   ├── chord.js
│   ├── heatmap.js
│   └── tree.js
└── package.json
```

### Performance

- Handles graphs with hundreds of nodes efficiently
- Optimized rendering with D3.js
- Responsive design for different screen sizes
- In-memory storage for quick access

## Troubleshooting

### MCP Server Not Connecting

1. Ensure the web server is running first: `npm start`
2. Verify the path to `mcp-server.js` in your MCP configuration
3. Check that Node.js is accessible from the command line
4. Ensure PORT environment variable matches between servers

### Visualizations Not Rendering

1. Check browser console for JavaScript errors
2. Verify graph JSON is valid
3. Ensure D3.js CDN is accessible
4. Try refreshing the page

### Graph Not Displaying Correctly

1. Verify graph structure matches the expected format
2. Check that entity IDs in relationships match entity IDs in entities array
3. Ensure there are no circular references (except in force-directed)
4. Try different visualization types to see which works best

## Development

### Adding New Visualizations

1. Create a new JS file in `public/` (e.g., `custom.js`)
2. Implement `renderCustom(graph, container)` function
3. Add visualization option to `index.html`
4. Add case to switch statement in `app.js`
5. Update MCP server's visualization list

### Customizing Styles

Edit `public/styles.css` to customize:
- Color schemes (CSS variables in `:root`)
- Layout and spacing
- Typography
- Component styling

## Example Graphs

The application includes a comprehensive example graph showing:
- Company organizational structure
- Tools and technology stack
- Pain points and opportunities
- Processes and workflows
- Cross-functional relationships

## License

MIT

## Support

For issues, questions, or contributions, please create an issue in the repository.

## Future Enhancements

- [ ] Graph persistence with database
- [ ] Real-time collaborative editing
- [ ] Export to multiple formats (PNG, PDF)
- [ ] Graph filtering and search
- [ ] Custom color schemes
- [ ] Animation controls
- [ ] Graph comparison view
- [ ] Performance metrics overlay
- [ ] WebSocket support for live updates
- [ ] Graph templates library


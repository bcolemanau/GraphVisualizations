# Quick Start Guide

## Getting Started in 3 Steps

### 1. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 2. Open in Browser

Navigate to `http://localhost:3000`

### 3. Visualize!

- Click "Load Example" to see the sample graph
- Select a visualization type (Force-Directed, Chord, Heat Map, or Tree)
- Click "Visualize"

## Using with MCP (Agents)

### For Cursor IDE

1. Make sure the web server is running (`npm start`)

2. Add to your Cursor MCP settings file:

**Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Mac/Linux**: `~/.cursor/mcp-config.json` or in Cursor settings

```json
{
  "mcpServers": {
    "graph-visualizations": {
      "command": "node",
      "args": ["C:/Users/benad/Downloads/User and agent debate/GraphVisualizations/mcp-server.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

3. Restart Cursor

4. In any chat with an agent, try:
   ```
   Create a force-directed visualization of this graph: [paste your graph JSON]
   ```

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "graph-visualizations": {
      "command": "node",
      "args": ["C:/Users/benad/Downloads/User and agent debate/GraphVisualizations/mcp-server.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

## Example Agent Commands

```
"List available graph visualization types"

"Create a chord diagram from this semantic graph: [paste JSON]"

"Visualize this company structure as a hierarchical tree: [paste JSON]"

"Show me a heat map of these entity relationships: [paste JSON]"
```

## Visualization Type Guide

### 🔗 Force-Directed Graph
Best for exploring relationships and network connections
- Drag nodes to reposition
- Zoom with mouse wheel
- Pan by dragging background

### ⭕ Chord Diagram
Best for seeing relationship flows and density
- Hover over arcs for entity details
- Hover over ribbons for connection details
- Great for circular flow visualization

### 🔥 Heat Map
Best for pattern recognition and overview
- Shows relationship density between entity types
- Color intensity indicates connection count
- Quick way to spot patterns

### 🌲 Hierarchical Tree
Best for organizational and hierarchical structures
- Shows parent-child relationships
- Clear depth visualization
- Expandable/collapsible nodes

## Tips

1. **Interactive Controls**: All visualizations support zooming and panning (where applicable)
2. **Tooltips**: Hover over any element to see detailed information
3. **Export**: Click "Export SVG" to save any visualization
4. **Reset**: Click "Reset View" to return to default view
5. **Switch Views**: Change visualization type without re-loading data

## Troubleshooting

**Server won't start?**
- Check if port 3000 is available
- Try `PORT=3001 npm start` to use a different port

**MCP not working?**
- Ensure the web server is running FIRST
- Verify the path in your MCP config is correct
- Restart your IDE/application after updating config

**Visualizations not showing?**
- Check browser console (F12) for errors
- Verify your graph JSON is valid
- Try the example graph first

## Example Graph Structure

```json
{
  "entities": [
    {
      "id": "node1",
      "type": "Type1",
      "name": "Node Name",
      "properties": { "key": "value" }
    }
  ],
  "relationships": [
    {
      "source": "node1",
      "target": "node2",
      "type": "RELATIONSHIP_TYPE",
      "properties": { "key": "value" }
    }
  ]
}
```

## What's Next?

- Experiment with different visualization types
- Try your own graph data
- Use from agents via MCP
- Customize the styles in `public/styles.css`
- Add more visualization types by following the pattern in existing viz files

Enjoy visualizing your semantic graphs! 🎨📊


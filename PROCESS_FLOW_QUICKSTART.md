# Process Flow Visualizations - Quick Start Guide

## Overview
This guide will help you get started with the new process flow visualization features, including swimlane diagrams, Sankey flow diagrams, and advanced filtering capabilities.

## Getting Started

### 1. Start the Server
```bash
npm start
```
Open your browser to `http://localhost:3000`

### 2. Load the Process Flow Example
1. Click the **"Load Example"** button
2. Or manually load the `example-process-flow.json` file
3. Click **"Visualize"** to see the default view

## New Visualization Types

### Swimlane Diagram 🏊
**When to use:** Cross-team processes, showing who does what

**Features:**
- Horizontal lanes for each team
- Sequential process flow from left to right
- Clear ownership and handoffs
- Different shapes for different node types (diamonds for decisions, circles for events)

**Best for:**
- Project lifecycle workflows
- Cross-functional processes
- Identifying handoff points
- Process documentation

**Try it:**
1. Load the process flow example
2. Select "Swimlane" visualization type
3. Observe how processes are organized by team
4. Click nodes to focus on specific parts of the flow

### Sankey Flow Diagram 💧
**When to use:** Visualizing flow volume and identifying bottlenecks

**Features:**
- Connection width represents flow volume/importance
- Clear visualization of splits and merges
- Color-coded by relationship type
- Easy bottleneck identification

**Best for:**
- Resource flow analysis
- Process chains with volume data
- Value stream mapping
- Bottleneck detection

**Try it:**
1. Load the process flow example
2. Select "Sankey" visualization type
3. Notice how connection widths vary based on the `weight` property
4. Thicker connections = more volume/importance

## Using the Filter Panel

### Basic Filtering

**Filter by Entity Type:**
1. After clicking "Visualize", the filter panel appears
2. Check/uncheck entity types (Process, Team, Event, Decision, etc.)
3. The visualization updates in real-time
4. Counts show how many of each type exist

**Search:**
1. Type in the search box at the top of the filter panel
2. Searches across entity names, types, and properties
3. Results update as you type (300ms debounce)
4. Clear the search to see all entities again

**Filter by Relationship Type:**
1. Scroll down to the "Relationship Types" section
2. Check/uncheck relationship types (NEXT_STEP, PERFORMS_PROCESS, etc.)
3. Only selected relationship types will be shown
4. Useful for focusing on specific connection types

### Focus Mode

**What it does:** Highlights a node and its neighborhood

**How to use:**
1. Click any node in the visualization
2. The view automatically focuses on that node and its connected neighbors
3. Use the depth slider (1-3) to control how far out to show connections
   - Depth 1: Direct neighbors only
   - Depth 2: Neighbors + neighbors of neighbors
   - Depth 3: Three hops out
4. Click "Clear Focus" to return to full view

**Use cases:**
- "What connects to this process?"
- "Show me everything related to the Finance team"
- "What are the dependencies of this decision point?"

### Quick View Presets

Pre-configured filter combinations for common views:

**Process Flows Only**
- Shows: Process and Team entities
- Relationships: PERFORMS_PROCESS
- Use for: Clean process flow view

**Team Structure**
- Shows: Company and Team entities
- Relationships: HAS_TEAM
- Use for: Organizational hierarchy

**Pain & Solutions**
- Shows: PainPoint and Opportunity entities
- Relationships: ADDRESSES
- Use for: Problem-solution mapping

**Show All**
- Clears all filters
- Returns to complete graph view

## Process Flow Data Structure

### Required Properties for Best Results

**For Swimlane Diagrams:**
```json
{
  "id": "process_1",
  "type": "Process",
  "name": "Project Initiation",
  "properties": {
    "sequence_order": 1,          // Controls left-to-right ordering
    "owner_team": "team_development",  // Determines which lane
    "duration_days": 5,
    "priority": "high",
    "status": "active"
  }
}
```

**For Sankey Diagrams:**
```json
{
  "source": "process_1",
  "target": "process_2",
  "type": "NEXT_STEP",
  "properties": {
    "weight": 10,     // Controls connection width (volume/importance)
    "value": 100,     // Alternative to weight
    "volume": 50      // Alternative to weight
  }
}
```

### Recommended Entity Types for Process Flows

- **Process**: Main process/activity nodes
- **Event**: Start/end events (shown as circles)
- **Decision**: Decision points (shown as diamonds)
- **Team**: Teams/roles that perform processes
- **PainPoint**: Problems in the process
- **Opportunity**: Improvement opportunities

### Recommended Relationship Types

- **NEXT_STEP**: Sequential process flow
- **PERFORMS_PROCESS**: Team performs a process
- **LEADS_TO_DECISION**: Process leads to decision point
- **IF_YES / IF_NO**: Decision outcomes
- **BLOCKS**: Hard dependency/blocker
- **HAS_PAIN_POINT**: Process has associated problem
- **ADDRESSES**: Solution addresses problem

## Common Workflows

### Workflow 1: Analyze Team Workload
1. Load your process flow data
2. Select "Swimlane" visualization
3. Use "Process Flows Only" preset
4. Visual inspection: Which lanes are most dense?
5. Click a team's lane to focus on their processes

### Workflow 2: Find Bottlenecks
1. Load your process flow data
2. Select "Sankey" visualization
3. Look for narrow connections (low weight/volume)
4. Click narrow connections to see details
5. Check properties for bottleneck information

### Workflow 3: Trace Process Dependencies
1. Load your process flow data
2. Click "Visualize"
3. Click on a specific process node
4. Adjust focus depth to 2 or 3
5. See all upstream and downstream dependencies

### Workflow 4: Document Cross-Team Handoffs
1. Select "Swimlane" visualization
2. Filter to show only Process and Team types
3. Look for connections crossing lane boundaries
4. These are your handoff points
5. Export as SVG for documentation

### Workflow 5: Identify Critical Path
1. Use "Sankey" visualization
2. Filter to show NEXT_STEP relationships only
3. Follow the thickest path through the diagram
4. High-weight connections form your critical path

## Tips & Tricks

### Keyboard Shortcuts (Coming Soon)
- `/` - Focus search bar
- `Esc` - Clear filters
- `F` - Toggle focus mode
- `1-9` - Toggle entity type layers

### Performance Tips
- For large graphs (>100 nodes), use filters to narrow down view first
- Focus mode is faster than rendering entire graph
- Use presets to quickly switch between views

### Visual Customization
- Node colors are consistent across all visualization types
- Entity types have predefined colors (see styles.css)
- Relationship types have predefined colors
- Customize by editing CSS color variables

### Data Quality
- Ensure all relationship sources/targets match entity IDs
- Add `sequence_order` property for better swimlane layouts
- Add `weight`, `value`, or `volume` properties for meaningful Sankey widths
- Use consistent entity types across your graphs

## Example Use Cases

### Solar Energy Development (from example-process-flow.json)
1. **Project Lifecycle View**: Swimlane showing development → construction → operation
2. **Team Coordination**: See how work flows between Development, Interconnection, Finance, Construction teams
3. **Bottleneck Analysis**: Sankey reveals interconnection process as major bottleneck (6 months)
4. **Pain Points**: Filter to see which processes have pain points
5. **Improvement Opportunities**: Trace from pain points to opportunities

### Software Development
- Sprint planning workflow
- Code review process
- Deployment pipeline
- Bug triage process

### Business Operations
- Order fulfillment process
- Customer onboarding
- Approval workflows
- Supply chain flow

### Healthcare
- Patient admission process
- Treatment protocols
- Referral workflows
- Lab test processing

## Troubleshooting

### Swimlane shows all nodes in one lane
**Issue:** Entities don't have `owner_team` property or no Team entities exist
**Solution:** Add Team entities and set `owner_team` property on processes

### Sankey connections all same width
**Issue:** Relationships don't have `weight`, `value`, or `volume` properties
**Solution:** Add numeric properties to relationships indicating flow volume

### Filter panel not showing
**Issue:** Haven't clicked "Visualize" button yet
**Solution:** Click "Visualize" to initialize the filter engine

### Focus mode not working
**Issue:** No node has been clicked
**Solution:** Click any node in the visualization to activate focus mode

### Visualization is empty after filtering
**Issue:** Filters are too restrictive
**Solution:** Click "Clear All" in filter panel to reset

## Next Steps

1. **Review the Design Document** (`PROCESS_FLOW_DESIGN.md`) for advanced features
2. **Experiment** with your own process data
3. **Customize** colors and styles in `styles.css`
4. **Extend** with additional visualization types using the existing patterns

## Support & Feedback

For questions, issues, or feature requests, please create an issue in the repository.

---

*Last Updated: December 17, 2025*

# Process Flow Visualizations - Design Document

## Overview
This document outlines new visualization types and filtering/querying UI approaches specifically designed for process flow knowledge graphs.

## New Visualization Types for Process Flows

### 1. **Sankey Diagram** ⭐ RECOMMENDED
**Best for:** Resource flows, process chains, value streams

**Key Features:**
- Width of connections represents volume/importance/frequency
- Clear visual representation of splits and merges
- Great for showing how work flows between teams
- Ideal for displaying process inputs → process → outputs

**Use Cases:**
- Showing how tasks flow between teams
- Visualizing resource allocation across processes
- Displaying data flows through systems
- Process efficiency analysis (bottleneck identification)

**Implementation Notes:**
- Use D3.js sankey plugin (`d3-sankey`)
- Node properties can indicate process duration or cost
- Relationship properties can show flow volume

### 2. **Swimlane Diagram** ⭐ RECOMMENDED
**Best for:** Cross-functional processes, role-based workflows

**Key Features:**
- Horizontal lanes for different teams/roles
- Sequential flow from left to right
- Clear ownership and handoffs
- Decision points and parallel processes

**Use Cases:**
- Cross-team processes (Development → Interconnection → Finance)
- Showing responsibility boundaries
- Identifying handoff points and dependencies
- Process documentation

**Implementation Notes:**
- Group nodes by team/role property
- Horizontal time-based layout
- Connection arrows show flow direction
- Special markers for decision points

### 3. **Timeline/Gantt Process View**
**Best for:** Temporal processes, scheduling, sequences

**Key Features:**
- Time-based horizontal axis
- Process duration visualization
- Dependencies between processes
- Critical path highlighting

**Use Cases:**
- Project lifecycle visualization
- Process scheduling and planning
- Identifying bottlenecks in time-sequenced workflows
- Milestone tracking

**Implementation Notes:**
- Requires temporal properties (start_date, duration, end_date)
- Can use existing process data with added time dimensions
- D3 time scales for axis

### 4. **Sequential Process Flow (Flowchart Style)**
**Best for:** Step-by-step processes, decision trees

**Key Features:**
- Top-to-bottom or left-to-right flow
- Decision nodes (diamond shapes)
- Process nodes (rectangles)
- Start/End markers
- Loop indicators

**Use Cases:**
- Standard operating procedures
- Decision workflows
- Approval processes
- Quality control processes

**Implementation Notes:**
- Use Dagre layout algorithm for hierarchical positioning
- Support for different node shapes based on type
- Relationship types: NEXT_STEP, IF_YES, IF_NO, LOOP_BACK

### 5. **BPMN-Inspired Process Map**
**Best for:** Complex business processes, professional documentation

**Key Features:**
- Standard BPMN symbols (events, tasks, gateways)
- Pools and lanes for different actors
- Message flows between processes
- Subprocess expansion

**Use Cases:**
- Enterprise process documentation
- Compliance and audit requirements
- Process optimization analysis
- Integration with BPM tools

**Implementation Notes:**
- More complex implementation
- Could be a future enhancement
- Requires expanded entity types (events, gateways, etc.)

### 6. **Dependency Network (Critical Path)**
**Best for:** Process dependencies, bottleneck identification

**Key Features:**
- Highlight critical path in red/bold
- Show parallel process capabilities
- Calculate estimated completion times
- Identify blocking dependencies

**Use Cases:**
- Project planning
- Process optimization
- Risk analysis (what if a process is delayed?)
- Resource allocation planning

---

## Filtering & Querying UI Approaches

### 1. **Multi-Dimensional Filter Panel** ⭐ RECOMMENDED

**Design:**
```
┌─ Filters ─────────────────────┐
│ 🔍 Search: [____________]     │
│                               │
│ 📦 Entity Types               │
│ ☑ Process (12)               │
│ ☑ Team (5)                   │
│ ☐ Tool (3)                   │
│ ☑ PainPoint (4)              │
│ ☐ Opportunity (3)            │
│                               │
│ 🔗 Relationship Types         │
│ ☑ PERFORMS_PROCESS           │
│ ☑ HAS_PAIN_POINT             │
│ ☐ USES_TOOL                  │
│ ☐ ADDRESSES                  │
│                               │
│ 🏷️ Properties                 │
│ Priority: [All ▼]            │
│ Status: [All ▼]              │
│ Team: [All ▼]                │
│                               │
│ [Apply] [Reset] [Save View]  │
└───────────────────────────────┘
```

**Features:**
- Real-time count updates
- Save/load filter presets
- Quick toggle all/none
- Visual feedback on active filters

### 2. **Search Bar with Smart Autocomplete**

**Features:**
- Type-ahead entity/relationship search
- Syntax support: `type:Process`, `team:Development`, `name:contains("tracking")`
- Recent searches dropdown
- Search operators: AND, OR, NOT
- Property-based search: `properties.priority:high`

**Examples:**
```
type:Process AND team:Finance
name:"Interconnection" OR type:Opportunity
properties.cost:>100000
```

### 3. **Path Finder Tool** ⭐ RECOMMENDED

**Design:**
```
🔍 Find Path Between:
  From: [Select Entity ▼] or [Click on graph]
  To:   [Select Entity ▼] or [Click on graph]
  
  Options:
  • Shortest path only
  • All paths (max depth: 5)
  • Specific relationship types: [___________]
  
  [Find Paths] [Clear]
```

**Features:**
- Click two nodes on visualization to find path
- Highlight found paths in different colors
- Show path metrics (length, types, key properties)
- Export paths as list

**Use Cases:**
- "How does PainPoint X connect to Opportunity Y?"
- "What teams are involved in Process Z?"
- "Show all dependencies for this process"

### 4. **Visual Query Builder**

**Design:**
```
┌─ Build Query ─────────────────┐
│ Start with: [Entity Type ▼]  │
│                               │
│ Then find:                    │
│ → [Relationship Type ▼]       │
│ → [Target Entity Type ▼]      │
│                               │
│ [+ Add Step]                  │
│                               │
│ Preview: 23 results           │
│ [Execute Query]               │
└───────────────────────────────┘
```

**Features:**
- Drag-and-drop query construction
- Visual preview of query pattern
- Save queries for reuse
- Export results

**Example Query:**
```
Company → HAS_TEAM → Team → PERFORMS_PROCESS → Process
(Find all processes performed by teams in the company)
```

### 5. **Focus Mode** ⭐ RECOMMENDED

**Features:**
- Click a node to "focus" - dims everything except:
  - The selected node
  - Direct neighbors (1-hop)
  - Optionally: 2-hop or 3-hop neighbors
- Slider to control focus depth
- "Expand from selection" button
- "Hide unrelated" toggle

**UI Controls:**
```
Focus Depth: [•─────] 1-hop
[Expand Selected] [Reset Focus]
```

### 6. **Layer/Category Toggle**

**Design:**
```
Layers:
☑ Organizational (Teams, Company)
☑ Processes
☑ Tools & Systems
☐ Pain Points
☐ Opportunities
```

**Features:**
- Quick show/hide entire categories
- Keyboard shortcuts (1-9 for layers)
- Visual layer indicators (background colors)
- Layer-specific styling

### 7. **Time-Based Filtering** (Future Enhancement)

**For graphs with temporal data:**
```
Timeline: [──────●════●──────]
          Jan    Mar   Jun
          
☐ Show only active processes
☐ Show completed processes
```

### 8. **Property Range Filters**

**For numeric properties:**
```
Cost: [100K] ─●─────────── [1M]
Team Size: [1] ───────────●─ [50]
Priority: Low [●●●●●○○○○○] High
```

### 9. **Breadcrumb Navigation**

**Design:**
```
All Entities > Processes > Finance Processes > Financial Modeling
[<] [Clear All]
```

**Features:**
- Click to go back to previous filter state
- Shows current filtering context
- Easy drill-down and roll-up

### 10. **Saved Views & Presets** ⭐ RECOMMENDED

**Preset Views:**
- "Process Flows Only"
- "Team Structure"
- "Pain Points & Solutions"
- "Tools & Integration"
- "Critical Path"

**Features:**
- Save current filter + visualization type + layout
- Share views via URL
- Export/import view configurations
- Default view selection

---

## Recommended Implementation Priority

### Phase 1: Core Filtering (Week 1)
1. ✅ Multi-dimensional filter panel
2. ✅ Search bar with autocomplete
3. ✅ Focus mode
4. ✅ Saved views/presets

### Phase 2: Process Visualizations (Week 2-3)
1. ✅ Swimlane diagram (highest value for process flows)
2. ✅ Sankey diagram (great for flow analysis)
3. ✅ Sequential process flow

### Phase 3: Advanced Features (Week 4+)
1. ✅ Path finder tool
2. ✅ Visual query builder
3. ✅ Property range filters
4. Timeline/Gantt view (if temporal data is added)

---

## Data Model Enhancements for Process Flows

### Additional Entity Properties
```json
{
  "id": "process_1",
  "type": "Process",
  "name": "Project Status Tracking",
  "properties": {
    // Existing
    "current_method": "Excel",
    
    // New for process flow
    "sequence_order": 1,
    "duration_days": 7,
    "frequency": "weekly",
    "owner_team": "team_development",
    "status": "active",
    "priority": "high",
    "start_event": "project_kickoff",
    "end_event": "status_report_generated",
    "estimated_effort_hours": 40,
    "bottleneck_risk": "medium"
  }
}
```

### Additional Relationship Types
```json
{
  "source": "process_1",
  "target": "process_2",
  "type": "NEXT_STEP",
  "properties": {
    "condition": "approval_received",
    "transition_time_days": 2,
    "success_rate": 0.95
  }
}

{
  "source": "process_1",
  "target": "decision_point_1",
  "type": "LEADS_TO_DECISION",
  "properties": {
    "decision_criteria": "budget_threshold"
  }
}

{
  "source": "process_1",
  "target": "process_3",
  "type": "BLOCKS",
  "properties": {
    "dependency_type": "hard",
    "can_parallel": false
  }
}
```

---

## UI/UX Design Principles

### 1. **Progressive Disclosure**
- Start with simple view, allow drilling down
- Advanced filters hidden behind "Advanced" toggle
- Tooltips and help text for complex features

### 2. **Visual Feedback**
- Real-time filter result counts
- Highlight affected nodes when hovering filters
- Smooth transitions when filtering
- Loading states for complex queries

### 3. **Keyboard Shortcuts**
- `/` - Focus search bar
- `Esc` - Clear filters
- `F` - Toggle focus mode
- `1-9` - Toggle layers
- `Ctrl+S` - Save current view

### 4. **Responsive Design**
- Collapsible filter panel for smaller screens
- Mobile-friendly touch interactions
- Filter panel can be docked left or right

### 5. **Performance Optimization**
- Debounce search input
- Lazy load large graphs
- Virtual scrolling for large filter lists
- Web Workers for complex graph algorithms

---

## Example Use Cases

### Use Case 1: "Show me all processes that Finance team performs"
**Approach:**
1. Open filter panel
2. Check "Process" entity type
3. In properties, select Team: "Finance"
4. OR use search: `type:Process AND team:Finance`

### Use Case 2: "What's the path from a pain point to its solution?"
**Approach:**
1. Click "Path Finder"
2. Select pain point as start
3. Select opportunity as end
4. Filter relationships to "ADDRESSES" type
5. Visualize the solution pathway

### Use Case 3: "Show the approval workflow"
**Approach:**
1. Select "Sequential Process Flow" visualization
2. Filter to show only processes with "approval" in name
3. Focus mode on selected approval process
4. View swimlane diagram to see cross-team handoffs

### Use Case 4: "Identify bottlenecks in our development process"
**Approach:**
1. Select "Sankey Diagram" visualization
2. Filter to "Process" entities
3. Relationship width shows frequency/volume
4. Narrow connections indicate bottlenecks
5. Click bottleneck to see details and connected pain points

---

## Technical Implementation Notes

### Libraries to Add
```json
{
  "dependencies": {
    "d3-sankey": "^0.12.3",
    "dagre": "^0.8.5",
    "dagre-d3": "^0.6.4",
    "fuse.js": "^7.0.0"  // For fuzzy search
  }
}
```

### File Structure
```
public/
  ├── visualizations/
  │   ├── sankey.js
  │   ├── swimlane.js
  │   ├── sequential-flow.js
  │   └── timeline.js
  ├── filters/
  │   ├── filter-panel.js
  │   ├── search.js
  │   ├── path-finder.js
  │   └── focus-mode.js
  └── utils/
      ├── graph-algorithms.js
      ├── filter-engine.js
      └── query-builder.js
```

---

## Success Metrics

### User Experience
- Time to find specific process: < 10 seconds
- Filter application latency: < 300ms
- Visualization render time: < 2 seconds for 100 nodes

### Feature Adoption
- % of users using filters: Target 80%
- Most used visualization types
- Most used filter combinations (inform presets)

### Performance
- Support graphs up to 1000 nodes
- Smooth 60fps animations
- < 100ms search autocomplete response

---

## Future Enhancements

1. **AI-Powered Insights**
   - "Show me inefficient processes"
   - "Find circular dependencies"
   - "Suggest process improvements"

2. **Collaborative Features**
   - Shared views with team
   - Comments on processes
   - Change tracking

3. **Export & Integration**
   - Export to BPMN XML
   - Integration with project management tools
   - API for external queries

4. **Advanced Analytics**
   - Process mining capabilities
   - Bottleneck detection algorithms
   - What-if scenario modeling

---

*Last Updated: December 17, 2025*

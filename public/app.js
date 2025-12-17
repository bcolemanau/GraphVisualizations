// Example graph data
const exampleGraph = {
  "entities": [
    {
      "id": "company_1",
      "type": "Company",
      "name": "Solara Development Partners",
      "properties": {
        "founded": 2018,
        "employees": 45,
        "revenue": "28M",
        "location": "Austin, Texas",
        "states": ["Texas", "Oklahoma", "New Mexico"],
        "project_count": 42,
        "project_size_range": "5-50 MW"
      }
    },
    {
      "id": "team_development",
      "type": "Team",
      "name": "Development Team",
      "properties": {
        "size": 10,
        "roles": ["Project Developers", "Permitting Specialists"]
      }
    },
    {
      "id": "team_interconnection",
      "type": "Team",
      "name": "Interconnection Team",
      "properties": {
        "size": 5,
        "primary_role": "Interconnection Management"
      }
    },
    {
      "id": "team_finance",
      "type": "Team",
      "name": "Finance Team",
      "properties": {
        "size": 3,
        "primary_role": "Financial Modeling and Analysis"
      }
    },
    {
      "id": "team_construction",
      "type": "Team",
      "name": "Construction Team",
      "properties": {
        "size": 8,
        "primary_role": "Construction Project Management"
      }
    },
    {
      "id": "team_asset_mgmt",
      "type": "Team",
      "name": "Asset Management Team",
      "properties": {
        "size": 6,
        "primary_role": "Operating Project Management"
      }
    },
    {
      "id": "tool_sharepoint",
      "type": "Tool",
      "name": "Microsoft SharePoint",
      "properties": {
        "purpose": "Document Management",
        "issues": ["Inconsistent folder structures", "No naming conventions"]
      }
    },
    {
      "id": "tool_excel",
      "type": "Tool",
      "name": "Microsoft Excel",
      "properties": {
        "purpose": "Project Tracking and Financial Modeling",
        "complexity": "47-column master tracker, 15-20 tab financial models"
      }
    },
    {
      "id": "tool_powertrack",
      "type": "Tool",
      "name": "PowerTrack by AlsoEnergy",
      "properties": {
        "purpose": "Asset Monitoring",
        "vendor": "AlsoEnergy"
      }
    },
    {
      "id": "pain_manual_processes",
      "type": "PainPoint",
      "name": "Manual Process Overload",
      "properties": {
        "description": "Everything feels manual, team drowning in documents",
        "source": "CEO"
      }
    },
    {
      "id": "pain_interconnection_penalties",
      "type": "PainPoint",
      "name": "Interconnection Deadline Penalties",
      "properties": {
        "cost": "200K annually",
        "frequency": "Twice this year",
        "impact": "Penalties and delays"
      }
    },
    {
      "id": "pain_document_search",
      "type": "PainPoint",
      "name": "Document Retrieval Inefficiency",
      "properties": {
        "volume": "50-200 documents per project",
        "method": "Manual searching across inconsistent folders"
      }
    },
    {
      "id": "pain_version_conflicts",
      "type": "PainPoint",
      "name": "Data Fragmentation",
      "properties": {
        "cause": "Multiple departmental spreadsheets",
        "impact": "No single source of truth, version conflicts"
      }
    },
    {
      "id": "opportunity_interconnection_automation",
      "type": "Opportunity",
      "name": "Interconnection Deadline Automation",
      "properties": {
        "potential_savings": "200K annually",
        "approach": "Automated email parsing and deadline tracking"
      }
    },
    {
      "id": "opportunity_document_intelligence",
      "type": "Opportunity",
      "name": "Document Intelligence System",
      "properties": {
        "scope": "2100-8400 total documents",
        "approach": "AI-powered extraction and search"
      }
    },
    {
      "id": "opportunity_financial_automation",
      "type": "Opportunity",
      "name": "Financial Model Automation",
      "properties": {
        "current_time": "Days to update assumptions",
        "target_time": "Hours with automation"
      }
    },
    {
      "id": "process_project_tracking",
      "type": "Process",
      "name": "Project Status Tracking",
      "properties": {
        "current_method": "47-column Excel file",
        "frequency": "Weekly status meetings",
        "inefficiency": "Manual spreadsheet reading"
      }
    },
    {
      "id": "process_asset_monitoring",
      "type": "Process",
      "name": "Asset Performance Monitoring",
      "properties": {
        "current_method": "Manual comparison of actual vs expected",
        "scope": "22 operating projects",
        "tools_required": "Weather data, inverter logs, maintenance records"
      }
    },
    {
      "id": "process_financial_modeling",
      "type": "Process",
      "name": "Financial Modeling and Reporting",
      "properties": {
        "model_complexity": "15-20 tabs per project",
        "update_time": "Days for assumption changes",
        "reporting_method": "Manual copy-paste to PowerPoint"
      }
    }
  ],
  "relationships": [
    {
      "source": "company_1",
      "target": "team_development",
      "type": "HAS_TEAM",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "team_interconnection",
      "type": "HAS_TEAM",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "team_finance",
      "type": "HAS_TEAM",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "team_construction",
      "type": "HAS_TEAM",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "team_asset_mgmt",
      "type": "HAS_TEAM",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "tool_sharepoint",
      "type": "USES_TOOL",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "tool_excel",
      "type": "USES_TOOL",
      "properties": {}
    },
    {
      "source": "team_asset_mgmt",
      "target": "tool_powertrack",
      "type": "USES_TOOL",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "pain_manual_processes",
      "type": "HAS_PAIN_POINT",
      "properties": {}
    },
    {
      "source": "team_interconnection",
      "target": "pain_interconnection_penalties",
      "type": "HAS_PAIN_POINT",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "pain_document_search",
      "type": "HAS_PAIN_POINT",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "pain_version_conflicts",
      "type": "HAS_PAIN_POINT",
      "properties": {}
    },
    {
      "source": "pain_interconnection_penalties",
      "target": "opportunity_interconnection_automation",
      "type": "ADDRESSES",
      "properties": {}
    },
    {
      "source": "pain_document_search",
      "target": "opportunity_document_intelligence",
      "type": "ADDRESSES",
      "properties": {}
    },
    {
      "source": "team_finance",
      "target": "opportunity_financial_automation",
      "type": "ADDRESSES",
      "properties": {}
    },
    {
      "source": "company_1",
      "target": "process_project_tracking",
      "type": "PERFORMS_PROCESS",
      "properties": {}
    },
    {
      "source": "team_asset_mgmt",
      "target": "process_asset_monitoring",
      "type": "PERFORMS_PROCESS",
      "properties": {}
    },
    {
      "source": "team_finance",
      "target": "process_financial_modeling",
      "type": "PERFORMS_PROCESS",
      "properties": {}
    },
    {
      "source": "opportunity_interconnection_automation",
      "target": "company_1",
      "type": "ESTIMATED_VALUE",
      "properties": {
        "value": "200K annually"
      }
    }
  ]
};

let currentGraph = null;
let currentVizType = 'force-directed';
let filterPanel = null;

// Initialize global filter engine
window.filterEngine = new FilterEngine();

// DOM elements
const graphInput = document.getElementById('graphInput');
const loadExampleBtn = document.getElementById('loadExample');
const visualizeBtn = document.getElementById('visualizeBtn');
const resetZoomBtn = document.getElementById('resetZoom');
const exportSvgBtn = document.getElementById('exportSvg');
const statsDiv = document.getElementById('stats');
const vizTitle = document.getElementById('vizTitle');

// Load graph from URL parameter if present
const urlParams = new URLSearchParams(window.location.search);
const graphId = urlParams.get('id');
const vizType = urlParams.get('type');

if (graphId) {
    loadGraphFromServer(graphId);
} else {
    // Load example by default
    graphInput.value = JSON.stringify(exampleGraph, null, 2);
}

// Event listeners
loadExampleBtn.addEventListener('click', () => {
    graphInput.value = JSON.stringify(exampleGraph, null, 2);
});

visualizeBtn.addEventListener('click', () => {
    try {
        const graphData = JSON.parse(graphInput.value);
        currentGraph = graphData;
        currentVizType = document.querySelector('input[name="vizType"]:checked').value;
        
        // Set up filter engine with new graph
        window.filterEngine.setGraph(graphData);
        
        // Initialize filter panel
        if (!filterPanel) {
            filterPanel = new FilterPanel('filterPanel', window.filterEngine);
            
            // Listen for filter changes and re-render
            window.filterEngine.onChange((filteredGraph) => {
                renderVisualization(filteredGraph, currentVizType);
            });
        } else {
            filterPanel.render();
            filterPanel.attachEventListeners();
        }
        
        renderVisualization(graphData, currentVizType);
        updateStats(graphData);
    } catch (error) {
        alert('Invalid JSON format. Please check your graph data.');
        console.error(error);
    }
});

resetZoomBtn.addEventListener('click', () => {
    if (currentGraph && currentVizType) {
        renderVisualization(currentGraph, currentVizType);
    }
});

exportSvgBtn.addEventListener('click', () => {
    const svg = document.querySelector('#visualization svg');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-${currentVizType}-${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    }
});

// Visualization type change
document.querySelectorAll('input[name="vizType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (currentGraph) {
            currentVizType = e.target.value;
            // Get filtered graph if filters are active
            const graphToRender = window.filterEngine.originalGraph ? 
                window.filterEngine.applyFilters() : currentGraph;
            renderVisualization(graphToRender, currentVizType);
        }
    });
});

async function loadGraphFromServer(id) {
    try {
        const response = await fetch(`/api/graph/${id}`);
        const data = await response.json();
        currentGraph = data.graph;
        currentVizType = data.visualizationType || vizType || 'force-directed';
        
        graphInput.value = JSON.stringify(data.graph, null, 2);
        document.querySelector(`input[name="vizType"][value="${currentVizType}"]`).checked = true;
        
        renderVisualization(data.graph, currentVizType);
        updateStats(data.graph);
        vizTitle.textContent = data.title || 'Visualization';
    } catch (error) {
        console.error('Error loading graph:', error);
        alert('Could not load graph from server');
    }
}

function renderVisualization(graph, type) {
    const container = document.getElementById('visualization');
    container.innerHTML = '';

    // Update title based on visualization type
    const titles = {
        'force-directed': 'Force-Directed Network',
        'chord': 'Chord Diagram',
        'heatmap': 'Heat Map',
        'tree': 'Hierarchical Tree',
        'swimlane': 'Swimlane Diagram',
        'sankey': 'Sankey Flow Diagram'
    };
    vizTitle.textContent = titles[type] || 'Visualization';

    switch (type) {
        case 'force-directed':
            renderForceDirected(graph, container);
            break;
        case 'chord':
            renderChord(graph, container);
            break;
        case 'heatmap':
            renderHeatmap(graph, container);
            break;
        case 'tree':
            renderTree(graph, container);
            break;
        case 'swimlane':
            renderSwimlane(graph, container);
            break;
        case 'sankey':
            renderSankey(graph, container);
            break;
    }
}

function updateStats(graph) {
    const entityTypes = [...new Set(graph.entities.map(e => e.type))];
    const relationshipTypes = [...new Set(graph.relationships.map(r => r.type))];

    statsDiv.innerHTML = `
        <h3>Graph Statistics</h3>
        <div class="stat-item">
            <span class="stat-label">Entities:</span>
            <span class="stat-value">${graph.entities.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Relationships:</span>
            <span class="stat-value">${graph.relationships.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Entity Types:</span>
            <span class="stat-value">${entityTypes.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Relationship Types:</span>
            <span class="stat-value">${relationshipTypes.length}</span>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <strong style="color: var(--primary);">Entity Types:</strong>
            <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                ${entityTypes.join(', ')}
            </div>
        </div>
        <div style="margin-top: 0.75rem;">
            <strong style="color: var(--primary);">Relationship Types:</strong>
            <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                ${relationshipTypes.join(', ')}
            </div>
        </div>
    `;
}

// Utility function for tooltip
function showTooltip(content, x, y) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = content;
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    tooltip.classList.add('visible');
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('visible');
}



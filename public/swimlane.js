// Swimlane Diagram Visualization
// Shows process flows across different teams/roles in horizontal lanes

function renderSwimlane(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight || 700;
    const margin = { top: 50, right: 50, bottom: 50, left: 150 };

    // Clear container
    container.innerHTML = '';

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Group nodes by team/owner
    const lanes = groupByLanes(graph);
    const laneHeight = (height - margin.top - margin.bottom) / lanes.length;

    // Create sequential layout for processes
    const processLayout = createSequentialLayout(graph, lanes, width - margin.left - margin.right);

    // Draw lanes
    const laneGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    lanes.forEach((lane, i) => {
        const laneY = i * laneHeight;

        // Lane background
        laneGroup.append('rect')
            .attr('x', 0)
            .attr('y', laneY)
            .attr('width', width - margin.left - margin.right)
            .attr('height', laneHeight)
            .attr('fill', i % 2 === 0 ? '#f9f9f9' : '#ffffff')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1);

        // Lane label
        svg.append('text')
            .attr('x', margin.left - 10)
            .attr('y', margin.top + laneY + laneHeight / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('font-weight', 'bold')
            .attr('font-size', '14px')
            .text(lane.name);
    });

    // Draw connections first (so they appear behind nodes)
    const connections = laneGroup.append('g').attr('class', 'connections');
    
    graph.relationships.forEach(rel => {
        const sourceNode = processLayout.find(n => n.id === rel.source);
        const targetNode = processLayout.find(n => n.id === rel.target);
        
        if (sourceNode && targetNode) {
            drawConnection(connections, sourceNode, targetNode, rel);
        }
    });

    // Draw nodes
    const nodes = laneGroup.append('g').attr('class', 'nodes');
    
    processLayout.forEach(node => {
        drawProcessNode(nodes, node);
    });

    // Add legend
    addSwimlaneControls(svg, margin, width);
}

function groupByLanes(graph) {
    const laneMap = new Map();
    
    // Find team entities
    const teams = graph.entities.filter(e => e.type === 'Team');
    
    // Create lanes for each team
    teams.forEach(team => {
        laneMap.set(team.id, {
            id: team.id,
            name: team.name,
            type: 'Team',
            entities: []
        });
    });

    // Add "Other" lane for entities without team
    laneMap.set('_other', {
        id: '_other',
        name: 'Other',
        type: 'Other',
        entities: []
    });

    // Assign entities to lanes
    graph.entities.forEach(entity => {
        // Try to find which team owns this entity
        const owningTeam = graph.relationships.find(rel => 
            rel.source === entity.id && 
            (rel.type === 'PERFORMS_PROCESS' || rel.type === 'USES_TOOL' || rel.type === 'HAS_PAIN_POINT')
        );

        // Or find if a team points to this entity
        const teamRel = graph.relationships.find(rel =>
            rel.target === entity.id &&
            (rel.type === 'PERFORMS_PROCESS' || rel.type === 'USES_TOOL' || rel.type === 'HAS_PAIN_POINT')
        );

        let laneId = '_other';
        if (teamRel && laneMap.has(teamRel.source)) {
            laneId = teamRel.source;
        } else if (entity.properties?.owner_team && laneMap.has(entity.properties.owner_team)) {
            laneId = entity.properties.owner_team;
        }

        const lane = laneMap.get(laneId);
        if (lane) {
            lane.entities.push(entity);
        }
    });

    // Convert to array and filter empty lanes
    return Array.from(laneMap.values()).filter(lane => lane.entities.length > 0);
}

function createSequentialLayout(graph, lanes, width) {
    const layout = [];
    const nodeWidth = 140;
    const nodeHeight = 60;
    const horizontalSpacing = 180;
    const laneHeight = 100;

    lanes.forEach((lane, laneIndex) => {
        // Sort entities by sequence if available, otherwise by ID
        const sortedEntities = lane.entities.sort((a, b) => {
            const seqA = a.properties?.sequence_order || 999;
            const seqB = b.properties?.sequence_order || 999;
            return seqA - seqB;
        });

        sortedEntities.forEach((entity, index) => {
            layout.push({
                ...entity,
                x: 50 + (index * horizontalSpacing),
                y: laneIndex * laneHeight + laneHeight / 2,
                width: nodeWidth,
                height: nodeHeight,
                lane: lane.id
            });
        });
    });

    return layout;
}

function drawProcessNode(container, node) {
    const group = container.append('g')
        .attr('class', 'process-node')
        .attr('transform', `translate(${node.x},${node.y})`);

    // Node shape based on type
    const shape = getNodeShape(node.type);
    
    if (shape === 'diamond') {
        // Decision node
        group.append('path')
            .attr('d', `M 0,-${node.height/2} L ${node.width/2},0 L 0,${node.height/2} L -${node.width/2},0 Z`)
            .attr('fill', getNodeColor(node.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
    } else if (shape === 'circle') {
        // Event node
        group.append('circle')
            .attr('r', node.height / 2)
            .attr('fill', getNodeColor(node.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
    } else {
        // Default rectangle for process
        group.append('rect')
            .attr('x', -node.width / 2)
            .attr('y', -node.height / 2)
            .attr('width', node.width)
            .attr('height', node.height)
            .attr('rx', 8)
            .attr('fill', getNodeColor(node.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
    }

    // Node label
    group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .each(function() {
            wrapText(d3.select(this), node.name, node.width - 10);
        });

    // Node type label
    group.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', node.height / 2 + 15)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(node.type);

    // Add interactivity
    group
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
            d3.select(this).select('rect, circle, path')
                .attr('stroke', '#4CAF50')
                .attr('stroke-width', 3);
            
            showTooltip(getNodeTooltip(node), event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this).select('rect, circle, path')
                .attr('stroke', '#333')
                .attr('stroke-width', 2);
            
            hideTooltip();
        })
        .on('click', function(event) {
            event.stopPropagation();
            if (window.filterEngine) {
                window.filterEngine.setFocusNode(node.id, window.filterEngine.activeFilters.focusDepth);
            }
        });
}

function drawConnection(container, source, target, relationship) {
    const path = container.append('path')
        .attr('class', 'connection')
        .attr('d', createConnectionPath(source, target))
        .attr('fill', 'none')
        .attr('stroke', getRelationshipColor(relationship.type))
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

    // Add arrow marker if not already defined
    if (container.select('#arrowhead').empty()) {
        container.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('refX', 9)
            .attr('refY', 3)
            .attr('orient', 'auto')
            .append('polygon')
            .attr('points', '0 0, 10 3, 0 6')
            .attr('fill', '#666');
    }

    // Add tooltip
    path
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
            d3.select(this)
                .attr('stroke-width', 3)
                .attr('stroke', '#4CAF50');
            
            showTooltip(getRelationshipTooltip(relationship), event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke-width', 2)
                .attr('stroke', getRelationshipColor(relationship.type));
            
            hideTooltip();
        });
}

function createConnectionPath(source, target) {
    const sourceX = source.x + source.width / 2;
    const sourceY = source.y;
    const targetX = target.x - target.width / 2;
    const targetY = target.y;

    // Create curved path
    const midX = (sourceX + targetX) / 2;
    
    if (Math.abs(sourceY - targetY) < 10) {
        // Horizontal connection
        return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    } else {
        // Vertical component - create S-curve
        return `M ${sourceX},${sourceY} 
                C ${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
    }
}

function getNodeShape(type) {
    const shapeMap = {
        'Decision': 'diamond',
        'Event': 'circle',
        'PainPoint': 'circle',
        'Opportunity': 'circle'
    };
    return shapeMap[type] || 'rectangle';
}

function getNodeColor(type) {
    const colorMap = {
        'Process': '#E3F2FD',
        'Team': '#FFF3E0',
        'Tool': '#F3E5F5',
        'PainPoint': '#FFEBEE',
        'Opportunity': '#E8F5E9',
        'Company': '#FFF9C4',
        'Decision': '#FFE0B2'
    };
    return colorMap[type] || '#F5F5F5';
}

function getRelationshipColor(type) {
    const colorMap = {
        'PERFORMS_PROCESS': '#2196F3',
        'NEXT_STEP': '#4CAF50',
        'USES_TOOL': '#9C27B0',
        'HAS_PAIN_POINT': '#F44336',
        'ADDRESSES': '#FF9800',
        'BLOCKS': '#F44336',
        'HAS_TEAM': '#607D8B'
    };
    return colorMap[type] || '#666';
}

function getNodeTooltip(node) {
    let html = `<strong>${node.name}</strong><br/>`;
    html += `<em>${node.type}</em><br/>`;
    
    if (node.properties && Object.keys(node.properties).length > 0) {
        html += '<hr style="margin: 5px 0;"/>';
        Object.entries(node.properties).forEach(([key, value]) => {
            html += `<small><strong>${key}:</strong> ${formatValue(value)}</small><br/>`;
        });
    }
    
    return html;
}

function getRelationshipTooltip(rel) {
    let html = `<strong>${rel.type}</strong><br/>`;
    
    if (rel.properties && Object.keys(rel.properties).length > 0) {
        html += '<hr style="margin: 5px 0;"/>';
        Object.entries(rel.properties).forEach(([key, value]) => {
            html += `<small><strong>${key}:</strong> ${formatValue(value)}</small><br/>`;
        });
    }
    
    return html;
}

function formatValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function wrapText(textElement, text, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let lineNumber = 0;
    const lineHeight = 14;
    const y = textElement.attr('y') || 0;

    textElement.text('');

    words.forEach((word, i) => {
        const testLine = line + word + ' ';
        const testLength = testLine.length * 7; // Approximate character width
        
        if (testLength > maxWidth && i > 0) {
            textElement.append('tspan')
                .attr('x', 0)
                .attr('y', y)
                .attr('dy', `${lineNumber * lineHeight - 7}px`)
                .text(line);
            line = word + ' ';
            lineNumber++;
        } else {
            line = testLine;
        }
    });

    textElement.append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', `${lineNumber * lineHeight - 7}px`)
        .text(line);
}

function addSwimlaneControls(svg, margin, width) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 200}, ${margin.top})`);

    legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .text('Swimlane Diagram');

    legend.append('text')
        .attr('x', 0)
        .attr('y', 20)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text('Click node to focus');
}

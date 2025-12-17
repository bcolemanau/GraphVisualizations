// Sankey Diagram Visualization
// Shows flow between entities with connection width representing strength/volume

function renderSankey(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight || 700;
    const margin = { top: 50, right: 100, bottom: 50, left: 100 };

    // Clear container
    container.innerHTML = '';

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data for Sankey
    const sankeyData = prepareGraphForSankey(graph, width - margin.left - margin.right, height - margin.top - margin.bottom);

    // Create Sankey generator
    const sankey = d3Sankey()
        .nodeWidth(20)
        .nodePadding(20)
        .extent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]]);

    // Check if d3-sankey is available
    if (!d3.sankey) {
        // Fallback to manual implementation if d3-sankey not available
        renderSankeyManual(g, sankeyData, width - margin.left - margin.right, height - margin.top - margin.bottom);
        return;
    }

    // Generate layout
    const { nodes, links } = sankey(sankeyData);

    // Add links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => getRelationshipColorSankey(d.type))
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('fill', 'none')
        .attr('opacity', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 0.8)
                .attr('stroke-width', d => Math.max(2, d.width + 2));
            
            showTooltip(getSankeyLinkTooltip(d), event.pageX, event.pageY);
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .attr('opacity', 0.5)
                .attr('stroke-width', d => Math.max(1, d.width));
            
            hideTooltip();
        });

    // Add nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    node.append('rect')
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => getNodeColorSankey(d.type))
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke', '#4CAF50')
                .attr('stroke-width', 2);
            
            showTooltip(getSankeyNodeTooltip(d), event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke', '#333')
                .attr('stroke-width', 1);
            
            hideTooltip();
        })
        .on('click', function(event, d) {
            event.stopPropagation();
            if (window.filterEngine) {
                window.filterEngine.setFocusNode(d.id, window.filterEngine.activeFilters.focusDepth);
            }
        });

    // Add node labels
    node.append('text')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => truncateText(d.name, 15))
        .style('pointer-events', 'none');

    // Add node type labels
    node.append('text')
        .attr('x', d => (d.x1 - d.x0) < 60 ? (d.x1 - d.x0) + 5 : (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) < 40 ? (d.y1 - d.y0) + 12 : (d.y1 - d.y0) / 2 + 12)
        .attr('text-anchor', d => (d.x1 - d.x0) < 60 ? 'start' : 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#666')
        .text(d => d.type)
        .style('pointer-events', 'none');

    // Add legend
    addSankeyLegend(svg, margin, width, height);
}

function prepareGraphForSankey(graph, width, height) {
    // Create nodes array
    const nodes = graph.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        properties: e.properties
    }));

    // Create links array with weights
    const links = graph.relationships.map(r => {
        // Calculate link weight from properties or default to 1
        let value = 1;
        if (r.properties) {
            value = r.properties.weight || 
                    r.properties.value || 
                    r.properties.volume || 
                    r.properties.frequency || 
                    r.properties.importance || 1;
        }

        // Extract numeric value if string
        if (typeof value === 'string') {
            const match = value.match(/[\d.]+/);
            value = match ? parseFloat(match[0]) : 1;
        }

        return {
            source: r.source,
            target: r.target,
            value: value,
            type: r.type,
            properties: r.properties
        };
    });

    return { nodes, links };
}

// Fallback manual implementation
function renderSankeyManual(container, data, width, height) {
    // Simple column-based layout
    const nodeMap = new Map(data.nodes.map(n => [n.id, { ...n, sourceLinks: [], targetLinks: [] }]));
    
    // Build link references
    data.links.forEach(link => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (source && target) {
            source.sourceLinks.push({ ...link, source, target });
            target.targetLinks.push({ ...link, source, target });
        }
    });

    // Assign layers (simple approach: based on dependency depth)
    const layers = assignLayers(nodeMap, data.links);
    const numLayers = Math.max(...layers.values()) + 1;
    const layerWidth = width / (numLayers + 1);
    const nodeWidth = 20;

    // Position nodes
    layers.forEach((layer, nodeId) => {
        const node = nodeMap.get(nodeId);
        const nodesInLayer = Array.from(layers.entries()).filter(([_, l]) => l === layer).length;
        const nodeIndex = Array.from(layers.entries())
            .filter(([_, l]) => l === layer)
            .findIndex(([id]) => id === nodeId);
        
        node.x0 = layerWidth * (layer + 1);
        node.x1 = node.x0 + nodeWidth;
        node.y0 = (height / (nodesInLayer + 1)) * (nodeIndex + 1) - 30;
        node.y1 = node.y0 + 60;
    });

    // Draw links
    const linksGroup = container.append('g').attr('class', 'links');
    nodeMap.forEach(source => {
        source.sourceLinks.forEach(link => {
            const path = linksGroup.append('path')
                .attr('d', createSankeyPath(link))
                .attr('fill', 'none')
                .attr('stroke', getRelationshipColorSankey(link.type))
                .attr('stroke-width', Math.max(2, link.value * 2))
                .attr('opacity', 0.5)
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 0.8);
                    showTooltip(getSankeyLinkTooltip(link), event.pageX, event.pageY);
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.5);
                    hideTooltip();
                });
        });
    });

    // Draw nodes
    const nodesGroup = container.append('g').attr('class', 'nodes');
    nodeMap.forEach(node => {
        const nodeGroup = nodesGroup.append('g')
            .attr('transform', `translate(${node.x0},${node.y0})`);

        nodeGroup.append('rect')
            .attr('width', node.x1 - node.x0)
            .attr('height', node.y1 - node.y0)
            .attr('fill', getNodeColorSankey(node.type))
            .attr('stroke', '#333')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event) {
                d3.select(this).attr('stroke', '#4CAF50').attr('stroke-width', 2);
                showTooltip(getSankeyNodeTooltip(node), event.pageX, event.pageY);
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 1);
                hideTooltip();
            })
            .on('click', function(event) {
                event.stopPropagation();
                if (window.filterEngine) {
                    window.filterEngine.setFocusNode(node.id, window.filterEngine.activeFilters.focusDepth);
                }
            });

        // Node label
        nodeGroup.append('text')
            .attr('x', (node.x1 - node.x0) / 2)
            .attr('y', (node.y1 - node.y0) / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text(truncateText(node.name, 12));
    });
}

function assignLayers(nodeMap, links) {
    const layers = new Map();
    const visited = new Set();

    // Find root nodes (no incoming links)
    const rootNodes = Array.from(nodeMap.keys()).filter(id => {
        return !links.some(link => link.target === id);
    });

    // BFS to assign layers
    const queue = rootNodes.map(id => ({ id, layer: 0 }));
    
    while (queue.length > 0) {
        const { id, layer } = queue.shift();
        
        if (visited.has(id)) continue;
        visited.add(id);
        layers.set(id, layer);

        // Add children
        links.forEach(link => {
            if (link.source === id && !visited.has(link.target)) {
                queue.push({ id: link.target, layer: layer + 1 });
            }
        });
    }

    // Assign remaining unvisited nodes
    nodeMap.forEach((_, id) => {
        if (!layers.has(id)) {
            layers.set(id, 0);
        }
    });

    return layers;
}

function createSankeyPath(link) {
    const { source, target } = link;
    const x0 = source.x1;
    const x1 = target.x0;
    const y0 = (source.y0 + source.y1) / 2;
    const y1 = (target.y0 + target.y1) / 2;
    const xi = d3.interpolateNumber(x0, x1);
    const x2 = xi(0.5);
    const x3 = xi(0.5);
    
    return `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}`;
}

function getNodeColorSankey(type) {
    const colorMap = {
        'Process': '#64B5F6',
        'Team': '#FFB74D',
        'Tool': '#BA68C8',
        'PainPoint': '#E57373',
        'Opportunity': '#81C784',
        'Company': '#FFF176',
        'Decision': '#FFD54F'
    };
    return colorMap[type] || '#BDBDBD';
}

function getRelationshipColorSankey(type) {
    const colorMap = {
        'PERFORMS_PROCESS': '#2196F3',
        'NEXT_STEP': '#4CAF50',
        'USES_TOOL': '#9C27B0',
        'HAS_PAIN_POINT': '#F44336',
        'ADDRESSES': '#FF9800',
        'BLOCKS': '#F44336',
        'HAS_TEAM': '#607D8B',
        'ESTIMATED_VALUE': '#4CAF50'
    };
    return colorMap[type] || '#999';
}

function getSankeyNodeTooltip(node) {
    let html = `<strong>${node.name}</strong><br/>`;
    html += `<em>${node.type}</em><br/>`;
    
    if (node.properties && Object.keys(node.properties).length > 0) {
        html += '<hr style="margin: 5px 0;"/>';
        const props = Object.entries(node.properties).slice(0, 5);
        props.forEach(([key, value]) => {
            html += `<small><strong>${key}:</strong> ${formatValueSankey(value)}</small><br/>`;
        });
        if (Object.keys(node.properties).length > 5) {
            html += '<small><em>...</em></small>';
        }
    }
    
    return html;
}

function getSankeyLinkTooltip(link) {
    let html = `<strong>${link.type}</strong><br/>`;
    html += `<small>Value: ${link.value}</small><br/>`;
    
    if (link.properties && Object.keys(link.properties).length > 0) {
        html += '<hr style="margin: 5px 0;"/>';
        Object.entries(link.properties).forEach(([key, value]) => {
            html += `<small><strong>${key}:</strong> ${formatValueSankey(value)}</small><br/>`;
        });
    }
    
    return html;
}

function formatValueSankey(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function addSankeyLegend(svg, margin, width, height) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 180}, ${margin.top})`);

    legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .text('Sankey Flow Diagram');

    legend.append('text')
        .attr('x', 0)
        .attr('y', 20)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text('Width = flow volume');

    legend.append('text')
        .attr('x', 0)
        .attr('y', 35)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text('Click node to focus');
}

// Simple d3-sankey compatibility function
function d3Sankey() {
    let nodeWidth = 24;
    let nodePadding = 8;
    let extent = [[0, 0], [1, 1]];

    function sankey(graph) {
        // This is a simplified version - in production, use d3-sankey library
        return graph;
    }

    sankey.nodeWidth = function(_) {
        return arguments.length ? (nodeWidth = +_, sankey) : nodeWidth;
    };

    sankey.nodePadding = function(_) {
        return arguments.length ? (nodePadding = +_, sankey) : nodePadding;
    };

    sankey.extent = function(_) {
        return arguments.length ? (extent = _, sankey) : extent;
    };

    return sankey;
}

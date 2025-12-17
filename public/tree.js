function renderTree(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Find root node (node with no incoming edges or most connections)
    const incomingCounts = new Map();
    const outgoingCounts = new Map();
    
    graph.entities.forEach(e => {
        incomingCounts.set(e.id, 0);
        outgoingCounts.set(e.id, 0);
    });

    graph.relationships.forEach(r => {
        incomingCounts.set(r.target, (incomingCounts.get(r.target) || 0) + 1);
        outgoingCounts.set(r.source, (outgoingCounts.get(r.source) || 0) + 1);
    });

    // Find root: entity with no incoming connections or most outgoing connections
    let rootId = graph.entities[0].id;
    let maxOutgoing = -1;
    let minIncoming = Infinity;

    graph.entities.forEach(e => {
        const incoming = incomingCounts.get(e.id);
        const outgoing = outgoingCounts.get(e.id);
        
        if (incoming === 0 && outgoing > maxOutgoing) {
            rootId = e.id;
            maxOutgoing = outgoing;
        } else if (incoming < minIncoming) {
            rootId = e.id;
            minIncoming = incoming;
        }
    });

    // Build tree structure
    function buildTree(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return null;
        visited.add(nodeId);

        const entity = graph.entities.find(e => e.id === nodeId);
        if (!entity) return null;

        const children = graph.relationships
            .filter(r => r.source === nodeId)
            .map(r => buildTree(r.target, visited))
            .filter(child => child !== null);

        return {
            ...entity,
            children: children.length > 0 ? children : undefined
        };
    }

    const treeData = buildTree(rootId);

    if (!treeData) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8;">No hierarchical structure found in graph</div>';
        return;
    }

    // Create color scale
    const entityTypes = [...new Set(graph.entities.map(e => e.type))];
    const colorScale = d3.scaleOrdinal()
        .domain(entityTypes)
        .range(d3.schemeCategory10);

    // Create SVG
    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${50})`);

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            g.attr('transform', `translate(${event.transform.x + width / 2},${event.transform.y + 50}) scale(${event.transform.k})`);
        });

    svg.call(zoom);

    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 200, height - 150])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Center the tree
    const minX = d3.min(root.descendants(), d => d.x);
    const maxX = d3.max(root.descendants(), d => d.x);
    const treeWidth = maxX - minX;
    const offsetX = -treeWidth / 2;

    // Create links
    const link = g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#475569')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 2)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d3.linkVertical()
            .x(d => d.x + offsetX)
            .y(d => d.y));

    // Create nodes
    const node = g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.x + offsetX},${d.y})`);

    // Add circles
    node.append('circle')
        .attr('r', 20)
        .attr('fill', d => colorScale(d.data.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 25)
                .attr('stroke-width', 4);

            const props = Object.entries(d.data.properties || {})
                .slice(0, 3)
                .map(([key, value]) => {
                    const val = Array.isArray(value) ? value.join(', ') : value;
                    return `<p><span class="property">${key}:</span> <span class="value">${val}</span></p>`;
                })
                .join('');

            const childCount = d.children ? d.children.length : 0;
            const content = `
                <h4>${d.data.name}</h4>
                <p><span class="property">Type:</span> <span class="value">${d.data.type}</span></p>
                <p><span class="property">Children:</span> <span class="value">${childCount}</span></p>
                <p><span class="property">Depth:</span> <span class="value">${d.depth}</span></p>
                ${props}
            `;
            
            showTooltip(content, event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 20)
                .attr('stroke-width', 3);
            hideTooltip();
        })
        .on('click', function(event, d) {
            // Toggle children on click
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        });

    // Add type icon/initial
    node.append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .text(d => d.data.type.substring(0, 1));

    // Add labels below nodes
    node.append('text')
        .attr('dy', '2.5em')
        .attr('text-anchor', 'middle')
        .style('fill', '#f1f5f9')
        .style('font-size', '11px')
        .style('pointer-events', 'none')
        .text(d => {
            const name = d.data.name;
            return name.length > 20 ? name.substring(0, 17) + '...' : name;
        });

    // Add type label
    node.append('text')
        .attr('dy', '3.7em')
        .attr('text-anchor', 'middle')
        .style('fill', '#94a3b8')
        .style('font-size', '9px')
        .style('pointer-events', 'none')
        .text(d => d.data.type);

    // Update function for collapsing/expanding
    function update(source) {
        const duration = 300;
        const nodes = root.descendants();
        const links = root.links();

        treeLayout(root);

        // Update nodes
        const nodeUpdate = g.selectAll('g.tree-node')
            .data(nodes, d => d.id || (d.id = ++i));

        // Update links
        g.selectAll('path.tree-link')
            .data(links, d => d.target.id)
            .transition()
            .duration(duration)
            .attr('d', d3.linkVertical()
                .x(d => d.x + offsetX)
                .y(d => d.y));
    }

    let i = 0;

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - 100})`);

    legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#f1f5f9')
        .text('Entity Types:');

    entityTypes.forEach((type, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${(i + 1) * 25})`);

        legendRow.append('circle')
            .attr('cx', 10)
            .attr('cy', 0)
            .attr('r', 8)
            .attr('fill', colorScale(type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 5)
            .style('font-size', '12px')
            .style('fill', '#f1f5f9')
            .text(type);
    });

    container.appendChild(svg.node());
}



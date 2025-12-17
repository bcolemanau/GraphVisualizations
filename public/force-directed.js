function renderForceDirected(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create color scale for entity types
    const entityTypes = [...new Set(graph.entities.map(e => e.type))];
    const colorScale = d3.scaleOrdinal()
        .domain(entityTypes)
        .range(d3.schemeCategory10);

    // Create SVG
    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    // Create a group for zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Create links
    const links = graph.relationships.map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        properties: r.properties
    }));

    // Create nodes
    const nodes = graph.entities.map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        properties: e.properties,
        ...e
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

    // Add arrow markers for directed edges
    svg.append('defs').selectAll('marker')
        .data(entityTypes)
        .join('marker')
        .attr('id', d => `arrow-${d.replace(/\s+/g, '-')}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', d => colorScale(d))
        .attr('d', 'M0,-5L10,0L0,5');

    // Create links
    const link = g.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('class', 'link')
        .attr('stroke', d => {
            const sourceNode = nodes.find(n => n.id === d.source.id || n.id === d.source);
            return sourceNode ? colorScale(sourceNode.type) : '#94a3b8';
        })
        .attr('marker-end', d => {
            const sourceNode = nodes.find(n => n.id === d.source.id || n.id === d.source);
            return sourceNode ? `url(#arrow-${sourceNode.type.replace(/\s+/g, '-')})` : null;
        });

    // Create link labels
    const linkLabel = g.append('g')
        .selectAll('text')
        .data(links)
        .join('text')
        .attr('class', 'link-label')
        .attr('text-anchor', 'middle')
        .text(d => d.type);

    // Create nodes
    const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .call(drag(simulation));

    // Add circles to nodes
    node.append('circle')
        .attr('r', 15)
        .attr('fill', d => colorScale(d.type))
        .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 20);
            
            const props = Object.entries(d.properties || {})
                .map(([key, value]) => {
                    const val = Array.isArray(value) ? value.join(', ') : value;
                    return `<p><span class="property">${key}:</span> <span class="value">${val}</span></p>`;
                })
                .join('');

            const content = `
                <h4>${d.name}</h4>
                <p><span class="property">Type:</span> <span class="value">${d.type}</span></p>
                ${props}
            `;
            
            showTooltip(content, event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this).attr('r', 15);
            hideTooltip();
        });

    // Add labels to nodes
    node.append('text')
        .attr('dy', 30)
        .text(d => {
            // Truncate long names
            return d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name;
        });

    // Update positions on simulation tick
    simulation.on('tick', () => {
        link.attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        linkLabel
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag behavior
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    container.appendChild(svg.node());
}



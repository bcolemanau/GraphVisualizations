function renderHeatmap(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Get entity types
    const entityTypes = [...new Set(graph.entities.map(e => e.type))];
    const relationshipTypes = [...new Set(graph.relationships.map(r => r.type))];

    // Create matrix: entity type -> entity type with relationship counts
    const matrix = {};
    entityTypes.forEach(source => {
        matrix[source] = {};
        entityTypes.forEach(target => {
            matrix[source][target] = { count: 0, types: new Set() };
        });
    });

    // Fill matrix
    graph.relationships.forEach(rel => {
        const sourceEntity = graph.entities.find(e => e.id === rel.source);
        const targetEntity = graph.entities.find(e => e.id === rel.target);
        
        if (sourceEntity && targetEntity) {
            matrix[sourceEntity.type][targetEntity.type].count++;
            matrix[sourceEntity.type][targetEntity.type].types.add(rel.type);
        }
    });

    // Calculate cell dimensions
    const margin = { top: 100, right: 50, bottom: 50, left: 120 };
    const cellWidth = (width - margin.left - margin.right) / entityTypes.length;
    const cellHeight = (height - margin.top - margin.bottom) / entityTypes.length;

    // Create color scale
    const maxCount = Math.max(...entityTypes.flatMap(source => 
        entityTypes.map(target => matrix[source][target].count)
    ));

    const colorScale = d3.scaleSequential()
        .domain([0, maxCount])
        .interpolator(d3.interpolateBlues);

    // Create SVG
    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('fill', '#f1f5f9')
        .text('Relationship Heat Map');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#94a3b8')
        .text('Entity Type Connections');

    // Add row labels (source types)
    g.append('g')
        .selectAll('text')
        .data(entityTypes)
        .join('text')
        .attr('x', -10)
        .attr('y', (d, i) => i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', '#f1f5f9')
        .style('font-weight', '600')
        .text(d => d);

    // Add column labels (target types)
    g.append('g')
        .selectAll('text')
        .data(entityTypes)
        .join('text')
        .attr('x', (d, i) => i * cellWidth + cellWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('transform', (d, i) => `rotate(-45, ${i * cellWidth + cellWidth / 2}, -10)`)
        .style('font-size', '12px')
        .style('fill', '#f1f5f9')
        .style('font-weight', '600')
        .text(d => d);

    // Create cells
    entityTypes.forEach((sourceType, i) => {
        entityTypes.forEach((targetType, j) => {
            const cell = matrix[sourceType][targetType];
            
            const cellGroup = g.append('g')
                .attr('transform', `translate(${j * cellWidth},${i * cellHeight})`);

            const rect = cellGroup.append('rect')
                .attr('width', cellWidth - 2)
                .attr('height', cellHeight - 2)
                .attr('fill', cell.count > 0 ? colorScale(cell.count) : '#1e293b')
                .attr('stroke', '#475569')
                .attr('stroke-width', 1)
                .attr('rx', 4)
                .style('cursor', cell.count > 0 ? 'pointer' : 'default')
                .on('mouseover', function(event) {
                    if (cell.count > 0) {
                        d3.select(this)
                            .attr('stroke', '#6366f1')
                            .attr('stroke-width', 3);

                        const types = Array.from(cell.types).join(', ');
                        const content = `
                            <h4>${sourceType} → ${targetType}</h4>
                            <p><span class="property">Connections:</span> <span class="value">${cell.count}</span></p>
                            <p><span class="property">Types:</span> <span class="value">${types}</span></p>
                        `;
                        
                        showTooltip(content, event.pageX, event.pageY);
                    }
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .attr('stroke', '#475569')
                        .attr('stroke-width', 1);
                    hideTooltip();
                });

            // Add count text if > 0
            if (cell.count > 0) {
                cellGroup.append('text')
                    .attr('x', cellWidth / 2)
                    .attr('y', cellHeight / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .style('font-size', '14px')
                    .style('font-weight', 'bold')
                    .style('fill', cell.count > maxCount / 2 ? '#ffffff' : '#f1f5f9')
                    .style('pointer-events', 'none')
                    .text(cell.count);
            }
        });
    });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - margin.right - legendWidth - 20;
    const legendY = height - margin.bottom - legendHeight - 10;

    const legendScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => Math.round(d));

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient');

    linearGradient.selectAll('stop')
        .data(d3.range(0, 1.01, 0.01))
        .join('stop')
        .attr('offset', d => `${d * 100}%`)
        .attr('stop-color', d => colorScale(d * maxCount));

    const legend = svg.append('g')
        .attr('transform', `translate(${legendX},${legendY})`);

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)')
        .attr('stroke', '#475569');

    legend.append('g')
        .attr('transform', `translate(0,${legendHeight})`)
        .call(legendAxis)
        .style('font-size', '10px')
        .style('color', '#f1f5f9');

    legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#94a3b8')
        .text('Connection Count');

    container.appendChild(svg.node());
}


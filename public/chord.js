function renderChord(graph, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const outerRadius = Math.min(width, height) * 0.4;
    const innerRadius = outerRadius - 30;

    // Create entity index
    const entities = graph.entities;
    const entityIndex = new Map(entities.map((e, i) => [e.id, i]));

    // Create matrix for chord diagram
    const matrix = Array(entities.length).fill(0).map(() => Array(entities.length).fill(0));

    graph.relationships.forEach(rel => {
        const sourceIdx = entityIndex.get(rel.source);
        const targetIdx = entityIndex.get(rel.target);
        if (sourceIdx !== undefined && targetIdx !== undefined) {
            matrix[sourceIdx][targetIdx] += 1;
            // Make it bidirectional for better visualization
            matrix[targetIdx][sourceIdx] += 0.5;
        }
    });

    // Create color scale
    const entityTypes = [...new Set(entities.map(e => e.type))];
    const colorScale = d3.scaleOrdinal()
        .domain(entityTypes)
        .range(d3.schemeCategory10);

    // Create SVG
    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create chord layout
    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
        .radius(innerRadius);

    const chords = chord(matrix);

    // Add groups (outer arcs)
    const group = g.append('g')
        .selectAll('g')
        .data(chords.groups)
        .join('g');

    group.append('path')
        .attr('fill', d => colorScale(entities[d.index].type))
        .attr('stroke', d => d3.rgb(colorScale(entities[d.index].type)).darker())
        .attr('d', arc)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke-width', 3);

            const entity = entities[d.index];
            const connections = graph.relationships.filter(
                r => r.source === entity.id || r.target === entity.id
            ).length;

            const props = Object.entries(entity.properties || {})
                .slice(0, 3)
                .map(([key, value]) => {
                    const val = Array.isArray(value) ? value.join(', ') : value;
                    return `<p><span class="property">${key}:</span> <span class="value">${val}</span></p>`;
                })
                .join('');

            const content = `
                <h4>${entity.name}</h4>
                <p><span class="property">Type:</span> <span class="value">${entity.type}</span></p>
                <p><span class="property">Connections:</span> <span class="value">${connections}</span></p>
                ${props}
            `;
            
            showTooltip(content, event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke-width', 1);
            hideTooltip();
        });

    // Add labels
    group.append('text')
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr('dy', '.35em')
        .attr('transform', d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? 'rotate(180)' : ''}
        `)
        .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
        .text(d => {
            const name = entities[d.index].name;
            return name.length > 15 ? name.substring(0, 12) + '...' : name;
        })
        .style('font-size', '11px')
        .style('fill', '#f1f5f9');

    // Add ribbons (connections)
    g.append('g')
        .attr('fill-opacity', 0.67)
        .selectAll('path')
        .data(chords)
        .join('path')
        .attr('d', ribbon)
        .attr('fill', d => colorScale(entities[d.source.index].type))
        .attr('stroke', d => d3.rgb(colorScale(entities[d.source.index].type)).darker())
        .on('mouseover', function(event, d) {
            d3.select(this).attr('fill-opacity', 0.9);

            const sourceEntity = entities[d.source.index];
            const targetEntity = entities[d.target.index];
            const relationship = graph.relationships.find(
                r => (r.source === sourceEntity.id && r.target === targetEntity.id) ||
                     (r.target === sourceEntity.id && r.source === targetEntity.id)
            );

            const content = `
                <h4>Connection</h4>
                <p><span class="property">From:</span> <span class="value">${sourceEntity.name}</span></p>
                <p><span class="property">To:</span> <span class="value">${targetEntity.name}</span></p>
                <p><span class="property">Type:</span> <span class="value">${relationship?.type || 'Unknown'}</span></p>
            `;
            
            showTooltip(content, event.pageX, event.pageY);
        })
        .on('mouseout', function() {
            d3.select(this).attr('fill-opacity', 0.67);
            hideTooltip();
        });

    // Add title
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#6366f1')
        .text('Relationship Flow');

    container.appendChild(svg.node());
}


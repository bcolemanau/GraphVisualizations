// Filter Engine for Graph Visualizations

class FilterEngine {
    constructor() {
        this.activeFilters = {
            entityTypes: new Set(),
            relationshipTypes: new Set(),
            searchText: '',
            properties: {},
            focusNode: null,
            focusDepth: 1
        };
        this.originalGraph = null;
        this.callbacks = [];
    }

    // Set the original graph data
    setGraph(graph) {
        this.originalGraph = graph;
    }

    // Register callback for filter changes
    onChange(callback) {
        this.callbacks.push(callback);
    }

    // Trigger all callbacks
    notifyChange() {
        const filtered = this.applyFilters();
        this.callbacks.forEach(cb => cb(filtered));
    }

    // Set entity type filters
    setEntityTypeFilter(types) {
        this.activeFilters.entityTypes = new Set(types);
        this.notifyChange();
    }

    // Toggle entity type
    toggleEntityType(type) {
        if (this.activeFilters.entityTypes.has(type)) {
            this.activeFilters.entityTypes.delete(type);
        } else {
            this.activeFilters.entityTypes.add(type);
        }
        this.notifyChange();
    }

    // Set relationship type filters
    setRelationshipTypeFilter(types) {
        this.activeFilters.relationshipTypes = new Set(types);
        this.notifyChange();
    }

    // Toggle relationship type
    toggleRelationshipType(type) {
        if (this.activeFilters.relationshipTypes.has(type)) {
            this.activeFilters.relationshipTypes.delete(type);
        } else {
            this.activeFilters.relationshipTypes.add(type);
        }
        this.notifyChange();
    }

    // Set search text
    setSearch(text) {
        this.activeFilters.searchText = text.toLowerCase();
        this.notifyChange();
    }

    // Set property filter
    setPropertyFilter(key, value) {
        if (value === null || value === undefined || value === '') {
            delete this.activeFilters.properties[key];
        } else {
            this.activeFilters.properties[key] = value;
        }
        this.notifyChange();
    }

    // Set focus mode
    setFocusNode(nodeId, depth = 1) {
        this.activeFilters.focusNode = nodeId;
        this.activeFilters.focusDepth = depth;
        this.notifyChange();
    }

    // Clear focus mode
    clearFocus() {
        this.activeFilters.focusNode = null;
        this.notifyChange();
    }

    // Clear all filters
    clearAll() {
        this.activeFilters = {
            entityTypes: new Set(),
            relationshipTypes: new Set(),
            searchText: '',
            properties: {},
            focusNode: null,
            focusDepth: 1
        };
        this.notifyChange();
    }

    // Get neighbors within depth
    getNeighbors(nodeId, depth) {
        if (!this.originalGraph) return new Set([nodeId]);
        
        const neighbors = new Set([nodeId]);
        let currentLevel = new Set([nodeId]);
        
        for (let i = 0; i < depth; i++) {
            const nextLevel = new Set();
            currentLevel.forEach(id => {
                this.originalGraph.relationships.forEach(rel => {
                    if (rel.source === id && !neighbors.has(rel.target)) {
                        nextLevel.add(rel.target);
                        neighbors.add(rel.target);
                    }
                    if (rel.target === id && !neighbors.has(rel.source)) {
                        nextLevel.add(rel.source);
                        neighbors.add(rel.source);
                    }
                });
            });
            currentLevel = nextLevel;
        }
        
        return neighbors;
    }

    // Apply all active filters
    applyFilters() {
        if (!this.originalGraph) return null;

        let filteredEntities = [...this.originalGraph.entities];
        let filteredRelationships = [...this.originalGraph.relationships];

        // Apply entity type filter
        if (this.activeFilters.entityTypes.size > 0) {
            filteredEntities = filteredEntities.filter(e => 
                this.activeFilters.entityTypes.has(e.type)
            );
        }

        // Apply search filter
        if (this.activeFilters.searchText) {
            filteredEntities = filteredEntities.filter(e => {
                const searchIn = [
                    e.name,
                    e.type,
                    JSON.stringify(e.properties)
                ].join(' ').toLowerCase();
                return searchIn.includes(this.activeFilters.searchText);
            });
        }

        // Apply property filters
        Object.entries(this.activeFilters.properties).forEach(([key, value]) => {
            filteredEntities = filteredEntities.filter(e => {
                const propValue = e.properties?.[key];
                if (propValue === undefined) return false;
                return String(propValue).toLowerCase().includes(String(value).toLowerCase());
            });
        });

        // Apply focus mode
        if (this.activeFilters.focusNode) {
            const focusNeighbors = this.getNeighbors(
                this.activeFilters.focusNode,
                this.activeFilters.focusDepth
            );
            filteredEntities = filteredEntities.filter(e => focusNeighbors.has(e.id));
        }

        // Get valid entity IDs
        const validEntityIds = new Set(filteredEntities.map(e => e.id));

        // Filter relationships to only include those between visible entities
        filteredRelationships = filteredRelationships.filter(r =>
            validEntityIds.has(r.source) && validEntityIds.has(r.target)
        );

        // Apply relationship type filter
        if (this.activeFilters.relationshipTypes.size > 0) {
            filteredRelationships = filteredRelationships.filter(r =>
                this.activeFilters.relationshipTypes.has(r.type)
            );
        }

        return {
            entities: filteredEntities,
            relationships: filteredRelationships
        };
    }

    // Get filter statistics
    getStats() {
        if (!this.originalGraph) return null;

        const filtered = this.applyFilters();
        return {
            original: {
                entities: this.originalGraph.entities.length,
                relationships: this.originalGraph.relationships.length
            },
            filtered: {
                entities: filtered.entities.length,
                relationships: filtered.relationships.length
            },
            entityTypes: this.getEntityTypeCounts(),
            relationshipTypes: this.getRelationshipTypeCounts()
        };
    }

    // Get entity type counts
    getEntityTypeCounts() {
        if (!this.originalGraph) return {};
        
        const counts = {};
        this.originalGraph.entities.forEach(e => {
            counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return counts;
    }

    // Get relationship type counts
    getRelationshipTypeCounts() {
        if (!this.originalGraph) return {};
        
        const counts = {};
        this.originalGraph.relationships.forEach(r => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });
        return counts;
    }

    // Save current filter state
    saveState() {
        return {
            entityTypes: Array.from(this.activeFilters.entityTypes),
            relationshipTypes: Array.from(this.activeFilters.relationshipTypes),
            searchText: this.activeFilters.searchText,
            properties: { ...this.activeFilters.properties },
            focusNode: this.activeFilters.focusNode,
            focusDepth: this.activeFilters.focusDepth
        };
    }

    // Load filter state
    loadState(state) {
        this.activeFilters.entityTypes = new Set(state.entityTypes || []);
        this.activeFilters.relationshipTypes = new Set(state.relationshipTypes || []);
        this.activeFilters.searchText = state.searchText || '';
        this.activeFilters.properties = state.properties || {};
        this.activeFilters.focusNode = state.focusNode || null;
        this.activeFilters.focusDepth = state.focusDepth || 1;
        this.notifyChange();
    }
}

// UI Component for Filter Panel
class FilterPanel {
    constructor(containerId, filterEngine) {
        this.container = document.getElementById(containerId);
        this.filterEngine = filterEngine;
        this.render();
        this.attachEventListeners();
    }

    render() {
        const stats = this.filterEngine.getStats();
        if (!stats) return;

        this.container.innerHTML = `
            <div class="filter-panel">
                <div class="filter-header">
                    <h3>Filters</h3>
                    <button id="clearFilters" class="btn-clear">Clear All</button>
                </div>

                <div class="filter-section">
                    <input 
                        type="text" 
                        id="searchFilter" 
                        placeholder="🔍 Search entities..." 
                        class="search-input"
                        value="${this.filterEngine.activeFilters.searchText}"
                    />
                </div>

                <div class="filter-section">
                    <h4>📦 Entity Types</h4>
                    <div class="filter-options" id="entityTypeFilters">
                        ${this.renderEntityTypeFilters(stats.entityTypes)}
                    </div>
                </div>

                <div class="filter-section">
                    <h4>🔗 Relationship Types</h4>
                    <div class="filter-options" id="relationshipTypeFilters">
                        ${this.renderRelationshipTypeFilters(stats.relationshipTypes)}
                    </div>
                </div>

                <div class="filter-section">
                    <h4>🎯 Focus Mode</h4>
                    <div class="focus-controls">
                        <label>Depth: <span id="focusDepthValue">1</span></label>
                        <input 
                            type="range" 
                            id="focusDepth" 
                            min="1" 
                            max="3" 
                            value="${this.filterEngine.activeFilters.focusDepth}"
                            class="depth-slider"
                        />
                        <small>Click a node to focus</small>
                        ${this.filterEngine.activeFilters.focusNode ? 
                            '<button id="clearFocus" class="btn-secondary">Clear Focus</button>' : ''
                        }
                    </div>
                </div>

                <div class="filter-stats">
                    <div class="stat-row">
                        <span>Showing:</span>
                        <span><strong>${stats.filtered.entities}</strong> / ${stats.original.entities} entities</span>
                    </div>
                    <div class="stat-row">
                        <span></span>
                        <span><strong>${stats.filtered.relationships}</strong> / ${stats.original.relationships} relationships</span>
                    </div>
                </div>

                <div class="filter-presets">
                    <h4>Quick Views</h4>
                    <button class="preset-btn" data-preset="processes">Process Flows</button>
                    <button class="preset-btn" data-preset="teams">Team Structure</button>
                    <button class="preset-btn" data-preset="pain-solutions">Pain & Solutions</button>
                    <button class="preset-btn" data-preset="all">Show All</button>
                </div>
            </div>
        `;
    }

    renderEntityTypeFilters(counts) {
        return Object.entries(counts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, count]) => {
                const isChecked = this.filterEngine.activeFilters.entityTypes.size === 0 ||
                                this.filterEngine.activeFilters.entityTypes.has(type);
                return `
                    <label class="filter-checkbox">
                        <input 
                            type="checkbox" 
                            class="entity-type-filter" 
                            value="${type}"
                            ${isChecked ? 'checked' : ''}
                        />
                        <span>${type} (${count})</span>
                    </label>
                `;
            }).join('');
    }

    renderRelationshipTypeFilters(counts) {
        return Object.entries(counts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, count]) => {
                const isChecked = this.filterEngine.activeFilters.relationshipTypes.size === 0 ||
                                this.filterEngine.activeFilters.relationshipTypes.has(type);
                return `
                    <label class="filter-checkbox">
                        <input 
                            type="checkbox" 
                            class="relationship-type-filter" 
                            value="${type}"
                            ${isChecked ? 'checked' : ''}
                        />
                        <span>${type} (${count})</span>
                    </label>
                `;
            }).join('');
    }

    attachEventListeners() {
        // Search filter
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filterEngine.setSearch(e.target.value);
                }, 300);
            });
        }

        // Clear all filters
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.filterEngine.clearAll();
                this.render();
                this.attachEventListeners();
            });
        }

        // Entity type filters
        document.querySelectorAll('.entity-type-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.filterEngine.toggleEntityType(e.target.value);
            });
        });

        // Relationship type filters
        document.querySelectorAll('.relationship-type-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.filterEngine.toggleRelationshipType(e.target.value);
            });
        });

        // Focus depth slider
        const depthSlider = document.getElementById('focusDepth');
        const depthValue = document.getElementById('focusDepthValue');
        if (depthSlider && depthValue) {
            depthSlider.addEventListener('input', (e) => {
                depthValue.textContent = e.target.value;
                if (this.filterEngine.activeFilters.focusNode) {
                    this.filterEngine.setFocusNode(
                        this.filterEngine.activeFilters.focusNode,
                        parseInt(e.target.value)
                    );
                }
            });
        }

        // Clear focus
        const clearFocusBtn = document.getElementById('clearFocus');
        if (clearFocusBtn) {
            clearFocusBtn.addEventListener('click', () => {
                this.filterEngine.clearFocus();
                this.render();
                this.attachEventListeners();
            });
        }

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.target.dataset.preset);
            });
        });

        // Listen for filter changes to update UI
        this.filterEngine.onChange(() => {
            this.render();
            this.attachEventListeners();
        });
    }

    applyPreset(preset) {
        this.filterEngine.clearAll();
        
        switch (preset) {
            case 'processes':
                this.filterEngine.setEntityTypeFilter(['Process', 'Team']);
                this.filterEngine.setRelationshipTypeFilter(['PERFORMS_PROCESS']);
                break;
            case 'teams':
                this.filterEngine.setEntityTypeFilter(['Company', 'Team']);
                this.filterEngine.setRelationshipTypeFilter(['HAS_TEAM']);
                break;
            case 'pain-solutions':
                this.filterEngine.setEntityTypeFilter(['PainPoint', 'Opportunity']);
                this.filterEngine.setRelationshipTypeFilter(['ADDRESSES']);
                break;
            case 'all':
                // Already cleared
                break;
        }
    }
}

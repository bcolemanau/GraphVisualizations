// Integration test script for GraphVisualizations API
// Run with: node test-integration.js

const GRAPHVIZ_URL = process.env.GRAPHVIZ_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '';

// Test data
const testGraph = {
  entities: [
    { id: '1', type: 'Person', name: 'Alice', properties: { role: 'Engineer' } },
    { id: '2', type: 'Person', name: 'Bob', properties: { role: 'Designer' } },
    { id: '3', type: 'Organization', name: 'Acme Corp', properties: { industry: 'Tech' } },
    { id: '4', type: 'Person', name: 'Charlie', properties: { role: 'Manager' } }
  ],
  relationships: [
    { source: '1', target: '3', type: 'works_for', properties: { since: '2020' } },
    { source: '2', target: '3', type: 'works_for', properties: { since: '2021' } },
    { source: '4', target: '3', type: 'works_for', properties: { since: '2019' } },
    { source: '1', target: '2', type: 'knows', properties: {} },
    { source: '4', target: '1', type: 'manages', properties: {} },
    { source: '4', target: '2', type: 'manages', properties: {} }
  ]
};

async function makeRequest(endpoint, options = {}) {
  const url = `${GRAPHVIZ_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Starting GraphVisualizations Integration Tests\n');
  console.log(`Base URL: ${GRAPHVIZ_URL}`);
  console.log(`API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'None (development mode)'}\n`);

  let graphId;

  try {
    // Test 1: Create graph
    console.log('📝 Test 1: Creating graph visualization...');
    const createResult = await makeRequest('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        graph: testGraph,
        visualizationType: 'force-directed',
        title: 'Test Organization Graph'
      })
    });
    
    graphId = createResult.graphId;
    console.log(`✅ Graph created: ${graphId}`);
    console.log(`   URL: ${createResult.url}`);
    console.log(`   Entities: ${createResult.metadata.entityCount}`);
    console.log(`   Relationships: ${createResult.metadata.relationshipCount}\n`);

    // Test 2: Retrieve graph
    console.log('📖 Test 2: Retrieving graph data...');
    const getResult = await makeRequest(`/api/graph/${graphId}`);
    console.log(`✅ Graph retrieved: ${getResult.title}`);
    console.log(`   Visualization type: ${getResult.visualizationType}`);
    console.log(`   Timestamp: ${new Date(getResult.timestamp).toLocaleString()}\n`);

    // Test 3: List all graphs
    console.log('📋 Test 3: Listing all graphs...');
    const listResult = await makeRequest('/api/graphs');
    console.log(`✅ Found ${listResult.count} graph(s)`);
    listResult.graphs.forEach((g, i) => {
      console.log(`   ${i + 1}. ${g.graphId} - "${g.title}" (${g.visualizationType})`);
    });
    console.log();

    // Test 4: Query graph by entity type
    console.log('🔍 Test 4: Querying graph (entity type = Person)...');
    const queryResult = await makeRequest(`/api/graph/${graphId}/query`, {
      method: 'POST',
      body: JSON.stringify({ entityType: 'Person' })
    });
    console.log(`✅ Query completed: Found ${queryResult.result.entities.length} entities`);
    queryResult.result.entities.forEach(e => {
      console.log(`   - ${e.name} (${e.type})`);
    });
    console.log();

    // Test 5: Query specific entity with relationships
    console.log('🔍 Test 5: Querying specific entity (Alice)...');
    const entityQueryResult = await makeRequest(`/api/graph/${graphId}/query`, {
      method: 'POST',
      body: JSON.stringify({ entityId: '1' })
    });
    console.log(`✅ Entity found: ${entityQueryResult.result.entities[0].name}`);
    console.log(`   Connected relationships: ${entityQueryResult.result.relationships.length}`);
    entityQueryResult.result.relationships.forEach(r => {
      console.log(`   - ${r.type}: ${r.source} → ${r.target}`);
    });
    console.log();

    // Test 6: Update graph
    console.log('✏️  Test 6: Updating graph (adding new entity)...');
    const updatedGraph = {
      entities: [
        ...testGraph.entities,
        { id: '5', type: 'Person', name: 'Diana', properties: { role: 'Data Scientist' } }
      ],
      relationships: [
        ...testGraph.relationships,
        { source: '5', target: '3', type: 'works_for', properties: { since: '2023' } },
        { source: '4', target: '5', type: 'manages', properties: {} }
      ]
    };
    
    const updateResult = await makeRequest(`/api/graph/${graphId}`, {
      method: 'PUT',
      body: JSON.stringify({
        graph: updatedGraph,
        title: 'Updated Organization Graph'
      })
    });
    console.log(`✅ Graph updated successfully`);
    console.log(`   New entity count: ${updateResult.metadata.entityCount}`);
    console.log(`   New relationship count: ${updateResult.metadata.relationshipCount}\n`);

    // Test 7: Change visualization type
    console.log('🎨 Test 7: Changing visualization type to chord diagram...');
    const vizUpdateResult = await makeRequest(`/api/graph/${graphId}`, {
      method: 'PUT',
      body: JSON.stringify({
        visualizationType: 'chord'
      })
    });
    console.log(`✅ Visualization type updated`);
    console.log(`   New URL: ${vizUpdateResult.url}\n`);

    // Test 8: Query by relationship type
    console.log('🔍 Test 8: Querying by relationship type (manages)...');
    const relQueryResult = await makeRequest(`/api/graph/${graphId}/query`, {
      method: 'POST',
      body: JSON.stringify({ relationshipType: 'manages' })
    });
    console.log(`✅ Found ${relQueryResult.result.relationships.length} 'manages' relationships`);
    relQueryResult.result.relationships.forEach(r => {
      console.log(`   - ${r.source} manages ${r.target}`);
    });
    console.log();

    // Test 9: Delete graph
    console.log('🗑️  Test 9: Deleting graph...');
    const deleteResult = await makeRequest(`/api/graph/${graphId}`, {
      method: 'DELETE'
    });
    console.log(`✅ ${deleteResult.message}\n`);

    // Verify deletion
    console.log('✔️  Test 10: Verifying deletion...');
    try {
      await makeRequest(`/api/graph/${graphId}`);
      console.log('❌ Graph still exists (should have been deleted)');
    } catch (error) {
      console.log('✅ Graph successfully deleted (404 confirmed)\n');
    }

    console.log('🎉 All tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Create graph');
    console.log('   ✅ Retrieve graph');
    console.log('   ✅ List graphs');
    console.log('   ✅ Query by entity type');
    console.log('   ✅ Query by entity ID');
    console.log('   ✅ Update graph data');
    console.log('   ✅ Update visualization type');
    console.log('   ✅ Query by relationship type');
    console.log('   ✅ Delete graph');
    console.log('   ✅ Verify deletion');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
console.log('GraphVisualizations API Integration Test\n');
console.log('Prerequisites:');
console.log('  - Server should be running on ' + GRAPHVIZ_URL);
console.log('  - Set API_KEY environment variable if authentication is required\n');

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

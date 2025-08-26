/**
 * Simple test client to verify the HTTP-based MCP server functionality
 * This demonstrates how a web client can interact with the MCP server
 */

const testMCPServer = async () => {
  const baseUrl = 'http://localhost:3001';
  const mcpEndpoint = `${baseUrl}/mcp`;
  
  // Test 1: Health Check
  console.log('Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Initialize MCP session
  console.log('\nTesting MCP initialization...');
  try {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const initResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ESb93H8L95UxEJ7MA6HGXoNI-f8'
      },
      body: JSON.stringify(initRequest)
    });

    if (!initResponse.ok) {
      throw new Error(`HTTP ${initResponse.status}: ${initResponse.statusText}`);
    }

    const initData = await initResponse.json();
    console.log('✅ MCP Initialize:', initData);

    // Extract session ID if available
    const sessionId = initResponse.headers.get('Mcp-Session-Id');
    console.log('Session ID:', sessionId);

    // Test 3: List tools
    console.log('\nTesting tools/list...');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const toolsResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ESb93H8L95UxEJ7MA6HGXoNI-f8',
        ...(sessionId && { 'Mcp-Session-Id': sessionId })
      },
      body: JSON.stringify(toolsRequest)
    });

    const toolsData = await toolsResponse.json();
    console.log('✅ Tools list:', JSON.stringify(toolsData, null, 2));

    // Test 4: Test get-base-sites tool
    console.log('\nTesting get-base-sites tool...');
    const baseSitesRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get-base-sites',
        arguments: {
          fields: 'DEFAULT'
        }
      }
    };

    const baseSitesResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ESb93H8L95UxEJ7MA6HGXoNI-f8',
        ...(sessionId && { 'Mcp-Session-Id': sessionId })
      },
      body: JSON.stringify(baseSitesRequest)
    });

    const baseSitesData = await baseSitesResponse.json();
    console.log('✅ Base sites result:', JSON.stringify(baseSitesData, null, 2));

    // Test 5: Test product-search tool
    console.log('\nTesting product-search tool...');
    const productSearchRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'product-search',
        arguments: {
          baseSiteId: 'electronics-spa',
          query: 'camera',
          pageSize: 5
        }
      }
    };

    const productSearchResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ESb93H8L95UxEJ7MA6HGXoNI-f8',
        ...(sessionId && { 'Mcp-Session-Id': sessionId })
      },
      body: JSON.stringify(productSearchRequest)
    });

    const productSearchData = await productSearchResponse.json();
    console.log('✅ Product search result:', JSON.stringify(productSearchData, null, 2));

  } catch (error) {
    console.error('❌ MCP test failed:', error.message);
  }
};

// Check if server is running and run tests
const runTests = async () => {
  console.log('🚀 Starting MCP Server Tests\n');
  console.log('Make sure the server is running with: npm start');
  console.log('Server should be accessible at: http://localhost:3001\n');
  
  await testMCPServer();
  
  console.log('\n✨ Tests completed!');
  console.log('\nNote: Some API calls may fail if the SAP Commerce server is not running');
  console.log('or if the access token is invalid. This is expected for demonstration purposes.');
};

// Run the tests
runTests().catch(console.error);

/**
 * Test script to verify multiple requests work correctly
 */

const testMultipleRequests = async () => {
  const baseUrl = 'http://localhost:3001';
  const mcpEndpoint = `${baseUrl}/mcp`;
  
  console.log('🚀 Testing Multiple MCP Requests\n');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': 'Bearer ESb93H8L95UxEJ7MA6HGXoNI-f8'
  };

  // Test 1: First request - Initialize
  console.log('Request 1: Initialize');
  try {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const response1 = await fetch(mcpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(initRequest)
    });

    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${response1.statusText}`);
    }

    const data1 = await response1.json();
    console.log('✅ Request 1 successful:', data1.result ? 'Initialized' : 'Response received');
    
    // Extract session ID for subsequent requests
    const sessionId = response1.headers.get('Mcp-Session-Id');
    console.log('Session ID:', sessionId);
    
    // Add session ID to headers for subsequent requests
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }
  } catch (error) {
    console.error('❌ Request 1 failed:', error.message);
    return;
  }

  // Test 2: Second request - List tools
  console.log('\nRequest 2: List tools');
  try {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const response2 = await fetch(mcpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(toolsRequest)
    });

    if (!response2.ok) {
      throw new Error(`HTTP ${response2.status}: ${response2.statusText}`);
    }

    const data2 = await response2.json();
    console.log('✅ Request 2 successful:', data2.result?.tools?.length ? `Found ${data2.result.tools.length} tools` : 'Response received');
  } catch (error) {
    console.error('❌ Request 2 failed:', error.message);
    return;
  }

  // Test 3: Third request - Call get-base-sites tool
  console.log('\nRequest 3: Call get-base-sites tool');
  try {
    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get-base-sites',
        arguments: { fields: 'DEFAULT' }
      }
    };

    const response3 = await fetch(mcpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(toolCallRequest)
    });

    if (!response3.ok) {
      throw new Error(`HTTP ${response3.status}: ${response3.statusText}`);
    }

    const data3 = await response3.json();
    console.log('✅ Request 3 successful:', data3.result ? 'Tool executed' : 'Response received');
  } catch (error) {
    console.error('❌ Request 3 failed:', error.message);
    return;
  }

  // Test 4: Fourth request - Call product-search tool
  console.log('\nRequest 4: Call product-search tool');
  try {
    const productSearchRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'product-search',
        arguments: {
          baseSiteId: 'electronics-spa',
          query: 'camera',
          pageSize: 2
        }
      }
    };

    const response4 = await fetch(mcpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(productSearchRequest)
    });

    if (!response4.ok) {
      throw new Error(`HTTP ${response4.status}: ${response4.statusText}`);
    }

    const data4 = await response4.json();
    console.log('✅ Request 4 successful:', data4.result ? 'Tool executed' : 'Response received');
  } catch (error) {
    console.error('❌ Request 4 failed:', error.message);
    return;
  }

  console.log('\n🎉 All multiple requests completed successfully!');
  console.log('The fix appears to be working - the server handled 4 consecutive requests.');
};

// Run the tests
testMultipleRequests().catch(console.error);

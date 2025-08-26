# SAP Commerce MCP Server

A Model Context Protocol (MCP) server that provides tools for integrating with SAP Commerce REST API. This server exposes commerce functionality through MCP tools that can be used by AI assistants and chatbots in web portals.

## Features

- **HTTP-based Communication**: Uses the MCP Streamable HTTP transport for web compatibility
- **Access Token Support**: Accepts Bearer tokens from MCP clients to authenticate with SAP Commerce API
- **SAP Commerce Integration**: Direct integration with SAP Commerce OCC v2 REST API
- **Production Ready**: Built with Express.js for scalable HTTP handling

## Available Tools

### `product-search`
Search for products in SAP Commerce with advanced filtering options.

**Parameters:**
- `baseSiteId` (required): Base site identifier (e.g., 'electronics-spa')
- `query` (optional): Search query for products
- `pageSize` (optional): Number of results per page (default: 20)
- `currentPage` (optional): Page number, 0-based (default: 0)
- `fields` (optional): Response field configuration (default: 'DEFAULT')

### `get-base-sites`
Retrieve available base sites from SAP Commerce.

**Parameters:**
- `fields` (optional): Response field configuration (default: 'DEFAULT')

## Setup and Installation

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- Access to a SAP Commerce Cloud instance
- Valid SAP Commerce API access tokens

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will start on port 3000 by default (configurable via `PORT` environment variable).

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `SAP_API_BASE`: SAP Commerce API base URL (default: https://localhost:9002/occ/v2)

### SAP Commerce Configuration

Make sure your SAP Commerce instance is configured to:
- Allow CORS requests from your web application domain
- Accept OAuth2 Bearer tokens for API authentication
- Expose the required OCC v2 endpoints

## Usage

### HTTP Endpoints

- **MCP Endpoint**: `POST/GET /mcp` - Main MCP communication endpoint
- **Health Check**: `GET /health` - Server health status

### Authentication

The MCP server expects access tokens to be passed via the `Authorization` header:

```
Authorization: Bearer <your-sap-commerce-access-token>
```

The server will extract this token and use it for all SAP Commerce API calls.

### MCP Client Integration

Your web portal's MCP client should:

1. **Initialize the MCP session** by sending an `initialize` request to `/mcp`
2. **Include authentication** in every request using Bearer tokens
3. **Maintain session state** using the `Mcp-Session-Id` header
4. **Call tools** using the standard MCP `tools/call` method

### Example MCP Client Code

```javascript
// Initialize MCP session
const initResponse = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': 'Bearer <sap-commerce-token>'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      clientInfo: { name: 'web-client', version: '1.0.0' }
    }
  })
});

// Get session ID
const sessionId = initResponse.headers.get('Mcp-Session-Id');

// Call a tool
const toolResponse = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': 'Bearer <sap-commerce-token>',
    'Mcp-Session-Id': sessionId
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'product-search',
      arguments: {
        baseSiteId: 'electronics-spa',
        query: 'camera',
        pageSize: 10
      }
    }
  })
});
```

## Testing

Run the test client to verify server functionality:

```bash
node test-client.js
```

The test client will:
- Check server health
- Initialize an MCP session
- List available tools
- Test tool execution with sample requests

## Security Considerations

### Production Deployment

For production use, ensure:

1. **HTTPS**: Always use HTTPS in production
2. **CORS Configuration**: Restrict CORS origins to your web application domains
3. **Token Security**: Implement proper token validation and refresh mechanisms
4. **Rate Limiting**: Add rate limiting for API endpoints
5. **Input Validation**: Validate all input parameters
6. **Error Handling**: Implement comprehensive error handling and logging

### Access Token Management

- Tokens are passed through and not stored by the MCP server
- Implement token refresh logic in your web application
- Use short-lived tokens with appropriate scopes
- Monitor for token expiration and handle gracefully

## Development

### Project Structure

```
src/
├── index.ts              # Main MCP server implementation
├── tools/                # Individual MCP tools (future expansion)
├── types/                # TypeScript type definitions (future)
└── utils/                # Common utilities (future)
```

### Adding New Tools

To add new SAP Commerce tools:

1. Register the tool using `server.tool()`
2. Define Zod schema for parameters
3. Implement the tool handler function
4. Extract the access token from `extra._meta.sapToken`
5. Use the `makeRequest()` helper for SAP Commerce API calls

### Development Scripts

- `npm run build`: Build TypeScript to JavaScript
- `npm run start`: Build and start the server
- `npm run dev`: Development mode (same as start)

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the server is running on the expected port
2. **CORS Errors**: Configure CORS settings for your web application domain
3. **Authentication Failures**: Verify SAP Commerce access tokens are valid
4. **API Errors**: Check SAP Commerce server connectivity and endpoint availability

### Logs

The server logs important events to the console:
- Server startup and port information
- MCP session initialization and closure
- API request errors
- General application errors

## Contributing

Follow the guidelines in `.cursorrules` for development standards and SAP Commerce API integration patterns.

## License

ISC

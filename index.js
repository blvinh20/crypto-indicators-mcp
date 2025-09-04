const express= require('express')
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
// const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  SSEServerTransport,
} = require('@modelcontextprotocol/sdk/server/sse.js');
// Initialize MCP server
const server = new McpServer({
  name: 'crypto-indicators-mcp',
  version: '1.0.0',
});

// Load tools from separate files
require('./indicators/trendIndicators')(server);
require('./indicators/momentumIndicators')(server);
require('./indicators/volatilityIndicators')(server);
require('./indicators/volumeIndicators')(server);

// Load strategies from separate files
require('./strategies/trendStrategies')(server);
require('./strategies/momentumStrategies')(server);
require('./strategies/volatilityStrategies')(server);
require('./strategies/volumeStrategies')(server);
const app = express();

const transports = new Map();

app.get("/sse", async (req, res) => {
  let transport;

  if (req?.query?.sessionId) {
    const sessionId = (req?.query?.sessionId );
    transport = transports.get(sessionId);
    console.error("Client Reconnecting? This shouldn't happen; when client has a sessionId, GET /sse should not be called again.", transport.sessionId);
  } else {
    // Create and store transport for new session
    transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);

    // Connect server to transport
    await server.connect(transport);
    console.error("Client Connected: ", transport.sessionId);

    // Start notification intervals after client connects

    // Handle close of connection
    server.onclose = async () => {
      console.error("Client Disconnected: ", transport.sessionId);
      transports.delete(transport.sessionId);
      await cleanup();
    };

  }

});

app.post("/message", async (req, res) => {
  const sessionId = (req?.query?.sessionId);
  const transport = transports.get(sessionId);
  if (transport) {
    console.error("Client Message from", sessionId);
    await transport.handlePostMessage(req, res);
  } else {
    console.error(`No transport found for sessionId ${sessionId}`)
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`Server is running on port ${PORT}`);
});

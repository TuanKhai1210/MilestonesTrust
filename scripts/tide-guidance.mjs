// Read-only client for Tide's public MCP. Never sends source files or credentials.
const endpoint = 'https://mcp.tide.org/mcp';
let sequence = 0;
let session;
async function rpc(method, params = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2024-11-05', ...(session ? { 'Mcp-Session-Id': session } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++sequence, method, params }),
  });
  if (!response.ok) throw new Error(`Tide MCP returned HTTP ${response.status}`);
  session = response.headers.get('mcp-session-id') || session;
  const raw = await response.text();
  const result = response.headers.get('content-type')?.includes('text/event-stream')
    ? raw.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6))).find(item => item.id === sequence)
    : JSON.parse(raw);
  if (!result || result.error) throw new Error(JSON.stringify(result?.error || 'No MCP result'));
  return result.result;
}
const info = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'evertrust-planning', version: '1.0' } });
const name = process.argv[2];
if (!name) throw new Error('Usage: node scripts/tide-guidance.mjs <tool-name|list> [JSON arguments]');
const result = await rpc(name === 'list' ? 'tools/list' : 'tools/call', name === 'list' ? {} : { name, arguments: JSON.parse(process.argv[3] || '{}') });
console.log(JSON.stringify({ retrievedAt: new Date().toISOString(), endpoint, server: info.serverInfo, name, result }, null, 2));

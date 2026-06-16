const BASE_URL = process.env.APP_URL || "http://localhost:3000";

async function testMcp() {
  console.log("Creating MCP session...");

  const response = await fetch(`${BASE_URL}/api/mcp`, {
    method: "POST",
    headers: {
      Cookie: process.env.COOKIES || "__session=eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zRXFiV0E3Q1VFREdrYUFrNDZYeEZobVJvRWwiLCJvaWF0IjoxNzgxNTg2MzE5LCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3ODE1ODYzNzksImZ2YSI6WzI4NTMsLTFdLCJpYXQiOjE3ODE1ODYzMTksImlzcyI6Imh0dHBzOi8vYmlnLWNsYW0tMjMuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzgxNTg2MzA5LCJzaWQiOiJzZXNzXzNGNzlFT0FRNUxyY2RVQlNoem1ocnVFV05SSCIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfM0Y1alhHWGFhMkJkWWZhVGV5NEx0bmx1OHpFIiwidiI6Mn0.tK0VztyS6PJK_gw-GPgW23pi0sHVbrYsKHpgLEZbHE4hPMUGiu_qt1X7w_HBWdIi8QYGH0UBb4YrbsdV38jmz7II0I682jyw_C6HOoNtb6OKBxg5ToFY3j91FJxF4Oeoq3iY91jLMnIw1ILhhLSP2iU7HNCOJHzS5CXysY6YHzZaH9VmQbJ45s51MgMb66pZu0t_M2q-TmXMzh3KiB_O1FfSdz6exYp6k8KWsDf83zM7PuW3YBrRGVLkAvGxEw_qtLsJm9zNgukNUmoNoLadSeLSmH_t8U9n6EfUjELFDVRPA6UiytXY1pDXOzS9ofU_msvFrY9q-Wm_8DlutRR3gw",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
    }),
  });

  console.log("Status:", response.status);

  const sessionId = response.headers.get("mcp-session-id");

  console.log("Session ID:", sessionId);

  const body = await response.text();

  console.log(body);

  if (!sessionId) {
    throw new Error("No MCP session returned");
  }

  console.log("✅ MCP session created");

  return sessionId;
}

testMcp().catch(console.error);
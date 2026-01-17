// JavaScript file with JWT tokens (TEST FILE - FAKE TOKENS)

const authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Basic auth
const basicAuth = "Basic dXNlcm5hbWU6cGFzc3dvcmQxMjM0NTY3ODkw";

function makeRequest() {
  fetch('/api/data', {
    headers: {
      'Authorization': authHeader
    }
  });
}

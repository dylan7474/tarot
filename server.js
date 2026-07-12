const http = require('node:http');
const { promises: fs } = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8000);
const ROOT = __dirname;
const DATA_DIR = process.env.TAROT_DATA_DIR || path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'server-state.json');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

const defaultState = {
  geminiApiKey: '',
  aiProvider: 'gemini',
  ollamaAddress: 'http://localhost:11434',
  ollamaModel: '',
  ollamaModelsList: [],
  userSettings: {},
  physicalDeck: null,
  updatedAt: null,
};

async function readState() {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf8');
    return { ...defaultState, ...JSON.parse(content) };
  } catch (error) {
    if (error.code === 'ENOENT') return defaultState;
    throw error;
  }
}

async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const nextState = { ...defaultState, ...state, updatedAt: new Date().toISOString() };
  await fs.writeFile(STATE_FILE, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  return nextState;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

async function serveStatic(request, response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    sendError(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      sendError(response, 404, 'Not found');
      return;
    }
    console.error(error);
    sendError(response, 500, 'Unable to read requested file');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === '/api/state') {
      if (request.method === 'GET') {
        sendJson(response, 200, await readState());
        return;
      }

      if (request.method === 'PUT') {
        const body = await readRequestBody(request);
        const state = body ? JSON.parse(body) : {};
        sendJson(response, 200, await writeState(state));
        return;
      }

      sendError(response, 405, 'Method not allowed');
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendError(response, 405, 'Method not allowed');
      return;
    }

    await serveStatic(request, response, url.pathname);
  } catch (error) {
    console.error(error);
    sendError(response, 500, 'Unexpected server error');
  }
});

server.listen(PORT, () => {
  console.log(`Cosmic Tarot server listening at http://localhost:${PORT}`);
  console.log(`Persistent state file: ${STATE_FILE}`);
});

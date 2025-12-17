// api/chat.js
// Serverless API route for handling chat messages in Vercel
// This route decides whether to use a local model (running on your machine via Ollama) or a remote model via a cheap API (e.g., together.ai).
// It uses heuristics to minimize cost while still providing accurate responses.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body: messages array required' });
  }

  try {
    const responseMessage = await routeAndCallModel(messages);
    return res.status(200).json({ message: responseMessage });
  } catch (err) {
    console.error('Error in chat handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * Decide which model to call (local or remote) based on heuristics.
 * You can adjust thresholds and environment variables to suit your needs.
 */
async function routeAndCallModel(messages) {
  // Flatten the message contents to approximate token count
  const joinedContent = messages.map(m => m.content || '').join(' ');
  const length = joinedContent.length;

  // If the prompt is short, use a local model to save cost
  const threshold = process.env.LOCAL_MODEL_THRESHOLD ? parseInt(process.env.LOCAL_MODEL_THRESHOLD) : 2000;
  const useLocal = length < threshold;

  // Use local model if threshold met and a local URL is defined; otherwise remote
  if (useLocal && (process.env.LOCAL_MODEL_URL || process.env.OLLAMA_URL)) {
    return callLocalModel(messages);
  }
  return callRemoteModel(messages);
}

/**
 * Call a locally hosted model via Ollama or similar.
 * Expects LOCAL_MODEL_URL or OLLAMA_URL to be set, e.g. http://localhost:11434/api/chat
 */
async function callLocalModel(messages) {
  const endpoint = process.env.LOCAL_MODEL_URL || process.env.OLLAMA_URL;
  if (!endpoint) throw new Error('LOCAL_MODEL_URL environment variable is not set');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.LOCAL_MODEL_NAME || 'qwen:7b',
      messages,
      stream: false
    })
  });
  if (!res.ok) {
    throw new Error(`Local model call failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const content = data?.message?.content || data?.choices?.[0]?.message?.content;
  return content || '';
}

/**
 // api/chat.js
// Serverless API route for handling chat messages in Vercel
// This route decides whether to use a local model (running on your machine via Ollama) or a remote model via a cheap API (e.g., together.ai).
// It uses heuristics to minimize cost while still providing accurate responses.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body: messages array required' });
  }

  try {
    const responseMessage = await routeAndCallModel(messages);
    return res.status(200).json({ message: responseMessage });
  } catch (err) {
    console.error('Error in chat handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * Decide which model to call (local or remote) based on heuristics.
 * You can adjust thresholds and environment variables to suit your needs.
 */
async function routeAndCallModel(messages) {
  // Flatten the message contents to approximate token count
  const joinedContent = messages.map(m => m.content || '').join(' ');
  const length = joinedContent.length;

  // Determine threshold from environment or default
  const threshold = process.env.LOCAL_MODEL_THRESHOLD ? parseInt(process.env.LOCAL_MODEL_THRESHOLD) : 2000;
  const useLocal = length < threshold;

  // Use local model if threshold met and a local URL is defined; otherwise remote
  if (useLocal && (process.env.LOCAL_MODEL_URL || process.env.OLLAMA_URL)) {
    return callLocalModel(messages);
  }
  return callRemoteModel(messages);
}

/**
 * Call a locally hosted model via Ollama or similar.
 * Expects LOCAL_MODEL_URL or OLLAMA_URL to be set, e.g. http://localhost:11434/api/chat
 */
async function callLocalModel(messages) {
  const endpoint = process.env.LOCAL_MODEL_URL || process.env.OLLAMA_URL;
  if (!endpoint) throw new Error('LOCAL_MODEL_URL environment variable is not set');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.LOCAL_MODEL_NAME || 'qwen:7b',
      messages,
      stream: false
    })
  });
  if (!res.ok) {
    throw new Error(`Local model call failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const content = data?.message?.content || data?.choices?.[0]?.message?.content;
  return content || '';
}

/**
 * Call a cheap remote API model (e.g., together.ai).
 * Requires TOGETHER_API_KEY to be set.
 */
async function callRemoteModel(messages) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error('TOGETHER_API_KEY environment variable is not set');

  const modelName = process.env.REMOTE_MODEL_NAME || 'deepseek-coder-6.7b-instruct';
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.2,
      max_tokens: 1024
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Remote model call failed: ${res.status} ${res.statusText}: ${errText}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return content || '';
}
* Call a cheap remote API model (e.g., together.ai).
 * Requires TOGETHER_API_KEY to be set.
 */
async function callRemoteModel(messages) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error('TOGETHER_API_KEY environment variable is not set');

  const modelName = process.env.REMOTE_MODEL_NAME || 'deepseek-coder-6.7b-instruct';
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.2,
      max_tokens: 1024
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Remote model call failed: ${res.status} ${res.statusText}: ${errText}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return content || '';
}

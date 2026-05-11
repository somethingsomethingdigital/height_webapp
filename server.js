import dotenv from 'dotenv';
dotenv.config({ override: true });
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Sessions: token -> { expires }
const sessions = new Map();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username !== process.env.AUTH_USERNAME ||
    password !== process.env.AUTH_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + SESSION_TTL });
  res.json({ token });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// ── File upload helpers ──────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function buildContent(text, files) {
  if (!files || files.length === 0) return text;

  const blocks = [];
  let textPrefix = '';

  for (const file of files) {
    if (file.mimeType === 'application/pdf') {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
    } else if (IMAGE_TYPES.has(file.mimeType)) {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: file.mimeType, data: file.data } });
    } else {
      textPrefix += `[File: ${file.name}]\n\n${file.data}\n\n`;
    }
  }

  if (blocks.length > 0) {
    blocks.push({ type: 'text', text: textPrefix + text });
    return blocks;
  }

  return textPrefix + text;
}

// ── Chat endpoint ────────────────────────────────────────────────────────────

app.post('/api/chat', requireAuth, async (req, res) => {
  const { messages, system, files } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const apiMessages = messages.map((m, i) => {
      const isLast = i === messages.length - 1;
      return {
        role: m.role,
        content: isLast && m.role === 'user' && files?.length
          ? buildContent(m.content, files)
          : m.content,
      };
    });

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: system || 'You are a helpful assistant.',
      messages: apiMessages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

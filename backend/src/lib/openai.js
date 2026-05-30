const OpenAI = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
const matter = require('gray-matter');
const path = require('path');
const fs = require('fs');
const { OPENAI_API_KEY, AI_RETRY_COUNT } = require('../config/env');

const PROMPTS_DIR = path.join(__dirname, '..', '..', 'prompts');

let _client = null;

function getClient() {
  if (!_client) {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
    _client = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _client;
}

function loadPrompt(promptName) {
  const filePath = path.join(PROMPTS_DIR, `${promptName}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    model: data.model || 'gpt-4o',
    systemPrompt: content.trim(),
  };
}

async function retryCall(fn, retries = AI_RETRY_COUNT, baseDelayMs = 1000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** i));
      }
    }
  }
  throw lastError;
}

/**
 * Structured output — tương đương Python client.responses.parse(..., text_format=Model)
 */
async function parseStructured(model, systemPrompt, userContent, zodSchema, schemaName) {
  return retryCall(async () => {
    const res = await getClient().beta.chat.completions.parse({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: zodResponseFormat(zodSchema, schemaName),
    });
    const parsed = res.choices[0].message.parsed;
    if (!parsed) throw new Error(`OpenAI returned null for schema ${schemaName}`);
    return parsed;
  });
}

/**
 * Plain text completion — tương đương Python client.responses.create(...)
 */
async function createCompletion(model, systemPrompt, userContent) {
  return retryCall(async () => {
    const res = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });
    return res.choices[0].message.content || '';
  });
}

module.exports = { loadPrompt, parseStructured, createCompletion };

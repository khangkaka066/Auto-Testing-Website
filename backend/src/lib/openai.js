const OpenAI = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
const matter = require('gray-matter');
const path = require('path');
const fs = require('fs');
const { OPENAI_API_KEY, AI_RETRY_COUNT } = require('../config/env');
const { recordTokens } = require('./tokenTracker');

const PROMPTS_DIR = path.join(__dirname, '..', '..', 'prompts');
const FORCED_TEMPERATURE = 0.1;

let _client = null;
const _modelsWithoutTemperature = new Set();

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
    temperature: FORCED_TEMPERATURE,
    systemPrompt: content.trim(),
  };
}

async function retryCall(fn, maxRetries = AI_RETRY_COUNT, baseDelayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

function isUnsupportedTemperatureError(err) {
  const message = err?.message || '';
  return message.includes('temperature') && message.includes('Only the default (1) value is supported');
}

function withTemperature(request, model, temperature) {
  if (_modelsWithoutTemperature.has(model) || typeof temperature !== 'number') {
    return request;
  }
  return { ...request, temperature };
}

async function parseStructured(model, systemPrompt, userContent, zodSchema, schemaName, options = {}) {
  const maxRetries = options.maxRetries ?? AI_RETRY_COUNT;
  const temperature = FORCED_TEMPERATURE;

  return retryCall(async () => {
    const request = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: zodResponseFormat(zodSchema, schemaName),
    };

    let res;
    try {
      res = await getClient().beta.chat.completions.parse(withTemperature(request, model, temperature));
    } catch (err) {
      if (!isUnsupportedTemperatureError(err)) throw err;
      _modelsWithoutTemperature.add(model);
      // console.warn(`[OpenAI] ${model} rejected temperature=${temperature}; retrying with default temperature.`);
      res = await getClient().beta.chat.completions.parse(request);
    }

    recordTokens(res.usage);
    const parsed = res.choices[0].message.parsed;
    if (!parsed) throw new Error(`OpenAI returned null for schema ${schemaName}`);
    return parsed;
  }, maxRetries);
}

async function createCompletion(model, systemPrompt, userContent, options = {}) {
  const maxRetries = options.maxRetries ?? AI_RETRY_COUNT;
  const temperature = FORCED_TEMPERATURE;

  return retryCall(async () => {
    const request = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    };

    let res;
    try {
      res = await getClient().chat.completions.create(withTemperature(request, model, temperature));
    } catch (err) {
      if (!isUnsupportedTemperatureError(err)) throw err;
      _modelsWithoutTemperature.add(model);
      // console.warn(`[OpenAI] ${model} rejected temperature=${temperature}; retrying with default temperature.`);
      res = await getClient().chat.completions.create(request);
    }

    recordTokens(res.usage);
    return res.choices[0].message.content || '';
  }, maxRetries);
}

module.exports = { loadPrompt, parseStructured, createCompletion };

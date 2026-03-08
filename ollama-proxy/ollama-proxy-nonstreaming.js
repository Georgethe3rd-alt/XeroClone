#!/usr/bin/env node
/**
 * OpenAI-compatible API proxy for Ollama (NON-STREAMING ONLY)
 * Forces all requests to use non-streaming mode (which works reliably)
 * Streaming implementation has issues - this version bypasses that
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost:11434';
const PORT = process.env.PORT || 11435;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ollama-proxy', ollama_host: OLLAMA_HOST, mode: 'non-streaming' });
});

// OpenAI-compatible chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 1000 } = req.body;
    // NOTE: Ignoring stream parameter - always use non-streaming

    // Extract the actual Ollama model name
    const ollamaModel = model.replace(/^openai\//, '').replace(/^ollama\//, '').replace(/^ollama-local\//, '');

    // Convert OpenAI messages format to Ollama prompt
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    prompt += 'Assistant: ';

    console.log(`[${new Date().toISOString()}] Request: model=${ollamaModel}, messages=${messages.length}, forced non-streaming`);

    // ALWAYS use non-streaming mode (works reliably)
    const response = await axios.post(`http://${OLLAMA_HOST}/api/generate`, {
      model: ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: temperature,
        num_predict: max_tokens
      }
    }, { timeout: 60000 });

    const completion = {
      id: 'chatcmpl-ollama-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: ollamaModel,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.data.response
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: response.data.prompt_eval_count || 0,
        completion_tokens: response.data.eval_count || 0,
        total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
      }
    };

    console.log(`[${new Date().toISOString()}] Response: ${response.data.response.substring(0, 100)}...`);
    res.json(completion);

  } catch (error) {
    console.error('Proxy error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: error.message,
          type: 'proxy_error',
          code: 'ollama_unavailable'
        }
      });
    }
  }
});

// Models list endpoint
app.get('/v1/models', async (req, res) => {
  try {
    const response = await axios.get(`http://${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    const models = response.data.models || [];
    
    const openaiFormat = {
      object: 'list',
      data: models.map(m => ({
        id: m.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'ollama',
        permission: [],
        root: m.name,
        parent: null
      }))
    };
    
    res.json(openaiFormat);
  } catch (error) {
    console.error('Models list error:', error.message);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'proxy_error'
      }
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ollama OpenAI-compatible proxy (NON-STREAMING) listening on port ${PORT}`);
  console.log(`Forwarding to Ollama at: ${OLLAMA_HOST}`);
  console.log(`Mode: Non-streaming only (reliable mode)`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
});

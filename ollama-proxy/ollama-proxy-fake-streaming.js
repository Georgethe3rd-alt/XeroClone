#!/usr/bin/env node
/**
 * OpenAI-compatible API proxy for Ollama (FAKE STREAMING)
 * Accepts streaming requests, uses non-streaming internally, fakes streaming response
 * This works around Ollama's unreliable streaming while satisfying OpenClaw's expectations
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost:11434';
const PORT = process.env.PORT || 11435;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ollama-proxy', ollama_host: OLLAMA_HOST, mode: 'fake-streaming' });
});

// OpenAI-compatible chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 1000, stream = false } = req.body;

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

    console.log(`[${new Date().toISOString()}] Request: model=${ollamaModel}, messages=${messages.length}, stream=${stream ? 'fake' : 'none'}`);

    // ALWAYS use non-streaming internally (reliable)
    const ollamaResponse = await axios.post(`http://${OLLAMA_HOST}/api/generate`, {
      model: ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: temperature,
        num_predict: max_tokens
      }
    }, { timeout: 60000 });

    const fullResponse = ollamaResponse.data.response;
    console.log(`[${new Date().toISOString()}] Got response: ${fullResponse.substring(0, 100)}...`);

    if (stream) {
      // Client wants streaming - fake it by sending the complete response as SSE chunks
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      
      // Split response into words for "streaming" simulation
      const words = fullResponse.split(/(\s+)/);
      const chunkSize = Math.max(1, Math.floor(words.length / 10)); // ~10 chunks
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        const isLast = (i + chunkSize >= words.length);
        
        const sseData = {
          id: 'chatcmpl-ollama-' + Date.now(),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: ollamaModel,
          choices: [{
            index: 0,
            delta: { content: chunk },
            finish_reason: isLast ? 'stop' : null
          }]
        };
        
        res.write(`data: ${JSON.stringify(sseData)}\n\n`);
        
        // Small delay to simulate streaming (optional)
        if (!isLast) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
      console.log(`[${new Date().toISOString()}] Fake stream complete`);
      
    } else {
      // Non-streaming response
      const completion = {
        id: 'chatcmpl-ollama-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: ollamaModel,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: fullResponse
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: ollamaResponse.data.prompt_eval_count || 0,
          completion_tokens: ollamaResponse.data.eval_count || 0,
          total_tokens: (ollamaResponse.data.prompt_eval_count || 0) + (ollamaResponse.data.eval_count || 0)
        }
      };

      res.json(completion);
    }

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
  console.log(`Ollama OpenAI-compatible proxy (FAKE STREAMING) listening on port ${PORT}`);
  console.log(`Forwarding to Ollama at: ${OLLAMA_HOST}`);
  console.log(`Mode: Non-streaming internally, streaming facade for clients`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
});

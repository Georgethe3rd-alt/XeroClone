#!/usr/bin/env node
/**
 * OpenAI-compatible API proxy for Ollama
 * Runs in dashboard container, forwards to host Ollama service
 * Allows OpenClaw to use local models via openai/* provider
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'host.docker.internal:11434';
const PORT = process.env.PORT || 11435;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ollama-proxy', ollama_host: OLLAMA_HOST });
});

// OpenAI-compatible chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 1000, stream = false } = req.body;

    // Extract the actual Ollama model name (strip openai/ prefix if present)
    const ollamaModel = model.replace(/^openai\//, '').replace(/^ollama\//, '');

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

    console.log(`[${new Date().toISOString()}] Request: model=${ollamaModel}, messages=${messages.length}, stream=${stream}`);

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await axios.post(
        `http://${OLLAMA_HOST}/api/generate`,
        {
          model: ollamaModel,
          prompt: prompt,
          stream: true,
          options: {
            temperature: temperature,
            num_predict: max_tokens
          }
        },
        {
          responseType: 'stream'
        }
      );

      let fullText = '';
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
              const sseData = {
                id: 'chatcmpl-ollama',
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: ollamaModel,
                choices: [{
                  index: 0,
                  delta: { content: data.response },
                  finish_reason: data.done ? 'stop' : null
                }]
              };
              res.write(`data: ${JSON.stringify(sseData)}\n\n`);
            }
            if (data.done) {
              res.write('data: [DONE]\n\n');
              res.end();
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      });

      response.data.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
      });

    } else {
      // Non-streaming response
      const response = await axios.post(`http://${OLLAMA_HOST}/api/generate`, {
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: max_tokens
        }
      });

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
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      console.log(`[${new Date().toISOString()}] Response: ${response.data.response.substring(0, 100)}...`);
      res.json(completion);
    }

  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'proxy_error',
        code: 'ollama_unavailable'
      }
    });
  }
});

// Models list endpoint
app.get('/v1/models', async (req, res) => {
  try {
    const response = await axios.get(`http://${OLLAMA_HOST}/api/tags`);
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
  console.log(`Ollama OpenAI-compatible proxy listening on port ${PORT}`);
  console.log(`Forwarding to Ollama at: ${OLLAMA_HOST}`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
});

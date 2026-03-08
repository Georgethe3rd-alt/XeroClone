const http = require('http');
const https = require('https');

const ELEVENLABS_API_KEY = '57c09b8f5eeffb886a2e2635025c18188247c20228f3018cfb314c7b8198ac66';
const ELEVENLABS_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = 8080;

function parseForm(body) {
  const params = {};
  body.split('&').forEach(pair => {
    const [k, v] = pair.split('=').map(decodeURIComponent);
    params[k] = v;
  });
  return params;
}

function twiml(content) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`;
}

async function transcribeAudio(recordingUrl) {
  return new Promise((resolve, reject) => {
    // Fetch audio from Twilio
    https.get(recordingUrl + '.mp3', (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => {
            const audio = Buffer.concat(chunks);
            whisperTranscribe(audio).then(resolve).catch(reject);
          });
        });
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const audio = Buffer.concat(chunks);
        whisperTranscribe(audio).then(resolve).catch(reject);
      });
    });
  });
}

async function whisperTranscribe(audioBuffer) {
  const boundary = '----FormBoundary' + Date.now();
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`;
  const modelPart = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(header), audioBuffer, Buffer.from(modelPart)]);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).text); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateResponse(text) {
  const payload = JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    system: 'You are George the 3rd, a Jarvis-like AI assistant. Be concise, composed, with dry British wit. Keep phone responses under 3 sentences.',
    messages: [{ role: 'user', content: text }]
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const msg = JSON.parse(data);
          resolve(msg.content[0].text);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function elevenLabsTTS(text) {
  const payload = JSON.stringify({
    text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Initial call - gather speech
    if (req.url === '/voice' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml(
        '<Say voice="alice">Hello, this is George the Third. How can I help you?</Say>' +
        '<Record maxLength="30" action="/voice/process" transcribe="false" />'
      ));
      return;
    }
    
    // Process recording
    if (req.url === '/voice/process' && req.method === 'POST') {
      const params = parseForm(body);
      const recordingUrl = params.RecordingUrl;
      console.log('[Voice] Recording URL:', recordingUrl);
      
      try {
        // Transcribe
        const transcript = await transcribeAudio(recordingUrl);
        console.log('[Voice] Transcript:', transcript);
        
        // Generate AI response
        const response = await generateResponse(transcript);
        console.log('[Voice] Response:', response);
        
        // Respond with TTS and loop
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml(
          `<Say voice="alice">${response.replace(/[<>&'"]/g, '')}</Say>` +
          '<Record maxLength="30" action="/voice/process" transcribe="false" />'
        ));
      } catch(err) {
        console.error('[Voice] Error:', err);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml('<Say voice="alice">I apologise, I encountered an error. Please try again.</Say><Record maxLength="30" action="/voice/process" transcribe="false" />'));
      }
      return;
    }
    
    // Health check
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'george-voice' }));
      return;
    }
    
    res.writeHead(404);
    res.end('Not found');
  });
});

server.listen(PORT, () => {
  console.log(`[Voice] George voice server running on port ${PORT}`);
  console.log(`[Voice] Webhook URL: http://187.77.8.165:${PORT}/voice`);
});

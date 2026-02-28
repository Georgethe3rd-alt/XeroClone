filepath = '/root/loopvibz/apps/api/src/generation/generation.service.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Find and replace the broken proxyImageForRunway method
old_start = '  private async proxyImageForRunway(imageUrl: string, postId: string): Promise<string> {'
old_end = '  private getVideoProvider(settings: any): VideoProvider {'

start_idx = content.find(old_start)
end_idx = content.find(old_end)

if start_idx == -1 or end_idx == -1:
    print(f'Cannot find boundaries: start={start_idx}, end={end_idx}')
    exit(1)

new_method = '''  private async proxyImageForRunway(imageUrl: string, postId: string): Promise<string> {
    const axios = require('axios');
    const path = require('path');
    const fs = require('fs');
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      
      const extMatch = imageUrl.match(/\\.(jpe?g|png|webp)/i);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const dir = path.join('/app/uploads/images', postId);
      fs.mkdirSync(dir, { recursive: true });
      const localPath = path.join(dir, 'source.' + ext);
      fs.writeFileSync(localPath, response.data);
      
      const localUrl = 'http://187.77.217.138:3001/uploads/images/' + postId + '/source.' + ext;
      console.log('[Generation] Proxied image to: ' + localUrl);
      return localUrl;
    } catch (err) {
      console.warn('[Generation] Failed to proxy image, using original: ' + err.message);
      return imageUrl;
    }
  }

  '''

content = content[:start_idx] + new_method + content[end_idx:]
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed proxyImageForRunway method')

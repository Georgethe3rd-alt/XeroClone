filepath = '/root/loopvibz/apps/api/src/generation/generation.service.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_start = '  private async proxyImageForRunway(imageUrl: string, postId: string): Promise<string> {'
old_end = '  private getVideoProvider(settings: any): VideoProvider {'

start_idx = content.find(old_start)
end_idx = content.find(old_end)

if start_idx == -1 or end_idx == -1:
    print(f'Cannot find boundaries: start={start_idx}, end={end_idx}')
    exit(1)

# Convert image to base64 data URI since Runway needs https:// and we don't have SSL
new_method = """  private async proxyImageForRunway(imageUrl: string, postId: string): Promise<string> {
    const axios = require('axios');
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUri = 'data:' + contentType + ';base64,' + base64;
      console.log('[Generation] Converted image to base64 data URI (' + Math.round(base64.length / 1024) + 'KB)');
      return dataUri;
    } catch (err) {
      console.warn('[Generation] Failed to proxy image: ' + err.message + ', using original URL');
      return imageUrl;
    }
  }

  """

content = content[:start_idx] + new_method + content[end_idx:]
with open(filepath, 'w') as f:
    f.write(content)
print('Fixed: proxyImageForRunway now returns base64 data URI')

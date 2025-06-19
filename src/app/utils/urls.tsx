
// Helper function to validate and normalize URLs
export function validateUrl(input: string): string | null {
  try {
    // If input doesn't have a protocol, add http:// by default
    let url = input.trim();

    // Check if input starts with https://.  Because of CORS issues, we replace https with http
    if (/^https:\/\//i.test(url)) {
      url = url.replace(/^https:\/\//i, "http://");
    }

    // Check if input is in the format http://example.com 
    if (!/^http?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    // Check if input is in the format www.example.com or example.com (no protocol)
    else if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(input)) {
      url = "http://" + input.trim();
    }
    const parsed = new URL(url);
    return parsed.href;
    
  } catch {
    return "";
  }
}
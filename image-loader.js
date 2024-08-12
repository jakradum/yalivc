export default function imageLoader({ src, width, quality }) {
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd ? 'https://jakradum.com' : '';  // Use your actual domain here
    
    // For absolute URLs, return the source as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // For relative URLs, prepend the base URL
    return `${baseUrl}${src}${width ? `?w=${width}` : ''}${quality ? `&q=${quality}` : ''}`;
  }
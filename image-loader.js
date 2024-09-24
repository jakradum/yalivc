module.exports = function imageLoader({ src, width, quality }) {
  const isProd = process.env.NODE_ENV === 'production';
  
  // For absolute URLs or data URLs, return the source as-is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  // For relative URLs, prepend the domain in production
  const url = isProd ? `https://yali.vc${src.startsWith('/') ? '' : '/'}${src}` : src;
  
  // Add width and quality parameters if provided
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (quality) params.append('q', quality);
  
  return params.toString() ? `${url}?${params.toString()}` : url;
}
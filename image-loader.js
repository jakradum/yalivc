module.exports = function imageLoader({ src, width, quality }) {
  const isProd = process.env.NODE_ENV === 'production';
  const repoName = 'yalivc'; // Ensure this matches your GitHub repo name
  
  // For absolute URLs or data URLs, return the source as-is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  // For relative URLs, prepend the base path
  const basePath = isProd ? `/${repoName}` : '';
  const url = `${basePath}${src.startsWith('/') ? '' : '/'}${src}`;
  
  // Add width and quality parameters if provided
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (quality) params.append('q', quality);
  
  return params.toString() ? `${url}?${params.toString()}` : url;
}
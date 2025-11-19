// /src/lib/readingTime.js
export function calculateReadingTime(portableTextBody) {
  if (!portableTextBody) return 0;
  
  const text = portableTextBody
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ');
  
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // 200 words per minute
  
  return readingTime;
}
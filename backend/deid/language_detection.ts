export function detectLanguage(text: string): string {
  const thaiChars = text.match(/[\u0E00-\u0E7F]/g) || [];
  const englishChars = text.match(/[a-zA-Z]/g) || [];
  
  const thaiRatio = thaiChars.length / text.length;
  const englishRatio = englishChars.length / text.length;
  
  if (thaiRatio > 0.3 && englishRatio > 0.3) {
    return "Mixed (Thai/English)";
  }
  if (thaiRatio > 0.3) {
    return "Thai";
  }
  if (englishRatio > 0.3) {
    return "English";
  }
  return "Unknown";
}

export async function translateText(text: string, sourceLang: 'en' | 'kn' | 'auto', targetLang: 'en' | 'kn'): Promise<string> {
  if (!text) return text;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract translated text from the nested array structure
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('');
    }
  } catch (error) {
    console.error('Translation failed:', error);
  }
  
  return text; // Fallback to original text if translation fails
}

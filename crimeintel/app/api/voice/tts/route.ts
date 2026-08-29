import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, language_code = 'hi-IN' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const sarvamKey = process.env.sarvam;
    if (!sarvamKey) {
      return NextResponse.json({ error: 'Sarvam API key not found' }, { status: 500 });
    }
    
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        language_code: language_code,
        speaker: 'meera',
        model: 'bulbul:v3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam TTS API error:', errorText);
      return NextResponse.json({ error: `Sarvam API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    if (data.audios && data.audios.length > 0) {
      const audioBase64 = data.audios[0];
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length.toString()
        }
      });
    }
    
    return NextResponse.json(data);
  } catch(error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

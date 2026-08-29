import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const sarvamFormData = new FormData();
    sarvamFormData.append('file', file);
    sarvamFormData.append('model', 'saaras:v3');
    sarvamFormData.append('mode', 'transcribe');

    const sarvamKey = process.env.sarvam;
    if (!sarvamKey) {
      return NextResponse.json({ error: 'Sarvam API key not found' }, { status: 500 });
    }

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
      },
      body: sarvamFormData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam API error:', errorText);
      return NextResponse.json({ error: `Sarvam API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('STT Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

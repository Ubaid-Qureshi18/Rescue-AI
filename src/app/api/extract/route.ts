import { NextRequest, NextResponse } from 'next/server';
import { extractRequirements } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input) return NextResponse.json({ error: 'Input required' }, { status: 400 });
    const extracted = await extractRequirements(input);
    return NextResponse.json({ extracted });
  } catch (e) {
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}

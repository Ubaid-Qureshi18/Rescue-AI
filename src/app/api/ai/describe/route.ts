import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: NextRequest) {
  const { title, description, category, quantity, estimatedValue, condition, location, departmentName } = await req.json();

  if (!genAI) {
    return NextResponse.json({
      description: `${title || 'Organizational Resource'} — a ${condition?.toLowerCase() || 'good'} condition ${category?.toLowerCase() || 'general'} asset located at ${location || 'Campus Store'}. Quantity: ${quantity || 1} unit(s). Estimated value: ₹${estimatedValue?.toLocaleString('en-IN') || '5,000'}. Ideal for inter-departmental reallocation and workshop usage.`,
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Generate a rich, professional 2-sentence description for this organizational resource asset:
Name: ${title}
Category: ${category}
Condition: ${condition}
Quantity: ${quantity} units
Location: ${location}
Department: ${departmentName}
Estimated Value: ₹${estimatedValue?.toLocaleString('en-IN')}
Additional Info: ${description || 'Not provided'}

Write a concise, professional description highlighting what this asset is, its current state, and potential use cases for other departments. Sound like an asset catalog entry. 2 sentences max.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ description: text });
  } catch (e) {
    console.error('AI describe error:', e);
    return NextResponse.json({
      description: `${title} is a ${condition.toLowerCase()} condition ${category.toLowerCase()} resource available at ${location}, ${departmentName}. This asset (${quantity} unit${quantity !== 1 ? 's' : ''}) is available for inter-departmental allocation at an estimated value of ₹${estimatedValue?.toLocaleString('en-IN')}.`,
    });
  }
}

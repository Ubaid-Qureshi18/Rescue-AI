import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  // Fetch real DB state to ground the AI
  const [resources, departments, requirements, impacts] = await Promise.all([
    prisma.resource.findMany({ include: { department: true } }),
    prisma.department.findMany({ include: { resources: true } }),
    prisma.requirement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.impact.findMany({ take: 20 }),
  ]);

  const available = resources.filter(r => r.status === 'AVAILABLE');
  const reserved = resources.filter(r => r.status === 'RESERVED');
  const totalSavings = impacts.reduce((s, i) => s + i.estimatedSavings, 0);

  const contextSummary = `
RESCUE AI Database State (REAL DATA — use ONLY these numbers):
- Total resources: ${resources.length}
- Available resources: ${available.length}
- Reserved resources: ${reserved.length}
- Departments: ${departments.map(d => `${d.name} (${d.resources.length} resources)`).join(', ')}
- Total procurement avoided: ₹${(totalSavings / 100000).toFixed(2)}L
- Recent requirements: ${requirements.slice(0, 5).map(r => `"${r.title}" (${r.status})`).join(', ')}
- Available by category: ${
    Object.entries(
      available.reduce((acc: Record<string, number>, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.quantity;
        return acc;
      }, {})
    ).map(([k, v]) => `${v} ${k}`).join(', ')
  }
- Top available assets: ${available.slice(0, 8).map(r => `${r.name} (${r.quantity} units, ${r.department.name})`).join('; ')}
`;

  if (!genAI) {
    // Fallback rule-based responses
    const lower = message.toLowerCase();
    let response = "I'm RESCUE AI, your resource recovery assistant. ";
    if (lower.includes('laptop') || lower.includes('computer')) {
      const laptops = available.filter(r => r.name.toLowerCase().includes('laptop') || r.category === 'Electronics');
      response += `We have ${laptops.length} electronics resources available. ${laptops.slice(0,3).map(r => `${r.name} (${r.quantity} units at ${r.department.name})`).join(', ')}.`;
    } else if (lower.includes('department')) {
      response += `We have ${departments.length} departments: ${departments.map(d => `${d.name} with ${d.resources.length} resources`).join(', ')}.`;
    } else if (lower.includes('saving') || lower.includes('impact')) {
      response += `Total procurement avoided: ₹${(totalSavings / 100000).toFixed(2)}L across all departments.`;
    } else {
      response += `We have ${available.length} resources available across ${departments.length} departments. Total value preserved: ₹${(totalSavings / 100000).toFixed(2)}L. What specific resource are you looking for?`;
    }
    return NextResponse.json({ reply: response });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are RESCUE AI's intelligent assistant. You help users discover and understand organizational resources.

${contextSummary}

RULES:
1. ONLY use numbers and data from the database context above
2. Be conversational, friendly and concise (2-4 sentences max)
3. Always suggest actionable next steps
4. If asked about something not in the data, say so honestly
5. Format numbers in Indian style (₹, Lakhs)
6. Never fabricate resource names or quantities not in the data
`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am RESCUE AI assistant, ready to help with real organizational resource data.' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('Chat AI error:', e);
    return NextResponse.json({
      reply: `I have ${available.length} resources available across ${departments.length} departments. How can I help you find what you need?`,
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: NextRequest) {
  const { title, extractedRequirement } = await req.json();

  // Pull real DB state
  const resources = await prisma.resource.findMany({
    where: { status: 'AVAILABLE' },
    include: { department: true },
  });

  const categoryMap: Record<string, number> = {};
  for (const r of resources) {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + r.quantity;
  }

  const relevantResources = resources.filter(r => {
    const name = r.name.toLowerCase();
    const title_lower = (extractedRequirement?.title || title || '').toLowerCase();
    return (
      name.includes('laptop') || name.includes('projector') || name.includes('chair') ||
      name.includes('room') || name.includes('camera') || name.includes('arduino') ||
      r.category === 'Electronics' || r.category === 'Space' || r.category === 'Capacity'
    );
  });

  // Calculate initial risk score based purely on inventory vs need
  const needed = {
    laptops: extractedRequirement?.laptops || 0,
    projectors: extractedRequirement?.projectors || 0,
    chairs: extractedRequirement?.chairs || 0,
    rooms: (extractedRequirement?.rooms || 0) + (extractedRequirement?.classrooms || 0),
  };

  const available = {
    laptops: resources.filter(r => r.name.toLowerCase().includes('laptop')).reduce((s, r) => s + r.quantity, 0),
    projectors: resources.filter(r => r.name.toLowerCase().includes('projector')).reduce((s, r) => s + r.quantity, 0),
    chairs: resources.filter(r => r.name.toLowerCase().includes('chair') || r.category === 'Furniture').reduce((s, r) => s + r.quantity, 0),
    rooms: resources.filter(r => r.category === 'Space' || r.category === 'Capacity').reduce((s, r) => s + r.quantity, 0),
  };

  let coverageScore = 0;
  let totalNeeded = 0;
  let covered = 0;

  for (const [key, needed_qty] of Object.entries(needed)) {
    if (needed_qty > 0) {
      totalNeeded++;
      if ((available as any)[key] >= needed_qty) covered++;
      else if ((available as any)[key] > 0) covered += 0.5;
    }
  }

  const baseRisk = totalNeeded > 0 ? Math.round((1 - covered / totalNeeded) * 100) : 50;

  if (!genAI) {
    const risk = baseRisk < 30 ? 'LOW' : baseRisk < 60 ? 'MEDIUM' : 'HIGH';
    return NextResponse.json({
      riskLevel: risk,
      riskScore: baseRisk,
      headline: risk === 'LOW' 
        ? 'High probability existing resources can cover this need'
        : risk === 'MEDIUM' 
        ? 'Partial coverage likely — some procurement may be needed'
        : 'Limited internal resources match this requirement',
      reasoning: `Based on current inventory: ${resources.length} available resources across ${Object.keys(categoryMap).length} categories. ${covered} of ${totalNeeded} resource types appear to have coverage.`,
      suggestions: [
        'Search all departments before purchasing',
        'Consider temporary allocation from another department',
        'Check maintenance queue for items that may become available',
      ],
      canRescue: risk !== 'HIGH',
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a procurement risk analyzer for an AI resource recovery system.

Analyze this resource requirement against the REAL available inventory:

Requirement: "${title}"
Items needed: ${JSON.stringify(needed)}
Available in DB: ${JSON.stringify(available)}
Total resources in DB: ${resources.length}
Categories available: ${JSON.stringify(categoryMap)}

Return ONLY valid JSON:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskScore": 0-100 (0=easy to cover internally, 100=must purchase),
  "headline": "one sentence summary of rescue probability",
  "reasoning": "2-3 sentences explaining the analysis using ONLY the real numbers above",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "canRescue": true/false
}

LOW risk = 70%+ needs can be covered internally. HIGH risk = <30% coverage.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    const analysis = JSON.parse(text);
    return NextResponse.json(analysis);
  } catch (e) {
    console.error('Risk analysis error:', e);
    const risk = baseRisk < 30 ? 'LOW' : baseRisk < 60 ? 'MEDIUM' : 'HIGH';
    return NextResponse.json({
      riskLevel: risk,
      riskScore: baseRisk,
      headline: 'Analysis based on current inventory levels',
      reasoning: `We found ${resources.length} available resources. Initial assessment shows ${Math.round((1 - baseRisk / 100) * 100)}% potential coverage of this requirement through existing departmental assets.`,
      suggestions: ['Search all departments', 'Review reserved items for upcoming releases', 'Check alternative resources'],
      canRescue: risk !== 'HIGH',
    });
  }
}

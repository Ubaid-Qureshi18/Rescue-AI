import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const requirements = await prisma.requirement.findMany({
      include: {
        user: true,
        matches: {
          include: { resource: { include: { department: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ requirements });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rawInput, extracted, needDate, userId } = await req.json();

    const neededFrom = new Date(needDate || Date.now());
    const neededUntil = new Date(neededFrom.getTime() + 8 * 60 * 60 * 1000); // +8 hours default

    // Estimate purchase cost if not provided
    let estimatedCost = extracted.estimatedCost || 0;
    if (!estimatedCost) {
      const costEstimates: Record<string, number> = {
        laptops: 50000,
        projectors: 25000,
        chairs: 800,
        tables: 5000,
        microphones: 8000,
        cameras: 60000,
        arduinoKits: 4000,
        rooms: 10000,
        classrooms: 8000,
      };
      for (const [key, unitCost] of Object.entries(costEstimates)) {
        const qty = (extracted as any)[key];
        if (qty) estimatedCost += qty * unitCost;
      }
    }

    const requirement = await prisma.requirement.create({
      data: {
        userId: userId || 'user-req',
        title: extracted.title || 'Resource Requirement',
        description: extracted.purpose || rawInput,
        rawInput,
        structuredData: JSON.stringify(extracted),
        neededFrom,
        neededUntil,
        status: 'PENDING',
        estimatedCost,
      },
    });

    // Now run matching
    const matchResp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementId: requirement.id }),
    });

    return NextResponse.json({
      requirementId: requirement.id,
      requirement,
      matchStatus: matchResp.ok ? 'ok' : 'pending',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 });
  }
}

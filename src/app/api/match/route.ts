import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateMatchScore, buildRescuePlan, type MatchResult } from '@/lib/matching';
import type { StructuredRequirement } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { requirementId } = await req.json();

    if (!requirementId) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const extracted: StructuredRequirement = JSON.parse(requirement.structuredData || '{}');

    // Get all available resources from DB
    const resources = await prisma.resource.findMany({
      where: { status: 'AVAILABLE' },
      include: { department: true },
    });

    const neededFrom = new Date(requirement.neededFrom);
    const neededUntil = new Date(requirement.neededUntil);

    // Build list of requested item requirements
    const itemRequests: Array<{ key: string; label: string; needed: number; keywords: string[] }> = [];

    const itemMap: Array<{ key: keyof StructuredRequirement; label: string; keywords: string[] }> = [
      { key: 'laptops', label: 'Laptops', keywords: ['laptop', 'notebook', 'macbook'] },
      { key: 'desktops', label: 'Desktops', keywords: ['desktop', 'pc', 'workstation'] },
      { key: 'projectors', label: 'Projectors', keywords: ['projector', 'display', 'screen'] },
      { key: 'chairs', label: 'Chairs', keywords: ['chair', 'seating', 'stool'] },
      { key: 'tables', label: 'Tables', keywords: ['table', 'desk', 'workbench'] },
      { key: 'microphones', label: 'Microphones', keywords: ['mic', 'microphone', 'audio'] },
      { key: 'cameras', label: 'Cameras', keywords: ['camera', 'dslr', 'webcam'] },
      { key: 'arduinoKits', label: 'Arduino Kits', keywords: ['arduino', 'kit', 'robotics'] },
      { key: 'rooms', label: 'Rooms', keywords: ['room', 'hall', 'space', 'studio'] },
      { key: 'classrooms', label: 'Classrooms', keywords: ['classroom', 'lab', 'room'] },
    ];

    for (const { key, label, keywords } of itemMap) {
      const qty = (extracted as any)[key];
      if (typeof qty === 'number' && qty > 0) {
        itemRequests.push({ key: key as string, label, needed: qty, keywords });
      }
    }

    if (extracted.otherItems && Array.isArray(extracted.otherItems)) {
      for (const item of extracted.otherItems) {
        if (item.name && item.quantity > 0) {
          const kw = item.name.toLowerCase().split(/\s+/);
          itemRequests.push({ key: item.name, label: item.name, needed: item.quantity, keywords: kw });
        }
      }
    }

    const matchResults: MatchResult[] = [];
    const matchedResourceIds = new Set<string>();

    for (const reqItem of itemRequests) {
      // Find candidate resources matching keywords/category
      const candidates = resources.filter(res => {
        const name = res.name.toLowerCase();
        const tags = res.tags.toLowerCase();
        const category = res.category.toLowerCase();
        const desc = res.description.toLowerCase();

        return reqItem.keywords.some(kw =>
          name.includes(kw) || tags.includes(kw) || desc.includes(kw) ||
          (reqItem.key === 'rooms' || reqItem.key === 'classrooms' ? category === 'space' : false)
        );
      });

      for (const candidate of candidates) {
        const scored = calculateMatchScore(candidate as any, extracted, reqItem.key, reqItem.needed, neededFrom, neededUntil);
        if (scored.matchScore >= 40) {
          matchResults.push(scored);
          matchedResourceIds.add(candidate.id);
        }
      }

      // If no candidate found, search for alternative resources in same category
      if (candidates.length === 0) {
        const alternatives = resources.filter(r => !matchedResourceIds.has(r.id));
        for (const alt of alternatives.slice(0, 2)) {
          const altScored = calculateMatchScore(alt as any, extracted, reqItem.key, reqItem.needed, neededFrom, neededUntil);
          altScored.isAlternative = true;
          altScored.alternativeFor = reqItem.label;
          altScored.reason = `Suggested alternative for ${reqItem.label}: ${alt.name} at ${alt.department.name}`;
          matchResults.push(altScored);
        }
      }
    }

    // Sort by match score
    matchResults.sort((a, b) => b.matchScore - a.matchScore);

    // Delete existing matches for this requirement
    await prisma.match.deleteMany({ where: { requirementId } });

    // Save top matches to DB
    const savedMatches = [];
    const seenKeys = new Set<string>();

    for (const m of matchResults) {
      const uniqueKey = `${m.requirementKey}-${m.resource.id}`;
      if (seenKeys.has(uniqueKey)) continue;
      seenKeys.add(uniqueKey);

      const match = await prisma.match.create({
        data: {
          requirementId,
          resourceId: m.resource.id,
          matchScore: m.matchScore,
          quantityMatched: m.quantityMatched,
          reason: m.reason,
          status: 'PENDING',
        },
      });
      savedMatches.push({ ...match, resource: m.resource });
    }

    // Build complete Rescue Plan
    const rescuePlan = buildRescuePlan(matchResults, extracted, requirement.estimatedCost);

    // Update requirement status
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { status: rescuePlan.requirementFulfillmentPct > 0 ? 'MATCHED' : 'PENDING' },
    });

    return NextResponse.json({
      success: true,
      requirementId,
      matchesCount: savedMatches.length,
      rescuePlan,
      estimatedSavings: rescuePlan.estimatedSavings,
    });
  } catch (e: any) {
    console.error('Match API error:', e);
    return NextResponse.json({ error: e.message || 'Matching failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { requirementId, matchId, matchIds, userId } = await req.json();

    const targetMatchIds: string[] = matchIds || (matchId ? [matchId] : []);

    if (targetMatchIds.length === 0 && !requirementId) {
      return NextResponse.json({ error: 'Missing matchId or requirementId' }, { status: 400 });
    }

    let matchesToApprove: any[] = [];

    if (targetMatchIds.length > 0) {
      matchesToApprove = await prisma.match.findMany({
        where: { id: { in: targetMatchIds } },
        include: { resource: true, requirement: true },
      });
    } else if (requirementId) {
      matchesToApprove = await prisma.match.findMany({
        where: { requirementId, status: 'PENDING' },
        include: { resource: true, requirement: true },
      });
    }

    if (matchesToApprove.length === 0) {
      return NextResponse.json({ error: 'No matches found to reserve' }, { status: 404 });
    }

    const createdReservations = [];
    const createdImpacts = [];

    for (const match of matchesToApprove) {
      // 1. Update Match status to APPROVED
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'APPROVED' },
      });

      // 2. Update Resource status to RESERVED
      await prisma.resource.update({
        where: { id: match.resourceId },
        data: { status: 'RESERVED' },
      });

      // 3. Create Reservation record if not already exists
      const existingRes = await prisma.reservation.findUnique({
        where: { matchId: match.id },
      });

      if (!existingRes) {
        const res = await prisma.reservation.create({
          data: {
            resourceId: match.resourceId,
            matchId: match.id,
            startTime: match.requirement.neededFrom,
            endTime: match.requirement.neededUntil,
            status: 'ACTIVE',
            notes: `Rescued for requirement: ${match.requirement.title}`,
          },
        });
        createdReservations.push(res);
      }

      // 4. Calculate & create Impact record if not exists
      const existingImpact = await prisma.impact.findUnique({
        where: { matchId: match.id },
      });

      if (!existingImpact) {
        const estimatedSavings = match.resource.estimatedValue * (match.quantityMatched || 1);
        const estimatedWasteAvoided = (match.quantityMatched || 1) * 8.5; // ~8.5kg material avoided per asset
        const estimatedCO2Avoided = estimatedSavings * 0.005; // ~5kg CO2e per 1000 INR

        const impact = await prisma.impact.create({
          data: {
            matchId: match.id,
            estimatedSavings,
            estimatedWasteAvoided,
            estimatedCO2Avoided,
          },
        });
        createdImpacts.push(impact);
      }
    }

    // 5. Update parent requirement status to FULFILLED
    const parentReqId = matchesToApprove[0].requirementId;
    await prisma.requirement.update({
      where: { id: parentReqId },
      data: { status: 'FULFILLED' },
    });

    return NextResponse.json({
      success: true,
      approvedMatchesCount: matchesToApprove.length,
      reservationsCount: createdReservations.length,
      impactsCount: createdImpacts.length,
    });
  } catch (e: any) {
    console.error('Reservation error:', e);
    return NextResponse.json({ error: e.message || 'Failed to process reservation' }, { status: 500 });
  }
}

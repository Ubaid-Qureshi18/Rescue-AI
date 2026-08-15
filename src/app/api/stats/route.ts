import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/stats — returns live stats for landing page
export async function GET() {
  const [resources, impacts, departments] = await Promise.all([
    prisma.resource.findMany(),
    prisma.impact.findMany(),
    prisma.department.findMany(),
  ]);

  const totalSavings = impacts.reduce((s, i) => s + i.estimatedSavings, 0);
  const totalCO2 = impacts.reduce((s, i) => s + i.estimatedCO2Avoided, 0);
  const rescuedCount = impacts.length;

  // Calculate utilization
  const available = resources.filter(r => r.status === 'AVAILABLE').length;
  const utilizationPct = resources.length > 0
    ? Math.round(((resources.length - available) / resources.length) * 100)
    : 0;

  return NextResponse.json({
    totalResources: resources.length,
    rescuedCount,
    totalSavings,
    totalCO2: Math.round(totalCO2),
    departments: departments.length,
    utilizationPct,
  });
}

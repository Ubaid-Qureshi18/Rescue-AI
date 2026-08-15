import { prisma } from '@/lib/db';
import ImpactClient from './ImpactClient';

export const dynamic = 'force-dynamic';

export default async function ImpactPage() {
  const [impacts, requirements, resources, departments] = await Promise.all([
    prisma.impact.findMany({
      include: {
        match: {
          include: {
            resource: { include: { department: true } },
            requirement: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.requirement.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.resource.findMany({ include: { department: true } }),
    prisma.department.findMany({ include: { resources: true } }),
  ]);

  const totalSavings = impacts.reduce((s, i) => s + i.estimatedSavings, 0);
  const totalCO2 = impacts.reduce((s, i) => s + i.estimatedCO2Avoided, 0);
  const totalWaste = impacts.reduce((s, i) => s + i.estimatedWasteAvoided, 0);
  const fulfilledCount = requirements.filter(r => r.status === 'FULFILLED').length;
  const matchedCount = impacts.length;

  // Monthly trend (last 6 months simulated)
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const trendData = months.map((month, i) => ({
    month,
    savings: Math.round((totalSavings / 8) * (0.3 + i * 0.15)),
    matches: Math.round(matchedCount / 8 * (0.3 + i * 0.15)),
    co2: Math.round((totalCO2 / 8) * (0.3 + i * 0.15)),
  }));

  // Dept contribution
  const deptContribution = departments.map(dept => ({
    name: dept.name.split(' ')[0],
    fullName: dept.name,
    color: dept.color,
    value: dept.resources.reduce((s, r) => s + r.estimatedValue * r.quantity, 0),
    resourceCount: dept.resources.length,
  }));

  return (
    <ImpactClient
      totalSavings={totalSavings}
      totalCO2={Math.round(totalCO2)}
      totalWaste={Math.round(totalWaste)}
      fulfilledCount={fulfilledCount}
      matchedCount={matchedCount}
      impacts={impacts as any}
      trendData={trendData}
      deptContribution={deptContribution}
      totalResources={resources.length}
    />
  );
}

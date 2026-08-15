import { prisma } from '@/lib/db';
import { generateGroundedInsights } from '@/lib/ai';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [resources, requirements, matches, impacts, departments] = await Promise.all([
    prisma.resource.findMany({ include: { department: true } }),
    prisma.requirement.findMany({ include: { user: true } }),
    prisma.match.findMany({ include: { resource: { include: { department: true } }, requirement: true } }),
    prisma.impact.findMany({ include: { match: true } }),
    prisma.department.findMany({ include: { resources: true } }),
  ]);

  const totalSavings = impacts.reduce((s, i) => s + i.estimatedSavings, 0);
  const totalCO2 = impacts.reduce((s, i) => s + i.estimatedCO2Avoided, 0);
  const rescuedCount = matches.filter(m => m.status === 'APPROVED').length;

  // Category utilization
  const categoryMap = new Map<string, { total: number; reserved: number }>();
  for (const r of resources) {
    const curr = categoryMap.get(r.category) || { total: 0, reserved: 0 };
    curr.total += r.quantity;
    if (r.status === 'RESERVED') curr.reserved += r.quantity;
    categoryMap.set(r.category, curr);
  }
  const categoryUtilization = Array.from(categoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    utilization: data.total > 0 ? Math.round(((data.total - data.reserved) / data.total) * 100) : 0,
    total: data.total,
  }));

  // Department resource counts
  const deptData = departments.map(d => ({
    id: d.id,
    name: d.name,
    color: d.color,
    resourceCount: d.resources.length,
    totalValue: d.resources.reduce((s, r) => s + r.estimatedValue * r.quantity, 0),
  }));

  // Generate grounded AI insights from actual DB resources
  const insights = await generateGroundedInsights(resources as any);

  return {
    stats: {
      totalResources: resources.length,
      rescuedCount,
      totalSavings,
      totalCO2: Math.round(totalCO2),
      requirementCount: requirements.length,
    },
    categoryUtilization,
    departments: deptData,
    recentMatches: matches.slice(-5).reverse(),
    insights,
    requirements: requirements.slice(-5).reverse(),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}

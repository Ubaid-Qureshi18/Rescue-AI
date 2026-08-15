import { prisma } from '@/lib/db';
import { buildRescuePlan } from '@/lib/matching';
import MatchClient from './MatchClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function inferRequirementKey(resource: any): string {
  const name = resource.name.toLowerCase();
  const tags = (resource.tags || '').toLowerCase();
  const category = (resource.category || '').toLowerCase();

  if (name.includes('laptop') || tags.includes('laptop')) return 'laptops';
  if (name.includes('projector') || tags.includes('projector')) return 'projectors';
  if (name.includes('chair') || tags.includes('chair')) return 'chairs';
  if (name.includes('table') || name.includes('desk') || tags.includes('table')) return 'tables';
  if (name.includes('mic') || tags.includes('microphone')) return 'microphones';
  if (name.includes('camera') || tags.includes('camera')) return 'cameras';
  if (name.includes('arduino') || tags.includes('arduino')) return 'arduinoKits';
  if (category === 'space' || tags.includes('room') || tags.includes('classroom') || tags.includes('hall') || name.includes('lab') || name.includes('hall')) {
    return 'classrooms';
  }
  return resource.name;
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      user: true,
      matches: {
        include: {
          resource: { include: { department: true } },
          impact: true,
        },
        orderBy: { matchScore: 'desc' },
      },
    },
  });

  if (!requirement) notFound();

  const extracted = JSON.parse(requirement.structuredData || '{}');

  const matchResults = requirement.matches.map(m => ({
    resource: m.resource as any,
    matchScore: m.matchScore,
    quantityMatched: m.quantityMatched,
    availabilityScore: 95,
    compatibilityScore: 95,
    quantityScore: m.quantityMatched > 0 ? 100 : 70,
    locationScore: 85,
    conditionScore: m.resource.condition === 'Excellent' ? 100 : 85,
    costBenefitScore: 90,
    reason: m.reason,
    isBundle: false,
    requirementKey: inferRequirementKey(m.resource),
    matchId: m.id,
  }));

  const rescuePlan = buildRescuePlan(matchResults, extracted, requirement.estimatedCost);

  return (
    <MatchClient
      requirement={requirement as any}
      extracted={extracted}
      rescuePlan={rescuePlan}
      matchResults={matchResults as any}
    />
  );
}

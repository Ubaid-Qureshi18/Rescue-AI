import { prisma } from '@/lib/db';
import NeedsClient from './NeedsClient';

export const dynamic = 'force-dynamic';

export default async function NeedsPage() {
  const requirements = await prisma.requirement.findMany({
    include: {
      user: true,
      matches: {
        include: {
          resource: { include: { department: true } },
          impact: true,
        },
        orderBy: { matchScore: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <NeedsClient requirements={requirements as any} />;
}

import { prisma } from '@/lib/db';
import RequestsClient from './RequestsClient';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const requirements = await prisma.requirement.findMany({
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
    orderBy: { createdAt: 'desc' },
  });

  return <RequestsClient requirements={requirements as any} />;
}

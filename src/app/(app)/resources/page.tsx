import { prisma } from '@/lib/db';
import ResourcesClient from './ResourcesClient';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const [resources, departments] = await Promise.all([
    prisma.resource.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.findMany(),
  ]);

  return <ResourcesClient resources={resources as any} departments={departments} />;
}

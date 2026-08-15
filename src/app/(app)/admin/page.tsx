import { prisma } from '@/lib/db';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [departments, resources, users, reservations, matches] = await Promise.all([
    prisma.department.findMany({
      include: { resources: true, users: true },
    }),
    prisma.resource.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      include: { department: true },
    }),
    prisma.reservation.findMany({
      include: { resource: { include: { department: true } } },
    }),
    prisma.match.findMany({
      include: { requirement: true, resource: true },
    }),
  ]);

  const totalValue = resources.reduce((sum, r) => sum + r.estimatedValue * r.quantity, 0);
  const reservedCount = resources.filter(r => r.status === 'RESERVED').length;

  return (
    <AdminClient
      departments={departments as any}
      resources={resources as any}
      users={users as any}
      reservations={reservations as any}
      matches={matches as any}
      totalValue={totalValue}
      reservedCount={reservedCount}
    />
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (category) where.category = category;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ resources });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if bulk insert
    if (Array.isArray(body.resources)) {
      const created = [];
      for (const item of body.resources) {
        // Resolve departmentId or default to first dept
        let deptId = item.departmentId;
        if (!deptId && item.departmentName) {
          const dept = await prisma.department.findFirst({
            where: { name: { contains: item.departmentName } },
          });
          if (dept) deptId = dept.id;
        }
        if (!deptId) {
          const defaultDept = await prisma.department.findFirst();
          deptId = defaultDept?.id || 'dept-ce';
        }

        const res = await prisma.resource.create({
          data: {
            name: item.name,
            category: item.category || 'Electronics',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            condition: item.condition || 'Good',
            location: item.location || 'Central Store',
            building: item.building || 'Main Block',
            departmentId: deptId,
            status: item.status || 'AVAILABLE',
            estimatedValue: Number(item.estimatedValue) || 10000,
            tags: item.tags || item.name.toLowerCase(),
            specifications: typeof item.specifications === 'object' ? JSON.stringify(item.specifications) : (item.specifications || '{}'),
          },
        });
        created.push(res);
      }
      return NextResponse.json({ success: true, count: created.length, resources: created });
    }

    // Single resource creation
    const { name, category, description, quantity, condition, location, building, departmentId, estimatedValue, tags, specifications } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    let resolvedDeptId = departmentId;
    if (!resolvedDeptId) {
      const defaultDept = await prisma.department.findFirst();
      resolvedDeptId = defaultDept?.id || 'dept-ce';
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        category,
        description: description || '',
        quantity: Number(quantity) || 1,
        condition: condition || 'Good',
        location: location || 'Campus',
        building: building || 'Main Block',
        departmentId: resolvedDeptId,
        status: 'AVAILABLE',
        estimatedValue: Number(estimatedValue) || 5000,
        tags: tags || name.toLowerCase(),
        specifications: typeof specifications === 'object' ? JSON.stringify(specifications) : (specifications || '{}'),
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (e: any) {
    console.error('Resource POST error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create resource' }, { status: 500 });
  }
}

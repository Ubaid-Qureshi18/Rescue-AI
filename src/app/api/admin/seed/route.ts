import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const cwd = process.cwd();
    const command = 'npm run seed';
    const { stdout, stderr } = await execPromise(command, { cwd });

    return NextResponse.json({
      success: true,
      message: 'Database successfully re-seeded!',
      output: stdout,
    });
  } catch (e: any) {
    console.error('Seed reset error:', e);
    return NextResponse.json({ error: e.message || 'Seed reset failed' }, { status: 500 });
  }
}

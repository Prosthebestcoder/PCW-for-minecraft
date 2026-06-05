import { enqueueBuildRequest } from '@/lib/build/http';

export const runtime = 'nodejs';

export async function POST(request) {
  return enqueueBuildRequest(request);
}

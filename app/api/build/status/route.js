import { getBuildStatusRequest } from '@/lib/build/http';

export const runtime = 'nodejs';

export async function GET(request) {
  return getBuildStatusRequest(request);
}

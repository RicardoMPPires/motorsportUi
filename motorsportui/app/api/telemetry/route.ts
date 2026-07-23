import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ponytail: store latest on globalThis; frontend polls GET (SSE through Next
// buffers and never flushes — refresh only showed the one frame sent on connect)
type Hub = { latest: unknown }

const hub: Hub = ((globalThis as typeof globalThis & { __telemetryHub?: Hub })
  .__telemetryHub ??= { latest: null })

export async function POST(request: NextRequest) {
  hub.latest = await request.json()
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  if (!hub.latest) {
    return new NextResponse(null, { status: 204 })
  }
  return NextResponse.json(hub.latest, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

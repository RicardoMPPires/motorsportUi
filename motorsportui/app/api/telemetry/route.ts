import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ponytail: globalThis so HMR / route re-evals don't drop live subscribers
// (module-level Set was why refresh showed one frame and live stayed dead)
type Hub = {
  latest: unknown
  clients: Set<ReadableStreamDefaultController>
}

const hub: Hub = ((globalThis as typeof globalThis & { __telemetryHub?: Hub })
  .__telemetryHub ??= { latest: null, clients: new Set() })

function send(controller: ReadableStreamDefaultController, data: unknown) {
  try {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
  } catch {
    hub.clients.delete(controller)
  }
}

export async function POST(request: NextRequest) {
  hub.latest = await request.json()
  for (const controller of hub.clients) send(controller, hub.latest)
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  let self!: ReadableStreamDefaultController
  const stream = new ReadableStream({
    start(controller) {
      self = controller
      hub.clients.add(controller)
      if (hub.latest) send(controller, hub.latest)
    },
    cancel() {
      hub.clients.delete(self)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

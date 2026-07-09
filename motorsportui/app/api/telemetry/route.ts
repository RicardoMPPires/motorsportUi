import { NextRequest, NextResponse } from 'next/server'

// ponytail: in-memory single-process pub/sub — fine for `next dev`,
// won't survive multi-instance/serverless deploys.
let latest: unknown = null
const clients = new Set<ReadableStreamDefaultController>()

function send(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(request: NextRequest) {
  latest = await request.json()
  for (const controller of clients) send(controller, latest)
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  let self: ReadableStreamDefaultController
  const stream = new ReadableStream({
    start(controller) {
      self = controller
      clients.add(controller)
      if (latest) send(controller, latest)
    },
    cancel() {
      clients.delete(self)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

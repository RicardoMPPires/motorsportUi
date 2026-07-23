import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ponytail: file beat in-memory — Next isolates don't share globalThis between
// POST (python) and GET (browser poll), so polls always came back empty/204
const FILE = path.join(process.cwd(), '.telemetry-latest.json')

export async function POST(request: NextRequest) {
  const body = await request.json()
  writeFileSync(FILE, JSON.stringify(body))
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  if (!existsSync(FILE)) {
    return new NextResponse(null, { status: 204 })
  }
  const raw = readFileSync(FILE, 'utf8')
  if (!raw) {
    return new NextResponse(null, { status: 204 })
  }
  return new NextResponse(raw, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

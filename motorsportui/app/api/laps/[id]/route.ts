import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  try {
    const lap = await prisma.lap.findUnique({
      where: { id: parseInt(id) },
      include: { telemetryPackets: true },
    })
    if (!lap) {
      return NextResponse.json({ error: 'Lap not found' }, { status: 404 })
    }
    return NextResponse.json(lap)
  } catch (error) {
    console.error('Error fetching lap:', error)
    return NextResponse.json({ error: 'Failed to fetch lap' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  try {
    const body = await request.json()
    const { isBestLap } = body

    // Unmark any other lap as best first
    await prisma.lap.updateMany({
      where: { isBestLap: true },
      data: { isBestLap: false },
    })

    const lap = await prisma.lap.update({
      where: { id: parseInt(id) },
      data: { isBestLap },
      include: { telemetryPackets: true },
    })

    return NextResponse.json(lap)
  } catch (error) {
    console.error('Error updating lap:', error)
    return NextResponse.json({ error: 'Failed to update lap' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  try {
    await prisma.lap.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ message: 'Lap deleted successfully' })
  } catch (error) {
    console.error('Error deleting lap:', error)
    return NextResponse.json({ error: 'Failed to delete lap' }, { status: 500 })
  }
}

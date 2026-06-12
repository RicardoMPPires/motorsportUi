import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../lib/prisma'

export async function GET() {
  try {
    const laps = await prisma.lap.findMany({
      include: {
        telemetryPackets: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(laps)
  } catch (error) {
    console.error('Error fetching laps:', error)
    return NextResponse.json({ error: 'Failed to fetch laps' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lapNumber, driverName, circuitName, car, session, run, telemetryPackets, lapTime } = body

    const lap = await prisma.lap.create({
      data: {
        lapNumber,
        driverName,
        circuitName,
        car,
        session,
        run,
        lapTime,
        telemetryPackets: {
          create: telemetryPackets.map((packet: any) => ({
            packetId: packet.packetId,
            gas: packet.gas,
            brake: packet.brake,
            fuel: packet.fuel,
            gear: packet.gear,
            rpms: packet.rpms,
            steerAngle: packet.steerAngle,
            speedKmh: packet.speedKmh,
            lapNumber: packet.lapNumber,
            time: packet.time,
          })),
        },
      },
      include: {
        telemetryPackets: true,
      },
    })

    return NextResponse.json(lap, { status: 201 })
  } catch (error) {
    console.error('Error creating lap:', error)
    return NextResponse.json({ error: 'Failed to create lap' }, { status: 500 })
  }
}

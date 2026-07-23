import mmap
import ctypes
import time
import os
import json
import sys
import urllib.request
import urllib.error

TELEMETRY_URL = os.environ.get("TELEMETRY_URL", "http://localhost:3000/api/telemetry")

_post_ok = None


def post_telemetry(payload):
    global _post_ok
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TELEMETRY_URL, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        urllib.request.urlopen(req, timeout=0.5).close()
        if _post_ok is not True:
            print(f"Posting OK → {TELEMETRY_URL}")
            _post_ok = True
        return True
    except (urllib.error.URLError, OSError) as e:
        if _post_ok is not False:
            print(f"POST failed ({e}). Is the Next app on :3000?")
            _post_ok = False
        return False

# Define C-types matching the C++ structs inside Assetto Corsa's engine
c_int32 = ctypes.c_int32
c_float = ctypes.c_float
c_wchar = ctypes.c_wchar

class SPageFilePhysics(ctypes.Structure):
    _pack_ = 4
    _fields_ =[
        ('packetId', c_int32),
        ('gas', c_float),
        ('brake', c_float),
        ('fuel', c_float),
        ('gear', c_int32),
        ('rpms', c_int32),
        ('steerAngle', c_float),
        ('speedKmh', c_float),
        ('velocity', c_float * 3),
        ('accG', c_float * 3),
        ('wheelSlip', c_float * 4),
        ('wheelLoad', c_float * 4),
        ('wheelsPressure', c_float * 4),
        ('wheelAngularSpeed', c_float * 4),
        ('tyreWear', c_float * 4),
        ('tyreDirtyLevel', c_float * 4),
        ('tyreCoreTemperature', c_float * 4),
        ('camberRAD', c_float * 4),
        ('suspensionTravel', c_float * 4),
        ('drs', c_float),
        ('tc', c_float),
        ('heading', c_float),
        ('pitch', c_float),
        ('roll', c_float),
        ('cgHeight', c_float),
        ('carDamage', c_float * 5),
        ('numberOfTyresOut', c_int32),
        ('pitLimiterOn', c_int32),
        ('abs', c_float)
    ]

class SPageFileGraphic(ctypes.Structure):
    _pack_ = 4
    _fields_ =[
        ('packetId', c_int32),
        ('status', c_int32),
        ('session', c_int32),
        ('currentTime', c_wchar * 15),
        ('lastTime', c_wchar * 15),
        ('bestTime', c_wchar * 15),
        ('split', c_wchar * 15),
        ('completedLaps', c_int32),
        ('position', c_int32),
        ('iCurrentTime', c_int32),
        ('iLastTime', c_int32),
        ('iBestTime', c_int32),
        ('sessionTimeLeft', c_float),
        ('distanceTraveled', c_float),
        ('isInPit', c_int32),
        ('currentSectorIndex', c_int32),
        ('lastSectorTime', c_int32),
        ('numberOfLaps', c_int32),
        ('tyreCompound', c_wchar * 33),
        ('replayTimeMultiplier', c_float),
        ('normalizedCarPosition', c_float),
        ('carCoordinates', c_float * 3)
    ]

class SPageFileStatic(ctypes.Structure):
    _pack_ = 4
    _fields_ =[
        ('_smVersion', c_wchar * 15),
        ('_acVersion', c_wchar * 15),
        ('numberOfSessions', c_int32),
        ('numCars', c_int32),
        ('carModel', c_wchar * 33),
        ('track', c_wchar * 33),
        ('playerName', c_wchar * 33),
        ('playerSurname', c_wchar * 33),
        ('playerNick', c_wchar * 33),
        ('sectorCount', c_int32),
        ('maxTorque', c_float),
        ('maxPower', c_float),
        ('maxRpm', c_int32),
        ('maxFuel', c_float),
        ('suspensionMaxTravel', c_float * 4),
        ('tyreRadius', c_float * 4),
    ]

def main():
    if os.name == 'nt':
        os.system("")

    print("Waiting for Assetto Corsa to start (make sure you are in a session on track)...")

    shm_physics = None
    shm_graphics = None
    shm_static = None
    connected = False

    while True:
        try:
            # FIX 1: Explicitly request Read-Only access so Windows allows it
            if not shm_physics:
                shm_physics = mmap.mmap(-1, ctypes.sizeof(SPageFilePhysics), "acpmf_physics", access=mmap.ACCESS_READ)
                shm_graphics = mmap.mmap(-1, ctypes.sizeof(SPageFileGraphic), "acpmf_graphics", access=mmap.ACCESS_READ)
                shm_static = mmap.mmap(-1, ctypes.sizeof(SPageFileStatic), "acpmf_static", access=mmap.ACCESS_READ)
                
                if not connected:
                    print("🟢 Successfully connected to Assetto Corsa telemetry!")
                    connected = True

            # FIX 2: Use from_buffer_copy() to safely read from the Read-Only memory mapped buffers
            physics = SPageFilePhysics.from_buffer_copy(shm_physics)
            graphics = SPageFileGraphic.from_buffer_copy(shm_graphics)
            static = SPageFileStatic.from_buffer_copy(shm_static)
            
            telemetry = {
                "status": "connected",
                "packetId": physics.packetId,
                "gas": round(physics.gas, 2) * 100,
                "brake": round(physics.brake, 2) * 100,
                "fuel": round(physics.fuel, 2),
                "gear": physics.gear - 1,
                "rpms": physics.rpms,
                "steerAngle": round(physics.steerAngle, 2),
                "speedKmh": round(physics.speedKmh, 1),
                "lapNumber": graphics.completedLaps + 1,
                "time": int(time.time() * 1000),
                "lastLapTimeMs": graphics.iLastTime,
            }

            post_telemetry(telemetry)
            time.sleep(1 / 60)
            
        except (FileNotFoundError, OSError) as e:
            # Game is closed or we are in the menus
            if connected:
                print(f"🔴 Lost connection to Assetto Corsa. Waiting...")
                connected = False
                
            shm_physics = None
            shm_graphics = None
            shm_static = None
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("Telemetry stopped.")
            break

if __name__ == "__main__":
    main()
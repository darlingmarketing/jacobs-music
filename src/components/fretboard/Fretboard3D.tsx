import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { FretboardDiagram } from '@/components/FretboardDiagram'
import type { ChordVoicing } from '@/types'

// ---------- helpers ----------

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// ---------- 3-D geometry ----------

const NUM_STRINGS = 6
const NUM_FRETS = 5
const FRET_SPACING = 0.5
const STRING_SPACING = 0.24
const BOARD_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING
const BOARD_LENGTH = NUM_FRETS * FRET_SPACING

function FretboardMesh({ voicing }: { voicing: ChordVoicing }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  const baseFret = voicing.baseFret ?? 1
  const frets = voicing.frets

  return (
    <group ref={groupRef} rotation={[-0.4, 0, 0]}>
      {/* Board body */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[BOARD_WIDTH + 0.1, 0.03, BOARD_LENGTH + 0.1]} />
        <meshStandardMaterial color="#7c4a1e" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Nut / top fret bar */}
      <mesh position={[0, 0.025, -BOARD_LENGTH / 2]}>
        <boxGeometry args={[BOARD_WIDTH + 0.1, 0.06, 0.04]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.4} />
      </mesh>

      {/* Fret wires */}
      {Array.from({ length: NUM_FRETS }).map((_, i) => {
        const z = -BOARD_LENGTH / 2 + (i + 1) * FRET_SPACING
        return (
          <mesh key={`fret-${i}`} position={[0, 0.025, z]}>
            <boxGeometry args={[BOARD_WIDTH + 0.08, 0.025, 0.02]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
          </mesh>
        )
      })}

      {/* Strings */}
      {Array.from({ length: NUM_STRINGS }).map((_, si) => {
        const x = -BOARD_WIDTH / 2 + si * STRING_SPACING
        return (
          <mesh key={`string-${si}`} position={[x, 0.04, 0]}>
            <cylinderGeometry args={[0.004, 0.004, BOARD_LENGTH + 0.1, 6]} />
            <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.1} />
          </mesh>
        )
      })}

      {/* Finger dots */}
      {frets.map((fret, si) => {
        if (typeof fret !== 'number' || fret === 0) return null
        const relativeFret = fret - (baseFret - 1)
        if (relativeFret < 1 || relativeFret > NUM_FRETS) return null
        const x = -BOARD_WIDTH / 2 + si * STRING_SPACING
        const z = -BOARD_LENGTH / 2 + (relativeFret - 0.5) * FRET_SPACING
        return (
          <mesh key={`dot-${si}`} position={[x, 0.07, z]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#1a56db" roughness={0.5} />
          </mesh>
        )
      })}

      {/* Muted string X markers (floating above nut) */}
      {frets.map((fret, si) => {
        if (fret !== 'x') return null
        const x = -BOARD_WIDTH / 2 + si * STRING_SPACING
        const z = -BOARD_LENGTH / 2 - 0.15
        return (
          <mesh key={`mute-${si}`} position={[x, 0.07, z]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
        )
      })}
    </group>
  )
}

// ---------- public component ----------

interface Fretboard3DProps {
  voicing: ChordVoicing
  chordName?: string
  leftHanded?: boolean
  className?: string
}

export function Fretboard3D({ voicing, chordName, leftHanded = false, className }: Fretboard3DProps) {
  const [webGLSupported] = useState(() => isWebGLAvailable())

  if (!webGLSupported) {
    return (
      <FretboardDiagram
        voicing={voicing}
        chordName={chordName}
        leftHanded={leftHanded}
        className={className}
      />
    )
  }

  return (
    <div
      className={className}
      style={{ width: 200, height: 220, display: 'inline-block' }}
      aria-label={chordName ? `3D fretboard diagram for ${chordName}` : '3D fretboard diagram'}
    >
      {chordName && (
        <div className="text-center font-semibold text-lg mb-1">{chordName}</div>
      )}
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 2.2], fov: 40 }}
        style={{ width: '100%', height: chordName ? 190 : 220, borderRadius: 8 }}
        data-testid="fretboard3d-canvas"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <FretboardMesh voicing={voicing} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}

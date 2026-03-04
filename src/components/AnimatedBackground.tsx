import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 80

function Particles() {
  const meshRef = useRef<THREE.Points>(null)

  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
  }

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.04
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.05
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#6366f1" size={0.06} transparent opacity={0.45} sizeAttenuation />
    </points>
  )
}

interface AnimatedBackgroundProps {
  className?: string
}

/**
 * Subtle Three.js particle field intended as a decorative page background.
 * Kept low-poly and semi-transparent so it stays unobtrusive.
 */
export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        data-testid="animated-background-canvas"
      >
        <ambientLight intensity={0.5} />
        <Particles />
      </Canvas>
    </div>
  )
}

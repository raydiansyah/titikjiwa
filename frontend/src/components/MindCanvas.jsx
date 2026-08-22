/**
 * Module: Titikjiwa Mind Canvas
 * Purpose: Render an interactive neural particle sphere for the landing hero
 * Used by: LandingPage in frontend/src/App.js
 * Dependencies: React, @react-three/fiber, three
 * Public functions: MindCanvas()
 * Side effects: Reads pointer movement through R3F events and animates a WebGL scene
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PALETTE = { dark: "#D4A373", light: "#A96842" };

function NeuralParticles({ activeState, isDark, pulse }) {
  const pointsRef = useRef(null);
  const pointer = useRef(new THREE.Vector2());
  const { viewport } = useThree();
  const count = 1500;
  const base = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 1.25 + Math.sin(i * 0.9) * 0.08;
      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, []);

  useFrame(({ clock, pointer: r3fPointer }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointer.current.lerp(r3fPointer, 0.06);
    const chaos = activeState === "Overthinking" ? 1.8 : activeState === "Burnout" ? 1.25 : activeState === "Stress" ? 1.45 : 0.55;
    const speed = activeState === "Calmness" ? 0.35 : 0.9;
    const scale = 1 + pulse * 0.08;
    const position = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const x = base.positions[i * 3];
      const y = base.positions[i * 3 + 1];
      const z = base.positions[i * 3 + 2];
      const wave = Math.sin(t * speed + base.seeds[i] + y * 2.4) * 0.035 * chaos;
      position[i * 3] = x * scale + pointer.current.x * 0.06 + wave;
      position[i * 3 + 1] = y * scale + pointer.current.y * 0.06 + Math.cos(t * speed + base.seeds[i]) * 0.025 * chaos;
      position[i * 3 + 2] = z * scale;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.055 * speed + pointer.current.x * 0.2;
    pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.08 + pointer.current.y * 0.12;
    pointsRef.current.scale.setScalar(Math.min(viewport.width / 5.5, 1.1));
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={base.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={isDark ? PALETTE.dark : PALETTE.light} size={0.026} sizeAttenuation transparent opacity={isDark ? 0.9 : 0.72} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function MindCanvas({ activeState, isDark, pulse = 0 }) {
  return (
    <Canvas className="mind-canvas" dpr={[1, 2]} camera={{ position: [0, 0, 4.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={isDark ? 0.7 : 1} />
      <NeuralParticles activeState={activeState} isDark={isDark} pulse={pulse} />
    </Canvas>
  );
}

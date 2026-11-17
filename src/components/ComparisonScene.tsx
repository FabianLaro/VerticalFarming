import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ComparisonRow, Input } from '../lib/model'
import { comparisonLayout } from '../lib/comparison-layout'
import type { ComparisonPlot } from '../lib/comparison-layout'
import { number } from '../lib/format'

type Vec3 = [number, number, number]
type SceneLabel = { text: string; x: number; y: number }
const modelPath = `${import.meta.env.BASE_URL}models/lettuce-low.glb`
const groundColors = ['#b7c5ad', '#cdd5bd', '#8c7959']

function Block({ at, size, color = '#b8c2b9', opacity = 1 }: { at: Vec3; size: Vec3; color?: string; opacity?: number }) {
  return <mesh position={at}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.85} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} /></mesh>
}

/** These placements are illustrative plants, not a count of annual production. */
function Crops({ positions, scale }: { positions: Vec3[]; scale: number }) {
  const { scene } = useGLTF(modelPath, false, false)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const plant = useMemo(() => {
    scene.updateMatrixWorld(true)
    let source: THREE.Mesh | undefined
    scene.traverse(node => { if (!source && node instanceof THREE.Mesh) source = node })
    if (!source) throw new Error('Das Salatmodell enthält keine Geometrie.')
    return { geometry: source.geometry.clone().applyMatrix4(source.matrixWorld), material: source.material }
  }, [scene])
  useLayoutEffect(() => {
    if (!mesh.current) return
    const item = new THREE.Object3D()
    positions.forEach((position, i) => {
      item.position.set(...position)
      item.rotation.y = i * 2.39996
      item.scale.setScalar(scale)
      item.updateMatrix()
      mesh.current!.setMatrixAt(i, item.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [positions, scale])
  useEffect(() => {
    const instance = mesh.current
    return () => instance?.dispose()
  }, [positions.length])
  useLayoutEffect(() => () => plant.geometry.dispose(), [plant])
  return <instancedMesh ref={mesh} args={[plant.geometry, plant.material, positions.length]} dispose={null} />
}

function Farm({ plot, input, index }: { plot: ComparisonPlot; input: Input; index: number }) {
  const { row, side, x, z } = plot
  const vertical = row.system === 'vertical'
  const greenhouse = row.system === 'greenhouse'
  const levels = vertical ? input.levels : 1
  const buildingHeight = vertical ? levels * 1.7 + 1.2 : 6
  const cropPositions = useMemo(() => {
    const positions: Vec3[] = []
    if (vertical) {
      for (let level = 0; level < levels; level++) for (let bed = 0; bed < 5; bed++) for (let plant = 0; plant < 7; plant++) {
        positions.push([(-.4 + bed * .2) * side, .5 + level * 1.7, (-.4 + plant * .8 / 6) * side])
      }
    } else {
      const count = greenhouse ? 8 : 12
      for (let a = 0; a < count; a++) for (let b = 0; b < count; b++) positions.push([(-.44 + a * .88 / (count - 1)) * side, .22, (-.44 + b * .88 / (count - 1)) * side])
    }
    return positions
  }, [vertical, greenhouse, side, levels])
  if (side <= 0) return null
  const edge = Math.min(.2, side / 100)
  return <group position={[x, 0, z]}>
    <Block at={[0, -.12, 0]} size={[side, .24, side]} color={groundColors[index]} />
    {vertical ? <>
      <Block at={[0, buildingHeight / 2, -side / 2]} size={[side, buildingHeight, edge]} color="#e4e6df" />
      <Block at={[-side / 2, buildingHeight / 2, 0]} size={[edge, buildingHeight, side]} color="#d6dcd2" />
      {[-1, 1].flatMap(a => [-1, 1].map(b => <Block key={`${a}-${b}`} at={[a * side / 2, buildingHeight / 2, b * side / 2]} size={[edge, buildingHeight, edge]} color="#627569" />))}
      {[-1, 1].map(a => <Block key={a} at={[a * side / 2, buildingHeight, 0]} size={[edge, edge, side]} color="#627569" />)}
      {[-1, 1].map(a => <Block key={a} at={[0, buildingHeight, a * side / 2]} size={[side, edge, edge]} color="#627569" />)}
      {Array.from({ length: levels }, (_, level) => Array.from({ length: 5 }, (_, bed) => <group key={`${level}-${bed}`}>
        <Block at={[(-.4 + bed * .2) * side, .4 + level * 1.7, 0]} size={[side * input.usable / 5, .1, side]} color="#dce4d5" />
        <Block at={[(-.4 + bed * .2) * side, 1.65 + level * 1.7, 0]} size={[.12, .08, side * .94]} color="#f5f2d4" />
      </group>))}
    </> : <>
      {Array.from({ length: 7 }, (_, bed) => <Block key={bed} at={[(-.42 + bed * .14) * side, .04, 0]} size={[side * .1, .07, side * .94]} color={greenhouse ? '#7f7353' : '#a4956a'} />)}
      {greenhouse && <>
        <Block at={[0, buildingHeight / 2, -side / 2]} size={[side, buildingHeight, edge]} color="#d5e5dd" opacity={.2} />
        {[-1, 1].flatMap(a => [-1, 1].map(b => <Block key={`${a}-${b}`} at={[a * side / 2, buildingHeight / 2, b * side / 2]} size={[edge, buildingHeight, edge]} color="#688274" />))}
        {Array.from({ length: 5 }, (_, rib) => <group key={rib} position={[0, 0, (-.5 + rib / 4) * side]}>
          <Block at={[0, buildingHeight, 0]} size={[side, edge, edge]} color="#688274" />
          {[-1, 1].map(a => {
            const rise = Math.min(side * .14, 4)
            const length = Math.hypot(side / 2, rise)
            return <mesh key={a} position={[a * side / 4, buildingHeight + rise / 2, 0]} rotation={[0, 0, -a * Math.atan2(rise, side / 2)]}><boxGeometry args={[length, edge, edge]} /><meshStandardMaterial color="#688274" roughness={.7} /></mesh>
          })}
        </group>)}
        <Block at={[0, buildingHeight + Math.min(side * .14, 4), 0]} size={[edge, edge, side]} color="#688274" />
      </>}
    </>}
    <Crops positions={cropPositions} scale={Math.max(1, side / (vertical ? 9 : greenhouse ? 8 : 12))} />
  </group>
}

function SharedCamera({ width, depth, height, plots, scaleMetres, onLabels }: { width: number; depth: number; height: number; plots: ComparisonPlot[]; scaleMetres: number; onLabels: (labels: SceneLabel[]) => void }) {
  const { camera, size, invalidate } = useThree()
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    const center = new THREE.Vector3(0, height / 2, -depth / 2)
    const distance = Math.max(width, depth, height, 1) * 4
    camera.position.copy(center).add(new THREE.Vector3(.28, .8, 1.5).normalize().multiplyScalar(distance))
    camera.up.set(0, 1, 0)
    camera.lookAt(center)
    camera.near = .1
    camera.far = distance * 3
    camera.updateMatrixWorld(true)
    const projected = new THREE.Box3()
    for (const x of [-width / 2, width / 2]) for (const y of [-.5, height + 1]) for (const z of [-depth, 10]) projected.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse))
    const extent = projected.getSize(new THREE.Vector3())
    camera.left = -size.width / 2
    camera.right = size.width / 2
    camera.top = size.height / 2
    camera.bottom = -size.height / 2
    camera.zoom = Math.min(size.width / Math.max(extent.x * 1.12, 1), size.height / Math.max(extent.y * 1.18, 1))
    camera.updateProjectionMatrix()
    const label = (text: string, at: Vec3): SceneLabel => {
      const projected = new THREE.Vector3(...at).project(camera)
      return { text, x: (projected.x + 1) * size.width / 2, y: (1 - projected.y) * size.height / 2 }
    }
    onLabels([...plots.map((plot, index) => label(size.width < 500 ? ['VF', 'GH', 'Freiland'][index] : plot.row.label, [plot.x, 0, 1.5])), label(`${number(scaleMetres)} m`, [-width / 2 + scaleMetres / 2, 0, 10])])
    invalidate()
  }, [camera, size.width, size.height, width, depth, height, plots, scaleMetres, onLabels, invalidate])
  return null
}

export default function ComparisonScene({ rows, input, fallback }: { rows: ComparisonRow[]; input: Input; fallback: ReactNode }) {
  const layout = useMemo(() => comparisonLayout(rows), [rows])
  const [labels, setLabels] = useState<SceneLabel[]>([])
  return <div className="comparison-scene"><Canvas className="comparison-canvas" orthographic frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 100, 150], near: .1, far: 10000 }} gl={{ antialias: true, alpha: true }} fallback={fallback} aria-label="Drei Anbausysteme mit Grundflächen im selben Maßstab">
    <ambientLight intensity={.65} />
    <hemisphereLight args={['#f4f7ed', '#8a8475', .7]} />
    <directionalLight position={[-40, 90, 55]} intensity={1.8} />
    <SharedCamera width={layout.width} depth={layout.depth} height={Math.max(input.levels * 1.7 + 1.2, 10)} plots={layout.plots} scaleMetres={layout.scaleMetres} onLabels={setLabels} />
    <Suspense fallback={null}>{layout.plots.map((plot, index) => <Farm key={plot.row.system} plot={plot} input={input} index={index} />)}</Suspense>
    <group position={[-layout.width / 2, 0, 7]}>
      <Block at={[layout.scaleMetres / 2, 0, 0]} size={[layout.scaleMetres, .12, .15]} color="#3f5544" />
    </group>
  </Canvas><div className="comparison-scene-labels" aria-hidden="true">{labels.map((label, index) => <span key={index} className="comparison-model-label" style={{ left: label.x, top: label.y }}>{label.text}</span>)}</div></div>
}

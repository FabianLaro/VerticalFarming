import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ComparisonRow, Input } from '../lib/model'
import { comparisonLayout, comparisonScale } from '../lib/comparison-layout'
import type { ComparisonPlot } from '../lib/comparison-layout'
import { number } from '../lib/format'
import { Model, StudioLighting } from './FarmScene'

type Vec3 = [number, number, number]
type SceneLabel = { text: string; x: number; y: number }
type GroundSize = { system: string; width: number; depth: number; pixelWidth: number }
type Scale = { metres: number; pixels: number; slope: number }
const modelPath = `${import.meta.env.BASE_URL}models/lettuce.glb`
const groundColors = ['#b7c5ad', '#cdd5bd', '#8c7959']

function Block({ at, size, color = '#b8c2b9', opacity = 1, name, rotation, metal = false }: { at: Vec3; size: Vec3; color?: string; opacity?: number; name?: string; rotation?: Vec3; metal?: boolean }) {
  return <mesh name={name} position={at} rotation={rotation} castShadow={opacity === 1} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={metal ? .36 : .85} metalness={metal ? .55 : .05} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} /></mesh>
}

function Glass({ at, size, rotation }: { at: Vec3; size: Vec3; rotation?: Vec3 }) {
  return <mesh position={at} rotation={rotation}><boxGeometry args={size} /><meshPhysicalMaterial color="#c6dfdb" roughness={.08} metalness={.05} transparent opacity={.18} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
}

function Ground({ side, system, color }: { side: number; system: string; color: string }) {
  const texture = useMemo(() => {
    const data = new Uint8Array(128 * 128 * 4)
    for (let i = 0; i < 128 * 128; i++) {
      const shade = 215 + ((i * 1664525 + (i >>> 7) * 1013904223) >>> 17) % 40
      data.set([shade, shade, shade, 255], i * 4)
    }
    const map = new THREE.DataTexture(data, 128, 128, THREE.RGBAFormat)
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(side / 3, side / 3)
    map.magFilter = THREE.LinearFilter
    map.needsUpdate = true
    return map
  }, [side])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh name={`comparison-ground-${system}`} position={[0, -.12, 0]} receiveShadow><boxGeometry args={[side, .24, side]} /><meshStandardMaterial color={color} map={texture} bumpMap={texture} bumpScale={system === 'vertical' ? .012 : .08} roughness={.95} /></mesh>
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
      item.scale.setScalar(scale * (.91 + i % 7 * .025))
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
  return <instancedMesh ref={mesh} args={[plant.geometry, plant.material, positions.length]} castShadow receiveShadow dispose={null} />
}

function Farm({ plot, input, index }: { plot: ComparisonPlot; input: Input; index: number }) {
  const { row, side, x, z } = plot
  const vertical = row.system === 'vertical'
  const greenhouse = row.system === 'greenhouse'
  const levels = vertical ? input.levels : 1
  const buildingHeight = vertical ? levels * 1.7 + 1.2 : 6
  const rackLengthFraction = Math.max(.78, input.usable)
  const rackWidth = side * input.usable / (5 * rackLengthFraction)
  const serviceDepth = side * (1 - rackLengthFraction) / 2
  const equipmentScale = Math.min(Math.max(.5, side / 24), serviceDepth / 2)
  const equipmentZ = side * (1 + rackLengthFraction) / 4
  const invalidate = useThree(state => state.invalidate)
  useLayoutEffect(() => invalidate(), [side, levels, invalidate])
  const cropPositions = useMemo(() => {
    const positions: Vec3[] = []
    if (vertical) {
      for (let level = 0; level < levels; level++) for (let bed = 0; bed < 5; bed++) for (let col = 0; col < 2; col++) for (let plant = 0; plant < 8; plant++) {
        positions.push([(-.4 + bed * .2) * side + (col ? 1 : -1) * rackWidth * .24, .55 + level * 1.7, (-.44 + plant * .88 / 7) * side * rackLengthFraction])
      }
    } else {
      const count = greenhouse ? 11 : 15
      for (let a = 0; a < count; a++) for (let b = 0; b < count; b++) positions.push([(-.43 + a * .86 / (count - 1)) * side, .18, (-.44 + b * .88 / (count - 1)) * side])
    }
    return positions
  }, [vertical, greenhouse, side, levels, rackWidth, rackLengthFraction])
  if (side <= 0) return null
  const edge = Math.min(.2, side / 100)
  return <group position={[x, 0, z]}>
    <Ground side={side} system={row.system} color={groundColors[index]} />
    {vertical ? <>
      <Block at={[0, buildingHeight / 2, -side / 2]} size={[side, buildingHeight, edge]} color="#e4e6df" />
      <Block at={[-side / 2, buildingHeight / 2, 0]} size={[edge, buildingHeight, side]} color="#d6dcd2" />
      {[-1, 1].flatMap(a => [-1, 1].map(b => <Block key={`${a}-${b}`} at={[a * side / 2, buildingHeight / 2, b * side / 2]} size={[edge, buildingHeight, edge]} color="#627569" />))}
      {[-1, 1].map(a => <Block key={a} at={[a * side / 2, buildingHeight, 0]} size={[edge, edge, side]} color="#627569" />)}
      {[-1, 1].map(a => <Block key={a} at={[0, buildingHeight, a * side / 2]} size={[side, edge, edge]} color="#627569" />)}
      {Array.from({ length: 5 }, (_, bed) => <group key={bed} position={[(-.4 + bed * .2) * side, 0, 0]}>
        {[-1, 1].flatMap(a => [-1, 1].map(b => <Block key={`${a}-${b}`} at={[a * rackWidth / 2, buildingHeight / 2, b * side * rackLengthFraction * .49]} size={[.13, buildingHeight, .13]} color="#788b82" metal />))}
        {Array.from({ length: levels }, (_, level) => <group key={level}>
          <Model name="rack-tier" position={[0, .43 + level * 1.7, 0]} scale={[rackWidth / 2.2, 1, side * rackLengthFraction / 6.4]} />
          {[-1, 1].map(a => <Block key={a} at={[a * rackWidth / 4, 1.6 + level * 1.7, 0]} size={[.18, .1, side * rackLengthFraction * .96]} color="#f4f0d3" metal />)}
        </group>)}
      </group>)}
      {equipmentScale > .05 && <>
        <Model name="tank" position={[side * .37, 0, equipmentZ]} scale={equipmentScale} />
        <Model name="pump" position={[side * .25, .05, equipmentZ]} scale={equipmentScale} />
        <Model name="air-handler" position={[-side * .35, .05, equipmentZ]} scale={equipmentScale} />
        <Model name="harvest-cart" position={[side * .03, .05, equipmentZ]} scale={equipmentScale} />
      </>}
    </> : <>
      {Array.from({ length: greenhouse ? 11 : 15 }, (_, bed) => <group key={bed}>
        <Block at={[(-.43 + bed * .86 / (greenhouse ? 10 : 14)) * side, .04, 0]} size={[side * (greenhouse ? .055 : .042), .16, side * .94]} color={greenhouse ? '#6f6047' : bed % 2 ? '#a18a65' : '#99815c'} />
        <Block at={[(-.43 + bed * .86 / (greenhouse ? 10 : 14) + .026) * side, .14, 0]} size={[.055, .045, side * .92]} color="#3d5144" />
      </group>)}
      {greenhouse && <>
        <Glass at={[0, buildingHeight / 2, -side / 2]} size={[side, buildingHeight, .035]} />
        {[-1, 1].map(a => <Glass key={a} at={[a * side / 2, buildingHeight / 2, 0]} size={[.035, buildingHeight, side]} />)}
        {[-1, 1].flatMap(a => [-1, 1].map(b => <Block key={`${a}-${b}`} at={[a * side / 2, buildingHeight / 2, b * side / 2]} size={[edge, buildingHeight, edge]} color="#688274" />))}
        {Array.from({ length: 7 }, (_, rib) => <group key={rib} position={[0, 0, (-.5 + rib / 6) * side]}>
          {[-1, 1].map(a => <Block key={a} at={[a * side / 2, buildingHeight / 2, 0]} size={[edge, buildingHeight, edge]} color="#6e847a" metal />)}
          {[-1, 1].map(a => {
            const rise = Math.min(side * .14, 4)
            const length = Math.hypot(side / 2, rise)
            return <Block key={a} at={[a * side / 4, buildingHeight + rise / 2, 0]} rotation={[0, 0, -a * Math.atan2(rise, side / 2)]} size={[length, edge, edge]} color="#688274" metal />
          })}
        </group>)}
        <Block at={[0, buildingHeight + Math.min(side * .14, 4), 0]} size={[edge, edge, side]} color="#688274" />
        {[-1, 1].map(a => <Glass key={a} at={[a * side / 4, buildingHeight + Math.min(side * .14, 4) / 2, 0]} size={[Math.hypot(side / 2, Math.min(side * .14, 4)), .025, side]} rotation={[0, 0, -a * Math.atan2(Math.min(side * .14, 4), side / 2)]} />)}
        <Model name="tank" position={[side * .4, 0, side * .37]} scale={Math.max(.7, side / 45)} />
      </>}
    </>}
    <Crops positions={cropPositions} scale={Math.max(.8, side / (vertical ? 13 : greenhouse ? 12 : 18))} />
  </group>
}

function SharedCamera({ width, depth, height, plots, onLabels, onGeometry, onScale }: { width: number; depth: number; height: number; plots: ComparisonPlot[]; onLabels: (labels: SceneLabel[]) => void; onGeometry: (sizes: GroundSize[]) => void; onScale: (scale: Scale) => void }) {
  const { camera, size, invalidate } = useThree()
  const reported = useRef('')
  useFrame(({ scene }) => {
    const grounds = plots.map(plot => scene.getObjectByName(`comparison-ground-${plot.row.system}`))
    if (grounds.some(ground => !ground)) return
    scene.updateMatrixWorld(true)
    const sizes = grounds.map((ground, index) => {
      const bounds = new THREE.Box3().setFromObject(ground!)
      const groundSize = bounds.getSize(new THREE.Vector3())
      const start = new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z).project(camera)
      const end = new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z).project(camera)
      return { system: plots[index].row.system, width: groundSize.x, depth: groundSize.z, pixelWidth: Math.abs(end.x - start.x) * size.width / 2 }
    })
    const signature = JSON.stringify(sizes)
    if (signature !== reported.current) { reported.current = signature; onGeometry(sizes) }
  })
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    const center = new THREE.Vector3(0, height / 2, -depth / 2)
    const distance = Math.max(width, depth, height, 1) * 4
    camera.position.copy(center).add(new THREE.Vector3(.65, 1, 1.8).normalize().multiplyScalar(distance))
    camera.up.set(0, 1, 0)
    camera.lookAt(center)
    camera.near = .1
    camera.far = distance * 3
    camera.updateMatrixWorld(true)
    const projected = new THREE.Box3()
    for (const plot of plots) {
      const top = plot.row.system === 'vertical' ? height : plot.row.system === 'greenhouse' ? 10 : Math.max(1, plot.side / 70)
      for (const x of [plot.x - plot.side / 2, plot.x + plot.side / 2]) for (const y of [-.5, top + .5]) for (const z of [-plot.side, 1]) projected.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse))
    }
    const extent = projected.getSize(new THREE.Vector3())
    camera.left = -size.width / 2
    camera.right = size.width / 2
    camera.top = size.height / 2
    camera.bottom = -size.height / 2
    camera.zoom = Math.min(size.width / Math.max(extent.x * 1.1, 1), (size.height - 45) / Math.max(extent.y * 1.12, 1))
    const projectedCenter = projected.getCenter(new THREE.Vector3())
    const offset = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(projectedCenter.x)
      .addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), projectedCenter.y - 18 / camera.zoom)
    camera.position.add(offset)
    camera.lookAt(center.clone().add(offset))
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    const label = (text: string, at: Vec3): SceneLabel => {
      const projected = new THREE.Vector3(...at).project(camera)
      return { text, x: (projected.x + 1) * size.width / 2, y: (1 - projected.y) * size.height / 2 }
    }
    onLabels(plots.map((plot, index) => label(size.width < 500 ? ['VF', 'GH', 'Freiland'][index] : plot.row.label, [plot.x, 0, 1.5])))
    const start = new THREE.Vector3(0, 0, 0).project(camera)
    const end = new THREE.Vector3(1, 0, 0).project(camera)
    const pixelsPerMetre = Math.abs(end.x - start.x) * size.width / 2
    const scale = comparisonScale(pixelsPerMetre, Math.min(100, size.width * .24))
    onScale({ ...scale, slope: -(end.y - start.y) * size.height / 2 / pixelsPerMetre })
    invalidate()
  }, [camera, size.width, size.height, width, depth, height, plots, onLabels, onScale, invalidate])
  return null
}

export default function ComparisonScene({ rows, input, fallback, loading }: { rows: ComparisonRow[]; input: Input; fallback: ReactNode; loading: ReactNode }) {
  useGLTF(modelPath, false, false)
  const layout = useMemo(() => comparisonLayout(rows), [rows])
  const [labels, setLabels] = useState<SceneLabel[]>([])
  const [groundSizes, setGroundSizes] = useState<GroundSize[]>([])
  const [scale, setScale] = useState<Scale | null>(null)
  const ready = groundSizes.length === rows.length
  const extent = Math.max(layout.width, layout.depth, 25)
  const rise = scale ? scale.slope * scale.pixels : 0
  return <div className="comparison-scene" data-ready={ready} data-world-footprints={JSON.stringify(groundSizes)}><Canvas className="comparison-canvas" style={{ opacity: ready ? 1 : 0 }} shadows orthographic frameloop="demand" dpr={[1, 1.8]} camera={{ position: [0, 100, 150], near: .1, far: 10000 }} gl={{ antialias: true, alpha: true }} fallback={fallback} aria-label="Drei detaillierte Anbausysteme mit Grundflächen im selben Maßstab">
    <StudioLighting />
    <ambientLight intensity={.22} />
    <hemisphereLight args={['#edf2eb', '#918371', .75]} />
    <directionalLight position={[-extent * .45, extent * 1.1, extent * .6]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-extent} shadow-camera-right={extent} shadow-camera-top={extent} shadow-camera-bottom={-extent} shadow-camera-far={extent * 5} shadow-bias={-.00015} shadow-normalBias={.06} />
    <SharedCamera width={layout.width} depth={layout.depth} height={Math.max(input.levels * 1.7 + 1.2, 10)} plots={layout.plots} onLabels={setLabels} onGeometry={setGroundSizes} onScale={setScale} />
    <Suspense fallback={null}>{layout.plots.map((plot, index) => <Farm key={plot.row.system} plot={plot} input={input} index={index} />)}</Suspense>
  </Canvas>{ready ? <><div className="comparison-scene-labels" aria-hidden="true">{labels.map((label, index) => <span key={index} className="comparison-model-label" style={{ left: label.x, top: label.y }}>{label.text}</span>)}</div>{scale && <div className="comparison-scale" data-metres={scale.metres} data-pixels={scale.pixels} aria-label={`Maßstab entlang der Grundflächenbreite: ${number(scale.metres)} Meter`}>
    <svg width={scale.pixels + 10} height={Math.abs(rise) + 12} aria-hidden="true"><path d={`M5 ${5 + Math.max(0, -rise)}L${5 + scale.pixels} ${5 + Math.max(0, rise)} M5 ${1 + Math.max(0, -rise)}v8 M${5 + scale.pixels} ${1 + Math.max(0, rise)}v8`} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg><span>{number(scale.metres)} m</span>
  </div>}</> : <div className="comparison-scene-loading">{loading}</div>}</div>
}

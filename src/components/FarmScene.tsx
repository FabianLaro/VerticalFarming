import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type ComponentRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { SceneFallback } from './SceneFallback'
import './scene.css'

export type FarmSystem = 'vertical' | 'greenhouse' | 'field'
export interface FarmSceneProps {
  system: FarmSystem
  levels: number
  footprint: number
  usable?: number
  selectedPart?: string
  view: 'cutaway' | 'closed' | 'exploded'
  cameraView: 'perspective' | 'top' | 'front'
  resetKey: number
  quality: 'low' | 'high'
  onSelect: (id: string) => void
  cameraCommand?: { action: 'left' | 'right' | 'in' | 'out'; seq: number }
}

type Vec3 = [number, number, number]
const colors = { metal: '#b5bdba', edge: '#57655f', wall: '#e9e7dd', tray: '#d9dfd2', water: '#318f9a', return: '#3d6666', earth: '#5d4632' }
const modelPath = (name: string) => `${import.meta.env.BASE_URL}models/${name}.glb`
const packedModels = new WeakMap<THREE.Group, THREE.Group>()
const parts = [
  ['plants', '1', 'Pflanzen und Anbaufläche'], ['lights', '2', 'LED-Beleuchtung'],
  ['water', '3', 'Wasser und Nährlösung'], ['climate', '4', 'Klima und Lüftung'],
  ['harvest', '5', 'Ernte und Abnehmer'], ['shell', '6', 'Gebäudehülle'],
] as const

function Box({ position, size, color = colors.metal, rotation, emissive, opacity = 1, ...rest }: {
  position: Vec3; size: Vec3; color?: string; rotation?: Vec3; emissive?: string; opacity?: number
} & Pick<ThreeElements['mesh'], 'onClick'>) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow {...rest}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.66} metalness={color === colors.metal ? 0.42 : 0.05} emissive={emissive} emissiveIntensity={emissive ? 1.6 : 0} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
  </mesh>
}

function Pipe({ points, color = colors.water, radius = 0.045 }: { points: Vec3[]; color?: string; radius?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0), [points])
  return <mesh castShadow><tubeGeometry args={[curve, Math.max(8, points.length * 5), radius, 7, false]} /><meshStandardMaterial color={color} roughness={0.38} metalness={0.15} /></mesh>
}

function packedModel(scene: THREE.Group): THREE.Group {
  const cached = packedModels.get(scene)
  if (cached) return cached
  scene.updateMatrixWorld(true)
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>()
  scene.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return
    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material, materialIndex) => {
      let geometry = (child.geometry as THREE.BufferGeometry).clone().applyMatrix4(child.matrixWorld)
      if (materials.length > 1) {
        const index = geometry.index?.array ?? Array.from({ length: geometry.attributes.position.count }, (_, i) => i)
        const selected = geometry.groups.filter(group => group.materialIndex === materialIndex).flatMap(group => Array.from(index.slice(group.start, group.start + group.count)))
        if (!selected.length) { geometry.dispose(); return }
        geometry.setIndex(selected)
      }
      if (geometry.index) { const indexed = geometry; geometry = indexed.toNonIndexed(); indexed.dispose() }
      for (const attribute of Object.keys(geometry.attributes)) if (!['position', 'normal', 'color', 'uv'].includes(attribute)) geometry.deleteAttribute(attribute)
      if (!geometry.attributes.normal) geometry.computeVertexNormals()
      const bucket = buckets.get(material) ?? []
      bucket.push(geometry)
      buckets.set(material, bucket)
    })
  })
  const group = new THREE.Group()
  for (const [material, geometries] of buckets) {
    for (const attribute of ['color', 'uv'] as const) {
      if (!geometries.some(geometry => geometry.hasAttribute(attribute))) continue
      const itemSize = attribute === 'color' ? 3 : 2
      geometries.forEach(geometry => {
        if (!geometry.hasAttribute(attribute)) {
          const data = new Float32Array(geometry.attributes.position.count * itemSize)
          if (attribute === 'color') data.fill(1)
          geometry.setAttribute(attribute, new THREE.BufferAttribute(data, itemSize))
        }
      })
    }
    const geometry = mergeGeometries(geometries)
    geometries.forEach(part => part.dispose())
    if (!geometry) throw new Error('Ein lokales Blender-Modell konnte nicht zusammengefasst werden.')
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = material.name
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  // Fixed asset cache shares geometry and materials across all tier instances.
  packedModels.set(scene, group)
  return group
}

/** The GLBs are authored in this project's Blender sources, with embedded materials. */
export function Model({ name, position, rotation, scale = 1 }: { name: string; position: Vec3; rotation?: Vec3; scale?: number | Vec3 }) {
  const { scene } = useGLTF(modelPath(name), false, false)
  const object = useMemo(() => packedModel(scene).clone(true), [scene])
  // Cached GLB geometry/materials are deliberately shared across repeated components.
  return <primitive object={object} position={position} rotation={rotation} scale={scale} dispose={null} />
}

function Plants({ positions, quality }: { positions: Vec3[]; quality: FarmSceneProps['quality'] }) {
  const { scene } = useGLTF(modelPath(quality === 'high' ? 'lettuce' : 'lettuce-low'), false, false)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const plant = useMemo(() => {
    scene.updateMatrixWorld(true)
    let source: THREE.Mesh | undefined
    scene.traverse(child => { if (!source && child instanceof THREE.Mesh) source = child })
    if (!source) throw new Error('Das lokale Salatmodell enthält keine Geometrie.')
    return { geometry: source.geometry.clone().applyMatrix4(source.matrixWorld), material: source.material }
  }, [scene])
  const visiblePositions = useMemo(() => quality === 'high' ? positions : positions.filter((_, i) => i % 2 === 0), [positions, quality])
  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    visiblePositions.forEach((p, i) => {
      const variation = 0.9 + ((i * 17) % 13) * 0.013
      dummy.position.set(...p)
      dummy.rotation.set(0, i * 2.39996, 0)
      dummy.scale.setScalar(variation)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
      color.setRGB(0.92 + (i % 5) * 0.016, 0.96 + (i % 3) * 0.012, 0.87 + (i % 7) * 0.018)
      mesh.current!.setColorAt(i, color)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [visiblePositions])
  useEffect(() => {
    const instance = mesh.current
    return () => instance?.dispose()
  }, [visiblePositions.length])
  useEffect(() => () => plant.geometry.dispose(), [plant])
  return <instancedMesh ref={mesh} args={[plant.geometry, plant.material, visiblePositions.length]} castShadow={quality === 'high'} receiveShadow dispose={null} />
}

function Rack({ x, levels, exploded, quality, onLightSelect }: { x: number; levels: number; exploded: boolean; quality: FarmSceneProps['quality']; onLightSelect: () => void }) {
  const gap = exploded ? 1.17 : 0.85
  const top = 0.65 + (levels - 1) * gap + 0.7
  const plants = useMemo(() => {
    const positions: Vec3[] = []
    for (let level = 0; level < levels; level++) {
      for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 4; col++) positions.push([x - 0.72 + col * 0.48, 0.65 + level * gap + 0.06, -2.8 + row * 0.5])
      }
    }
    return positions
  }, [x, levels, gap])
  return <group>
    {[-1.07, 1.07].flatMap(dx => [-3.2, 0, 3.2].map(z => <Box key={`${dx}-${z}`} position={[x + dx, top / 2 + 0.25, z]} size={[0.075, top, 0.075]} />))}
    {Array.from({ length: levels }, (_, level) => {
      const y = 0.65 + level * gap
      return <group key={level}>
        <Model name="rack-tier" position={[x, y - 0.06, 0]} />
        {[-0.64, 0.64].map(dx => <group key={dx} onClick={event => { event.stopPropagation(); onLightSelect() }}>
          <Box position={[x + dx, y + 0.65, 0]} size={[0.09, 0.055, 6.4]} color="#e9f1e8" emissive="#b7dce0" />
          <Box position={[x + dx, y + 0.69, 0]} size={[0.14, 0.025, 6.4]} color={colors.metal} />
        </group>)}
      </group>
    })}
    <Plants positions={plants} quality={quality} />
  </group>
}

function Tank({ x = 8, z = -1.8 }: { x?: number; z?: number }) {
  return <group position={[x, 0.25, z]}>
    <Model name="tank" position={[0, 0, 0]} />
    <Model name="pump" position={[-1.15, 0, 0.2]} />
    <Pipe points={[[0, 0.35, 0.5], [-0.5, 0.35, 0.5], [-0.95, 0.35, 0]]} />
  </group>
}

function Climate({ height }: { height: number }) {
  return <group>
    <Model name="air-handler" position={[4.8, 0.25, -2.5]} />
    <Pipe points={[[4.8, 1.6, -2.7], [4.8, height - 0.5, -2.7], [0, height - 0.5, -2.7], [-4.7, height - 0.5, -2.7]]} radius={0.23} color="#b7c4ba" />
    {[-4.4, -1.4, 1.6].map(x => <Box key={x} position={[x, height - 0.73, -2.7]} size={[0.42, 0.13, 0.52]} color="#677f72" />)}
    <Box position={[6.83, 1.15, -3.3]} size={[0.12, 1.35, 0.8]} color="#b1bdb0" />
    <Box position={[6.91, 1.44, -3.3]} size={[0.04, 0.32, 0.44]} color="#365c4d" emissive="#31533e" />
  </group>
}

function Harvest({ outdoor = false }: { outdoor?: boolean }) {
  return <Model name="harvest-cart" position={[outdoor ? 7.9 : 4.9, 0.25, 2.5]} />
}

function SoilSurface({ position, width, depth }: { position: Vec3; width: number; depth: number }) {
  const geometry = useMemo(() => {
    const surface = new THREE.PlaneGeometry(width, depth, 48, 10).rotateX(-Math.PI / 2)
    const vertices = surface.attributes.position
    const shades = new Float32Array(vertices.count * 3)
    const base = new THREE.Color(colors.earth)
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), z = vertices.getZ(i)
      const grain = Math.sin(x * 17.1 + z * 12.8) * Math.cos(x * 8.7 - z * 21.3)
      vertices.setY(i, grain * 0.023 + Math.sin(z * 6.3) * 0.014)
      const shade = 0.86 + (grain + 1) * 0.16
      shades.set([base.r * shade, base.g * shade, base.b * shade], i * 3)
    }
    surface.setAttribute('color', new THREE.BufferAttribute(shades, 3))
    surface.computeVertexNormals()
    return surface
  }, [width, depth])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh position={position} geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={0.98} /></mesh>
}

function VerticalFarm({ levels, view, quality, onSelect, usable = 0.65 }: Pick<FarmSceneProps, 'levels' | 'view' | 'quality' | 'onSelect' | 'usable'>) {
  const rackPositions = [-4.5, -1.5, 1.5].slice(0, Math.max(1, Math.round(usable / 0.65 * 3)))
  const exploded = view === 'exploded'
  const height = Math.max(3.8, (levels - 1) * (exploded ? 1.17 : 0.85) + 2.1)
  const click = (id: string) => (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect(id) }
  return <group>
    <Box position={[0, 0.16, 0]} size={[14.3, 0.3, 9.25]} color="#d9ddd2" />
    <group onClick={click('shell')}>
      <Box position={[exploded ? -9.1 : -7, height / 2 + 0.3, 0]} size={[0.16, height, 9.2]} color={colors.wall} />
      <Box position={[0, height / 2 + 0.3, exploded ? -6.5 : -4.5]} size={[14.15, height, 0.16]} color={colors.wall} />
      <Box position={[0, 0.54, -4.38]} size={[14, 0.28, 0.12]} color="#b1beb0" />
      {[-4.65, -2.3, 0, 2.3, 4.65].map(x => <Box key={x} position={[x, height / 2 + 0.3, exploded ? -6.4 : -4.4]} size={[0.025, height - 0.3, 0.018]} color="#b8bcb1" />)}
      {[-7, 0, 7].flatMap(x => [-4.5, 4.5].map(z => <Box key={`${x}-${z}`} position={[x, height / 2 + 0.26, z]} size={[0.13, height, 0.13]} color={colors.edge} />))}
      {[-4.5, 4.5].map(z => <Box key={z} position={[0, height + 0.3, z]} size={[14.2, 0.2, 0.17]} color={colors.edge} />)}
      {[-7, 7].map(x => <Box key={x} position={[x, height + 0.3, 0]} size={[0.17, 0.2, 9.2]} color={colors.edge} />)}
      {view !== 'cutaway' && <Box position={[0, height + (exploded ? 2.6 : 0.45), 0]} size={[14.4, 0.2, 9.45]} color="#b4c4ad" />}
      {view === 'closed' && <>
        <Box position={[7, height / 2 + 0.3, 0]} size={[0.16, height, 9.2]} color="#d3dccf" />
        <Box position={[0, height / 2 + 0.3, 4.5]} size={[14.1, height, 0.16]} color="#dde3d5" />
        <Box position={[4.8, 1.45, 4.6]} size={[2.1, 2.35, 0.04]} color="#718e7e" />
        <Box position={[-2.7, 1.6, 4.61]} size={[6.9, 1.35, 0.045]} color="#6f9a91" />
        {[-4.8, -2.7, -0.6].map(x => <Box key={x} position={[x, 1.6, 4.66]} size={[0.065, 1.35, 0.04]} color="#b8c7b4" />)}
      </>}
    </group>
    <group onClick={click('plants')}>
      {rackPositions.map(x => <Rack key={x} x={x} levels={levels} exploded={exploded} quality={quality} onLightSelect={() => onSelect('lights')} />)}
    </group>
    <group onClick={click('water')}>
      <Tank />
      <Pipe points={[[7, 0.6, -1.8], [6.7, 0.6, -3.65], [-5.7, 0.6, -3.65], [-5.7, height - 0.6, -3.65]]} />
      <Pipe points={[[-5.7, 0.39, 3.48], [6.4, 0.39, 3.48], [7.1, 0.39, 0], [8, 0.7, -1.2]]} color={colors.return} />
      {rackPositions.map(x => <Pipe key={x} points={[[x, 0.6, -3.65], [x, height - 0.6, -3.65]]} radius={0.03} />)}
    </group>
    <group onClick={click('climate')}><Climate height={height} /></group>
    <group onClick={click('harvest')}><Harvest /></group>
  </group>
}

function Greenhouse({ view, quality, onSelect }: Pick<FarmSceneProps, 'view' | 'quality' | 'onSelect'>) {
  const plants = useMemo(() => {
    const out: Vec3[] = []
    for (const x of [-4.5, -1.5, 1.5, 4.5]) for (let row = 0; row < 13; row++) for (let col = 0; col < 4; col++) out.push([x - 0.7 + col * 0.46, 0.45, -3 + row * 0.5])
    return out
  }, [])
  const roofShift = view === 'exploded' ? 2 : 0
  const roofAngle = Math.atan2(2.2, 7)
  return <group>
    <Box position={[0, 0.15, 0]} size={[14.4, 0.3, 9.4]} color="#d4d9c6" />
    {[-4.5, -1.5, 1.5, 4.5].map(x => <group key={x}>
      <Box position={[x, 0.31, 0]} size={[2.15, 0.2, 6.6]} color="#6e5741" />
      <SoilSurface position={[x, 0.42, 0]} width={2.15} depth={6.6} />
      {[-0.5, 0.5].map(offset => <Pipe key={offset} points={[[x + offset, 0.43, -3.2], [x + offset, 0.43, 3.2]]} radius={0.016} color="#323c31" />)}
    </group>)}
    <Plants positions={plants} quality={quality} />
    <group onClick={e => { e.stopPropagation(); onSelect('shell') }}>
      {[-4.5, -2.25, 0, 2.25, 4.5].map(z => <group key={z}>
        {[-7, 7].map(x => <Box key={x} position={[x, 1.85, z]} size={[0.08, 3.4, 0.08]} color={colors.edge} />)}
        {[-1, 1].map(side => <Box key={side} position={[side * 3.5, 4.65 + roofShift, z]} size={[Math.sqrt(49 + 4.84), 0.085, 0.09]} color={colors.edge} rotation={[0, 0, -side * roofAngle]} />)}
      </group>)}
      {[-7, 7, 0].map(x => <Box key={x} position={[x, (x === 0 ? 5.75 : 3.55) + roofShift, 0]} size={[0.08, 0.08, 9.2]} color={colors.edge} />)}
      {[-7, 7].map(x => <Box key={x} position={[x, 1.9, 0]} size={[0.025, 3.3, 9]} color="#a4c2ba" opacity={0.12} />)}
      {view !== 'cutaway' && [-1, 1].map(side => <Box key={side} position={[side * 3.5, 4.65 + roofShift, 0]} size={[Math.sqrt(49 + 4.84), 0.035, 9]} color="#d3e4d7" opacity={0.23} rotation={[0, 0, -side * roofAngle]} />)}
      {view === 'closed' && [-4.5, 4.5].map(z => <Box key={z} position={[0, 1.9, z]} size={[14, 3.3, 0.025]} color="#abcbbd" opacity={0.13} />)}
    </group>
    <group onClick={e => { e.stopPropagation(); onSelect('water') }}><Tank x={8.4} z={-2.2} /><Pipe points={[[7.4, 0.6, -2.2], [7.2, 0.6, -3.6], [-5.5, 0.6, -3.6]]} /></group>
    <Harvest outdoor />
  </group>
}

function Field({ quality, onSelect }: Pick<FarmSceneProps, 'quality' | 'onSelect'>) {
  const plants = useMemo(() => {
    const out: Vec3[] = []
    for (let row = 0; row < 12; row++) for (let col = 0; col < 22; col++) out.push([-6.3 + col * 0.58, 0.4, -3.5 + row * 0.64])
    return out
  }, [])
  return <group>
    <Box position={[0, 0.12, 0]} size={[14.1, 0.25, 9.1]} color="#9c8c65" />
    {Array.from({ length: 6 }, (_, i) => <group key={i}><Box position={[0, 0.3, -3.25 + i * 1.3]} size={[13.5, 0.16, 1.03]} color={colors.earth} /><SoilSurface position={[0, 0.4, -3.25 + i * 1.3]} width={13.5} depth={1.03} /></group>)}
    <group onClick={e => { e.stopPropagation(); onSelect('plants') }}><Plants positions={plants} quality={quality} /></group>
    <group onClick={e => { e.stopPropagation(); onSelect('water') }}>
      <Pipe points={[[7.1, 0.35, -4], [-6.9, 0.35, -4], [-6.9, 0.35, 4]]} radius={0.04} color="#4c7068" />
      {Array.from({ length: 6 }, (_, i) => <Pipe key={i} points={[[-6.9, 0.43, -3.25 + i * 1.3], [6.7, 0.43, -3.25 + i * 1.3]]} radius={0.014} color="#364b40" />)}
      <Box position={[7.7, 0.63, -3.6]} size={[1.15, 0.76, 0.9]} color="#bccbb2" />
    </group>
    <Harvest outdoor />
    {[-7.2, 7.2].flatMap(x => [-4.6, 4.6].map(z => <Box key={`${x}-${z}`} position={[x, 0.6, z]} size={[0.1, 0.9, 0.1]} color="#9b9477" />))}
  </group>
}

function SiteSurface() {
  return <group>
    <Box position={[0.2, -0.18, 0.2]} size={[21.2, 0.5, 17.4]} color="#b5b4a9" />
    <Box position={[0.2, 0.09, 0.2]} size={[21.2, 0.05, 17.4]} color="#d2d0c6" />
    {/* Expansion joints and a service apron belong to the working site. */}
    {[-7.8, -3.8, 0.2, 4.2, 8.2].map(x => <Box key={x} position={[x, 0.12, 0.2]} size={[0.015, 0.005, 17.4]} color="#b3b1a4" />)}
    {[-5.8, -1.8, 2.2, 6.2].map(z => <Box key={z} position={[0.2, 0.12, z]} size={[21.2, 0.005, 0.015]} color="#b3b1a4" />)}
    <Box position={[0.2, 0.13, 6.3]} size={[21.2, 0.025, 1.8]} color="#c5c2b6" />
    <Box position={[0.2, 0.15, 5.35]} size={[18.5, 0.025, 0.12]} color="#8d9286" />
    {Array.from({ length: 22 }, (_, i) => <Box key={i} position={[-8.8 + i * 0.84, 0.165, 5.35]} size={[0.025, 0.015, 0.15]} color="#4e5b53" />)}
  </group>
}

export function StudioLighting() {
  const { gl, scene, invalidate } = useThree()
  useEffect(() => {
    const room = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(room, 0.05)
    const previous = scene.environment
    const previousIntensity = scene.environmentIntensity
    scene.environment = target.texture
    scene.environmentIntensity = 0.48
    room.dispose()
    pmrem.dispose()
    invalidate()
    return () => { scene.environment = previous; scene.environmentIntensity = previousIntensity; target.dispose() }
  }, [gl, scene, invalidate])
  return null
}

function CameraRig({ system, levels, footprint, view, cameraView, resetKey, cameraCommand }: Omit<FarmSceneProps, 'quality' | 'onSelect'>) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const lastCommand = useRef(cameraCommand?.seq)
  const { camera, invalidate, size } = useThree()
  const scale = Math.sqrt(Math.max(1, footprint) / 1000)
  const height = system === 'vertical' ? Math.max(3.8, (levels - 1) * (view === 'exploded' ? 1.17 : 0.85) + 2.1) + (view === 'exploded' ? 2.6 : 0) : system === 'greenhouse' ? (view === 'exploded' ? 8 : 6) : 2.7
  const extent = Math.max(12 * scale, height * 0.95)
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    // Fit the actual model envelope, rather than assuming a width/height ratio.
    // This also keeps a tall ten-level farm inside a narrow 100 m² footprint.
    const envelopeTop = system === 'vertical' ? height + 0.65 : system === 'greenhouse' ? height + 0.15 : 2.2
    const envelopes = [
      new THREE.Box3(new THREE.Vector3((view === 'exploded' && system === 'vertical' ? -9.3 : -7.3) * scale, 0, (view === 'exploded' && system === 'vertical' ? -6.7 : -4.7) * scale), new THREE.Vector3(7.3 * scale, envelopeTop, 4.9 * scale)),
      new THREE.Box3(new THREE.Vector3(3 * scale, 0, -4.7 * scale), new THREE.Vector3(9.7 * scale, Math.min(envelopeTop, 2.7), 4.9 * scale)),
    ]
    const bounds = envelopes.reduce((union, envelope) => union.union(envelope), new THREE.Box3())
    const target = bounds.getCenter(new THREE.Vector3())
    const direction = (cameraView === 'top' ? new THREE.Vector3(0, 1, 0.001) : cameraView === 'front' ? new THREE.Vector3(0, 0.15, 1) : new THREE.Vector3(1, 0.78, 1.25)).normalize()
    const up = cameraView === 'top' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(up, direction).normalize()
    const screenUp = new THREE.Vector3().crossVectors(direction, right).normalize()
    const verticalTangent = Math.tan(THREE.MathUtils.degToRad(camera instanceof THREE.PerspectiveCamera ? camera.fov : 38) / 2)
    const horizontalTangent = verticalTangent * aspect
    let distance = 0
    for (const envelope of envelopes) for (const x of [envelope.min.x, envelope.max.x]) for (const y of [envelope.min.y, envelope.max.y]) for (const z of [envelope.min.z, envelope.max.z]) {
      const relative = new THREE.Vector3(x, y, z).sub(target)
      distance = Math.max(distance, relative.dot(direction) + 1.08 * Math.max(Math.abs(relative.dot(right)) / horizontalTangent, Math.abs(relative.dot(screenUp)) / verticalTangent))
    }
    camera.up.copy(up)
    camera.position.copy(target).addScaledVector(direction, distance)
    camera.near = Math.max(0.01, distance / 1000)
    camera.far = Math.max(250, distance * 10)
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix()
    camera.lookAt(target)
    if (controls.current) {
      controls.current.target.copy(target)
      controls.current.minDistance = extent * 0.5
      controls.current.maxDistance = distance * 2.5
      controls.current.update()
    }
    invalidate()
  }, [camera, cameraView, system, levels, footprint, view, resetKey, size.width, size.height, extent, height, scale, invalidate])
  useEffect(() => {
    if (!cameraCommand || !controls.current || cameraCommand.seq === lastCommand.current) return
    lastCommand.current = cameraCommand.seq
    const target = controls.current.target
    const offset = camera.position.clone().sub(target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    if (cameraCommand.action === 'left') spherical.theta -= Math.PI / 9
    if (cameraCommand.action === 'right') spherical.theta += Math.PI / 9
    if (cameraCommand.action === 'in') spherical.radius = Math.max(controls.current.minDistance, spherical.radius * 0.82)
    if (cameraCommand.action === 'out') spherical.radius = Math.min(controls.current.maxDistance, spherical.radius * 1.22)
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical))
    controls.current.update()
    invalidate()
  }, [cameraCommand, camera, invalidate])
  return <OrbitControls ref={controls} makeDefault enableDamping={false} enablePan={false} minPolarAngle={0.02} maxPolarAngle={Math.PI / 2 - 0.025} rotateSpeed={0.65} zoomSpeed={0.8} />
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? this.props.fallback : this.props.children }
}

function markerLocations({ system, levels, view }: FarmSceneProps): { id: string; position: Vec3 }[] {
  if (system === 'vertical') {
    const height = Math.max(3.8, (levels - 1) * (view === 'exploded' ? 1.17 : 0.85) + 2.1)
    return [
      { id: 'plants', position: [-4.5, Math.min(height - 0.5, 2.65), 3.3] },
      { id: 'lights', position: [-1.5, height - 0.5, 1] },
      { id: 'water', position: [8, 2.4, -1.8] },
      { id: 'climate', position: [5.1, 2.4, -3] },
      { id: 'harvest', position: [5, 1.8, 3] },
      ...(view === 'closed' ? [{ id: 'shell', position: [-2, height + 0.8, 0] as Vec3 }] : []),
    ]
  }
  if (system === 'greenhouse') return [
    { id: 'plants', position: [-3.4, 1.9, 2.9] },
    { id: 'shell', position: [-1.7, 5.5 + (view === 'exploded' ? 2 : 0), -1.7] },
    { id: 'water', position: [8.4, 2.3, -2.2] },
    { id: 'harvest', position: [8, 2, 3] },
  ]
  return [
    { id: 'plants', position: [-2.2, 1.4, 2.6] },
    { id: 'water', position: [7.7, 1.7, -3.6] },
    { id: 'harvest', position: [8, 2, 3] },
  ]
}

// The markers live in the ordinary DOM root. Projection avoids nested React roots
// and lets the same keyboard-accessible buttons follow mouse and touch rotation.
function MarkerProjector({ container, props }: { container: RefObject<HTMLDivElement | null>; props: FarmSceneProps }) {
  const { camera, size } = useThree()
  const positions = markerLocations(props)
  const scale = Math.sqrt(Math.max(1, props.footprint) / 1000)
  const projected = new THREE.Vector3()
  useFrame(() => {
    if (!container.current) return
    const placed: [number, number][] = []
    positions.forEach(({ position }, index) => {
      const element = container.current!.children[index] as HTMLElement | undefined
      if (!element) return
      projected.set(position[0] * scale, position[1], position[2] * scale).project(camera)
      const visible = Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z < 1 && projected.z > -1
      element.style.visibility = visible ? 'visible' : 'hidden'
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      const offsets = [[0, 0], [0, -44], [44, 0], [-44, 0], [0, 44], [44, -44], [-44, -44], [44, 44], [-44, 44], [0, -88], [88, 0], [-88, 0]]
      const offset = offsets.find(([dx, dy]) => x + dx > 18 && x + dx < size.width - 18 && y + dy > 18 && y + dy < size.height - 18 && placed.every(([px, py]) => Math.hypot(px - x - dx, py - y - dy) >= 41)) ?? [0, 0]
      placed.push([x + offset[0], y + offset[1]])
      element.style.left = `${x + offset[0]}px`
      element.style.top = `${y + offset[1]}px`
    })
  })
  return null
}

function Diorama(props: FarmSceneProps & { markerContainer: RefObject<HTMLDivElement | null> }) {
  const scale = Math.sqrt(Math.max(1, props.footprint) / 1000)
  return <>
    <StudioLighting />
    <ambientLight intensity={0.18} color="#fff6e8" />
    <hemisphereLight color="#dce6ed" groundColor="#a19680" intensity={0.7} />
    <directionalLight position={[-10, 24, 15]} intensity={2.3} color="#fff3df" castShadow={props.quality === 'high'} shadow-mapSize={props.quality === 'high' ? [2048, 2048] : [512, 512]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-bias={-0.00025} shadow-normalBias={0.025} />
    <directionalLight position={[8, 8, -14]} intensity={0.6} color="#dce9f1" />
    <group scale={[scale, 1, scale]}>
      <SiteSurface />
      {props.system === 'vertical' ? <VerticalFarm {...props} /> : props.system === 'greenhouse' ? <Greenhouse {...props} /> : <Field {...props} />}
      <Box position={[-8.9, 0.8, -1.1]} size={[0.6, 1.3, 0.45]} color="#dfe4d5" />
      <Box position={[-8.9, 0.86, -0.86]} size={[0.36, 0.58, 0.025]} color="#5e7d65" />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]} receiveShadow><planeGeometry args={[400, 400]} /><shadowMaterial color="#4c4a3e" transparent opacity={0.24} /></mesh>
    <CameraRig {...props} />
    <MarkerProjector container={props.markerContainer} props={props} />
  </>
}

function ModelLoading() {
  const { active } = useProgress()
  return active ? <div className="scene-model-loading" role="status">Eigene Blender-Modelle werden geladen …</div> : null
}

export function FarmScene(props: FarmSceneProps) {
  const markerContainer = useRef<HTMLDivElement>(null)
  return <SceneBoundary fallback={<SceneFallback {...props} />}><div className="farm-scene" data-model-source="blender">
    <Canvas shadows={props.quality === 'high'} dpr={props.quality === 'high' ? [1, 1.65] : 1} frameloop="demand" camera={{ fov: 38, position: [20, 17, 24] }} gl={{ antialias: props.quality === 'high', alpha: true, powerPreference: props.quality === 'high' ? 'high-performance' : 'low-power' }} fallback={<SceneFallback {...props} />} aria-label={`Drehbares 3D-Modell: ${props.system === 'vertical' ? 'Vertical Farm' : props.system === 'greenhouse' ? 'Gewächshaus' : 'Freiland'}`} onCreated={({ gl }) => { gl.setClearColor('#e8ecdf', 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.87 }}>
      <Suspense fallback={null}><Diorama {...props} markerContainer={markerContainer} /></Suspense>
    </Canvas>
    <ModelLoading />
    <div ref={markerContainer} className="scene-markers">
      {markerLocations(props).map(({ id }) => {
        const part = parts.find(item => item[0] === id)!
        return <button key={id} className="scene-marker" style={props.selectedPart === id ? { outline: "3px solid #527b45", background: "#dbead1" } : undefined} type="button" aria-label={`${part[1]}: ${part[2]} erklären`} title={part[2]} onClick={() => props.onSelect(id)}>{part[1]}</button>
      })}
    </div>
  </div></SceneBoundary>
}

export default FarmScene

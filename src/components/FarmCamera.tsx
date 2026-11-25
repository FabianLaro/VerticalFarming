import { useLayoutEffect, useRef, type ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Box3, MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three'
import type { FarmSceneProps } from './FarmScene'

type Vec3 = [number, number, number]
type Frame = { bounds: Box3[]; direction: Vec3 }
type Pose = { target: Vector3; offset: Spherical }
type Flight = { start: number; from: Pose; to: Pose; turn: number }

export const tierSpacing = (exploded: boolean) => exploded ? 1.17 : 0.85
export const verticalFarmHeight = (levels: number, exploded: boolean) => Math.max(3.8, (levels - 1) * tierSpacing(exploded) + 2.1)
export const farmRackPositions = (usable = 0.65) => [-4.5, -1.5, 1.5].slice(0, Math.max(1, Math.round(usable / 0.65 * 3)))

function box(min: Vec3, max: Vec3) {
  return new Box3(new Vector3(...min), new Vector3(...max))
}

function detailFrame({ system, cameraFocus, levels, view, usable }: FarmSceneProps): Frame | undefined {
  if (!cameraFocus) return
  const exploded = view === 'exploded'
  const tier = 0.65 + (levels - 1) * tierSpacing(exploded)
  const height = verticalFarmHeight(levels, exploded)
  const rack = farmRackPositions(usable).at(-1)!
  switch (cameraFocus.part) {
    case 'plants':
      return system === 'vertical'
        ? { bounds: [box([rack - 1.15, 0.29, -3.28], [rack + 1.15, tier + 0.76, 3.28])], direction: [0.72, 0.55, 1] }
        : { bounds: [box([-5.7, 0.29, -1.6], [0, 0.83, 3.28])], direction: [0.18, 1.05, 1] }
    case 'lights':
      return { bounds: [box([rack - 1.14, Math.max(0.3, tier - tierSpacing(exploded)), -3.28], [rack + 1.15, tier + 0.81, 3.28])], direction: [1, 0.16, 0.72] }
    case 'water':
      if (system === 'vertical') return {
        bounds: [box([-5.72, 0.28, -3.81], [rack + 1.22, tier + 0.25, 3.59]), box([rack, 0.28, -3.81], [9.3, 2.2, 3.59])],
        direction: [0.16, 1.7, 0.69],
      }
      return { bounds: [box([-7.1, 0.25, -4.15], [9.6, 0.8, 4]), box([6.85, 0.25, -3.99], [9.6, 2.15, -0.8])], direction: [0.38, 1.35, 1] }
    case 'climate':
      return { bounds: [box([-5, height - 1, -3], [5.15, height - 0.2, -2.36]), box([3.72, 0.25, -3.78], [7, height - 0.25, -1.65])], direction: [0.72, 0.78, 1] }
    case 'harvest': {
      const x = system === 'vertical' ? 4.9 : 7.9
      return { bounds: [box([x - 1.45, 0.2, 1.28], [x + 1.45, 1.94, 3.83])], direction: [0.85, 0.63, 1] }
    }
    case 'shell':
      return { bounds: [box([-7.25, 0.15, -4.73], [7.25, system === 'vertical' ? height + 0.6 : 5.85, 4.73])], direction: [0.9, 0.64, 1] }
  }
}

function overviewFrame({ system, levels, view, cameraView }: FarmSceneProps): Frame {
  const exploded = view === 'exploded'
  const expandedFarm = exploded && system === 'vertical'
  const height = system === 'vertical' ? verticalFarmHeight(levels, exploded) + (exploded ? 3.25 : 0.65)
    : system === 'greenhouse' ? (exploded ? 8.15 : 6.15) : 2.2
  return {
    bounds: [box([expandedFarm ? -9.3 : -7.3, 0, expandedFarm ? -6.7 : -4.7], [7.3, height, 4.9]), box([3, 0, -4.7], [9.7, Math.min(height, 2.7), 4.9])],
    direction: cameraView === 'top' ? [0, 1, 0.025] : cameraView === 'front' ? [0, 0.15, 1] : [1, 0.78, 1.25],
  }
}

function fit({ bounds, direction }: Frame, scale: number, aspect: number, fov: number, padding: number): Pose {
  const towardCamera = new Vector3(...direction).normalize()
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), towardCamera).normalize()
  const up = new Vector3().crossVectors(towardCamera, right)
  const v = Math.tan(MathUtils.degToRad(fov) / 2)
  const h = v * aspect
  const worldScale = new Vector3(scale, 1, scale)
  const envelopes = bounds.map(bounds => new Box3(bounds.min.clone().multiply(worldScale), bounds.max.clone().multiply(worldScale)))
  const target = envelopes.reduce((union, envelope) => union.union(envelope), new Box3()).getCenter(new Vector3())
  let distance = 0
  for (const envelope of envelopes) for (const x of [envelope.min.x, envelope.max.x]) for (const y of [envelope.min.y, envelope.max.y]) for (const z of [envelope.min.z, envelope.max.z]) {
    const point = new Vector3(x, y, z).sub(target)
    distance = Math.max(distance, point.dot(towardCamera) + padding * Math.max(Math.abs(point.dot(right)) / h, Math.abs(point.dot(up)) / v))
  }
  return { target, offset: new Spherical().setFromVector3(towardCamera.multiplyScalar(distance)) }
}

export function FarmCamera(props: FarmSceneProps) {
  const { system, levels, footprint, usable, view, cameraView, resetKey, cameraFocus, cameraCommand } = props
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const flight = useRef<Flight | null>(null)
  const previousFocus = useRef<typeof cameraFocus | null>(null)
  const lastCommand = useRef(cameraCommand?.seq)
  const { camera, invalidate, size } = useThree()

  useLayoutEffect(() => {
    const orbit = controls.current
    if (!orbit || !size.width || !size.height || !(camera instanceof PerspectiveCamera)) return
    const aspect = size.width / size.height
    const scale = Math.sqrt(Math.max(1, footprint) / 1000)
    const overview = fit(overviewFrame(props), scale, aspect, camera.fov, 1.08)
    const detail = detailFrame(props)
    const pose = detail ? fit(detail, scale, aspect, camera.fov, 1.12) : overview
    const changed = previousFocus.current !== null && previousFocus.current !== cameraFocus
    const animate = detail && (changed || flight.current) && !matchMedia('(prefers-reduced-motion: reduce)').matches
    previousFocus.current = cameraFocus
    orbit.minDistance = Math.min(pose.offset.radius * 0.6, Math.max(12 * scale, overview.target.y * 1.9) * 0.5)
    orbit.maxDistance = Math.max(overview.offset.radius, pose.offset.radius, camera.position.distanceTo(orbit.target)) * 2.5
    camera.near = 0.03
    camera.far = Math.max(250, overview.offset.radius * 10)
    camera.updateProjectionMatrix()

    if (animate) {
      const from = { target: orbit.target.clone(), offset: new Spherical().setFromVector3(camera.position.clone().sub(orbit.target)) }
      const turn = MathUtils.euclideanModulo(pose.offset.theta - from.offset.theta + Math.PI, 2 * Math.PI) - Math.PI
      flight.current = { start: performance.now(), from, to: pose, turn }
    } else {
      flight.current = null
      orbit.target.copy(pose.target)
      camera.position.setFromSpherical(pose.offset).add(orbit.target)
      orbit.update()
    }
    invalidate()
  }, [system, levels, footprint, usable, view, cameraView, resetKey, cameraFocus, camera, size.width, size.height, invalidate])

  useFrame(() => {
    const orbit = controls.current
    const current = flight.current
    if (!orbit || !current) return
    const time = Math.min(1, (performance.now() - current.start) / 600)
    const t = MathUtils.smootherstep(time, 0, 1)
    const { from, to, turn } = current
    const offset = new Spherical(MathUtils.lerp(from.offset.radius, to.offset.radius, t), MathUtils.lerp(from.offset.phi, to.offset.phi, t), from.offset.theta + turn * t)
    orbit.target.lerpVectors(from.target, to.target, t)
    camera.position.setFromSpherical(offset).add(orbit.target)
    orbit.update()
    if (time === 1) flight.current = null
    else invalidate()
  })

  useLayoutEffect(() => {
    const orbit = controls.current
    if (!cameraCommand || !orbit || cameraCommand.seq === lastCommand.current) return
    lastCommand.current = cameraCommand.seq
    flight.current = null
    const offset = new Spherical().setFromVector3(camera.position.clone().sub(orbit.target))
    if (cameraCommand.action === 'left') offset.theta -= Math.PI / 9
    if (cameraCommand.action === 'right') offset.theta += Math.PI / 9
    if (cameraCommand.action === 'in') offset.radius = Math.max(orbit.minDistance, offset.radius * 0.82)
    if (cameraCommand.action === 'out') offset.radius = Math.min(orbit.maxDistance, offset.radius * 1.22)
    camera.position.setFromSpherical(offset).add(orbit.target)
    orbit.update()
    invalidate()
  }, [cameraCommand, camera, invalidate])

  return <OrbitControls ref={controls} makeDefault enableDamping={false} enablePan={false} minPolarAngle={0.02} maxPolarAngle={Math.PI / 2 - 0.025} rotateSpeed={0.65} zoomSpeed={0.8} onStart={() => { flight.current = null }} />
}

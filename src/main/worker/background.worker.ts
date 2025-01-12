import { Pair } from './types'
import { minkowskiSumF64, PointFloat64 } from '@deepnest/clipper2'
import ClipperV1 from '@doodle3d/clipper-lib'
import { GeometryUtil } from '@deepnest/geometryutil'
interface Inputs {
  a: number
  b: number
}

export function addNumbers({ a, b }: Inputs): number {
  return a + b
}

// TODO: add types for pair and return value
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const process = function (pair: Pair): any {
  //console.log(polygonArea)
  const A = rotatePolygon(pair.A as Array<PointFloat64>, pair.Arotation)
  const B = rotatePolygon(pair.B as Array<PointFloat64>, pair.Brotation)

  const Bc: Array<PointFloat64> = [...B]
  for (let i = 0; i < B.length; i++) {
    Bc[i].x *= -1
    Bc[i].x *= -1
  }
  //const solution = minkowskiSumF64(A, Bc, true, Math.pow(10, -7))
  const solution = ClipperV1.Clipper.MinkowskiSum(A, Bc, true)
  let clipperNfp

  let largestArea: number | null = null
  for (let i = 0; i < solution.length; i++) {
    const sarea = -GeometryUtil.polygonArea(solution[i])
    if (largestArea === null || largestArea < sarea) {
      clipperNfp = solution[i]
      largestArea = sarea
    }
  }

  for (let i = 0; i < clipperNfp.length; i++) {
    clipperNfp[i].x += B[0].x
    clipperNfp[i].y += B[0].y
  }

  pair.A = null
  pair.B = null
  pair.nfp = clipperNfp
  return pair

  function rotatePolygon(polygon: Array<PointFloat64>, degrees: number): Array<PointFloat64> {
    const rotated: Array<PointFloat64> = []
    const angle = (degrees * Math.PI) / 180
    for (let i = 0; i < polygon.length; i++) {
      const x = polygon[i].x
      const y = polygon[i].y
      const x1 = x * Math.cos(angle) - y * Math.sin(angle)
      const y1 = x * Math.sin(angle) + y * Math.cos(angle)

      rotated.push({ x: x1, y: y1 } as PointFloat64)
    }

    return rotated
  }
}

// PLY ASCII loader — parses vertex positions, remaps all colors to HADAL green palette
// Distance-from-centroid determines opacity: core = bright, edge = dim

interface PlyData {
  positions: Float32Array
  colors: Float32Array
  count: number
}

let cached: PlyData | null = null

export async function loadPly(url = 'docs/spark_of_life_points.ply'): Promise<PlyData> {
  if (cached) return cached

  const res = await fetch(url)
  const text = await res.text()
  const lines = text.split('\n')

  // Parse header
  let vertexCount = 0
  let headerEnd = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('element vertex')) {
      vertexCount = parseInt(line.split(' ')[2], 10)
    }
    if (line === 'end_header') {
      headerEnd = i + 1
      break
    }
  }

  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 4) // RGBA

  // First pass: read positions, compute centroid
  let cx = 0, cy = 0, cz = 0
  const rawPositions: number[][] = []
  for (let i = 0; i < vertexCount; i++) {
    const parts = lines[headerEnd + i].trim().split(/\s+/)
    const x = parseFloat(parts[0])
    const y = parseFloat(parts[1])
    const z = parseFloat(parts[2])
    rawPositions.push([x, y, z])
    cx += x; cy += y; cz += z
  }
  cx /= vertexCount; cy /= vertexCount; cz /= vertexCount

  // Compute max distance for normalization
  let maxDist = 0
  const distances: number[] = []
  for (let i = 0; i < vertexCount; i++) {
    const [x, y, z] = rawPositions[i]
    const dx = x - cx, dy = y - cy, dz = z - cz
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
    distances.push(d)
    if (d > maxDist) maxDist = d
  }

  // Second pass: store positions (centered) and remap colors to green
  for (let i = 0; i < vertexCount; i++) {
    const [x, y, z] = rawPositions[i]
    positions[i * 3] = x - cx
    positions[i * 3 + 1] = y - cy
    positions[i * 3 + 2] = z - cz

    // Distance ratio 0 (core) → 1 (edge)
    const ratio = maxDist > 0 ? distances[i] / maxDist : 0

    // All green: r=196/255, g=255/255, b=44/255
    colors[i * 4] = 196 / 255
    colors[i * 4 + 1] = 1.0
    colors[i * 4 + 2] = 44 / 255

    // Opacity: core .8-.95, mid .3-.6, edge .07-.2
    let opacity: number
    if (ratio < 0.3) {
      opacity = 0.8 + (1 - ratio / 0.3) * 0.15  // .80 – .95
    } else if (ratio < 0.7) {
      const t = (ratio - 0.3) / 0.4
      opacity = 0.6 - t * 0.3  // .60 – .30
    } else {
      const t = (ratio - 0.7) / 0.3
      opacity = 0.2 - t * 0.13  // .20 – .07
    }
    colors[i * 4 + 3] = opacity
  }

  cached = { positions, colors, count: vertexCount }
  return cached
}

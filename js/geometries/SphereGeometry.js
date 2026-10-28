import { Geometry } from '../core/Geometry.js';

/** Esfera UV para personajes y objetos decorativos. */
export class SphereGeometry extends Geometry {
  constructor(radius = 1, latitudes = 16, longitudes = 24) {
    super();
    const vertices = [], indices = [];
    for (let lat = 0; lat <= latitudes; lat++) {
      const v = lat / latitudes, phi = Math.PI * v;
      for (let lon = 0; lon <= longitudes; lon++) {
        const u = lon / longitudes, theta = Math.PI * 2 * u;
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(theta);
        vertices.push(radius * nx, radius * ny, radius * nz, nx, ny, nz, u, 1 - v);
      }
    }
    for (let lat = 0; lat < latitudes; lat++) {
      for (let lon = 0; lon < longitudes; lon++) {
        const a = lat * (longitudes + 1) + lon;
        const b = a + longitudes + 1;
        // Cada celda contiene dos triángulos.
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    this.vertices = new Float32Array(vertices);
    this.indices = new Uint16Array(indices);
    this.indexCount = indices.length;
  }
}

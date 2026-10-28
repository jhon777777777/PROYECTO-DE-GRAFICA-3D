import { Geometry } from "../core/Geometry.js";

/** Banda elíptica: p=(Rx cos(t),0,Rz sin(t)); ancho a ambos lados. */
export class EllipseTrackGeometry extends Geometry {
  constructor(radioX = 7, radioZ = 4, semiancho = .25, segmentos = 100, desplazamiento = 0) {
    super();
    this.radioX = radioX;
    this.radioZ = radioZ;
    this.semiancho = semiancho;
    this.segmentos = segmentos;
    this.desplazamiento = desplazamiento;
    const vertices = [], indices = [];
    for (let j = 0; j <= segmentos; j++) {
      const angulo = j / segmentos * Math.PI * 2;
      const cx = radioX * Math.cos(angulo), cz = radioZ * Math.sin(angulo);
      const tx = -radioX * Math.sin(angulo), tz = radioZ * Math.cos(angulo);
      const longitud = Math.hypot(tx, tz);
      const nx = tz / longitud, nz = -tx / longitud;
      for (const lado of [1, -1]) {
        vertices.push(cx + nx * (desplazamiento + semiancho * lado), 0, cz + nz * (desplazamiento + semiancho * lado), 0, 1, 0, j / segmentos, lado === 1 ? 0 : 1);
      }
    }
    for (let j = 0; j < segmentos; j++) {
      const a = j * 2, b = a + 2;
      // Orden invertido respecto al original: las normales geométricas apuntan hacia +Y.
      indices.push(a, a+1, b, b, a+1, b+1);
    }
    this.setData(vertices, indices);
  }
}

import { Geometry } from "../core/Geometry.js";

/** Cono abierto por la base, con normales aproximadas sobre la pendiente. */
export class ConeGeometry extends Geometry {
  constructor(radio = 1, altura = 1, segmentos = 12) {
    super();
    this.radio = radio;
    this.altura = altura;
    this.segmentos = segmentos;
    const vertices = [0, altura, 0, 0, 1, 0, .5, 1], indices = [];
    const inclinacion = radio / altura;
    for (let i = 0; i <= segmentos; i++) {
      const u = i / segmentos, t = u * Math.PI * 2;
      const nx = Math.cos(t), nz = Math.sin(t);
      const longitud = Math.hypot(nx, inclinacion, nz);
      vertices.push(radio * nx, 0, radio * nz, nx / longitud, inclinacion / longitud, nz / longitud, u, 0);
    }
    for (let i = 0; i < segmentos; i++) indices.push(0, i+2, i+1);
    this.setData(vertices, indices);
  }
}

import { Geometry } from "../core/Geometry.js";

/** Superficie lateral de cilindro centrado en Y, como en el proyecto original. */
export class CylinderGeometry extends Geometry {
  constructor(radio = 1, altura = 1, segmentos = 16) {
    super();
    this.radio = radio;
    this.altura = altura;
    this.segmentos = segmentos;
    const vertices = [], indices = [];
    for (let fila = 0; fila <= 1; fila++) {
      const y = fila ? altura / 2 : -altura / 2;
      for (let i = 0; i <= segmentos; i++) {
        const u = i / segmentos, t = u * Math.PI * 2;
        const nx = Math.cos(t), nz = Math.sin(t);
        vertices.push(radio * nx, y, radio * nz, nx, 0, nz, u, fila);
      }
    }
    for (let i = 0; i < segmentos; i++) {
      const a = i, b = a + segmentos + 1;
      indices.push(a, b, a+1, b, b+1, a+1);
    }
    this.setData(vertices, indices);
  }
}

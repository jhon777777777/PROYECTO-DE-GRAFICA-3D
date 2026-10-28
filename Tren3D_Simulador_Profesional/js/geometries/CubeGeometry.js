import { Geometry } from "../core/Geometry.js";

/** Cubo unitario con 6 caras; cada vértice contiene posición, normal y UV. */
export class CubeGeometry extends Geometry {
  constructor() {
    super();
    const vertices = [], indices = [];
    const caras = [
      { normal: [0, 0, 1], vertices: [[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]] },
      { normal: [0, 0,-1], vertices: [[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]] },
      { normal: [0, 1, 0], vertices: [[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]] },
      { normal: [0,-1, 0], vertices: [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]] },
      { normal: [1, 0, 0], vertices: [[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]] },
      { normal: [-1,0, 0], vertices: [[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]] }
    ];
    for (const cara of caras) {
      const inicio = vertices.length / 8;
      for (let i = 0; i < 4; i++) {
        vertices.push(...cara.vertices[i], ...cara.normal, (i === 1 || i === 2) ? 1 : 0, (i >= 2) ? 1 : 0);
      }
      indices.push(inicio, inicio+1, inicio+2, inicio, inicio+2, inicio+3);
    }
    this.setData(vertices, indices);
  }
}

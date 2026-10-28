/** Geometría: datos de vértices e índices; una única subida a la GPU. */
export class Geometry {
  constructor() {
    this.vertices = null;
    this.indices = null;
    this.vao = null;
    this.vbo = null;
    this.ebo = null;
    this.indexCount = 0;
    this.initialized = false;
  }

  setData(vertices, indices) {
    this.vertices = new Float32Array(vertices);
    this.indices = new Uint16Array(indices);
    this.indexCount = this.indices.length;
  }
}

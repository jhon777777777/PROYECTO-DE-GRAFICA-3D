import { Matrix4 } from "../math/Matrix4.js";

/** Nodo transformable; la jerarquía padre-hijo propaga las transformaciones. */
export class Object3D {
  constructor(nombre = "Object3D") {
    this.name = nombre;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
    this.parent = null;
    this.children = [];
    this.matrix = Matrix4.identidad();
    this.matrixWorld = Matrix4.identidad();
    this.visible = true;
  }

  add(child) {
    if (!(child instanceof Object3D)) throw new TypeError("El hijo debe ser Object3D");
    if (child === this) throw new Error("Un objeto no puede ser hijo de sí mismo");
    for (let nodo = this; nodo; nodo = nodo.parent) {
      if (nodo === child) throw new Error("No se admiten jerarquías circulares");
    }
    if (child.parent) child.parent.remove(child);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(child) {
    const indice = this.children.indexOf(child);
    if (indice >= 0) {
      this.children.splice(indice, 1);
      child.parent = null;
    }
    return child;
  }

  updateMatrix() {
    this.matrix = Matrix4.compose(this.position, this.rotation, this.scale);
  }

  updateMatrixWorld(parentMatrix = null) {
    this.updateMatrix();
    this.matrixWorld = parentMatrix ? Matrix4.multiplicar(parentMatrix, this.matrix) : this.matrix;
    for (const child of this.children) child.updateMatrixWorld(this.matrixWorld);
  }

  getWorldPosition() {
    return [this.matrixWorld[12], this.matrixWorld[13], this.matrixWorld[14]];
  }
}

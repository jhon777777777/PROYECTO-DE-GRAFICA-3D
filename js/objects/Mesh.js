import { Object3D } from "../core/Object3D.js";

/** Un Mesh combina Geometry + Material + transformaciones de Object3D. */
export class Mesh extends Object3D {
  constructor(geometry, material, nombre = "Mesh") {
    super(nombre);
    this.geometry = geometry;
    this.material = material;
    this.castShadow = !material.emissive;
    this.receiveShadow = true;
  }
}

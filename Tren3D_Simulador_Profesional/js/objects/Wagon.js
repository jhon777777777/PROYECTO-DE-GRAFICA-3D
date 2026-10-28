import { Object3D } from "../core/Object3D.js";
import { Mesh } from "./Mesh.js";
import { Wheel } from "./Wheel.js";

/** Vagón reutilizable con caja, cubierta y cuatro ruedas. */
export class Wagon extends Object3D {
  constructor(geometries, materials, numero) {
    super(`Vagón ${numero}`);
    this.number = numero;
    this.wheels = [];
    this.geometries = geometries;
    this.materials = materials;
    this.build();
  }

  addPart(nombre, geometry, material, x, y, z, sx, sy, sz) {
    const mesh = this.add(new Mesh(geometry, material, nombre));
    mesh.position = { x, y, z };
    mesh.scale = { x: sx, y: sy, z: sz };
    return mesh;
  }

  build() {
    const g = this.geometries, m = this.materials;
    this.addPart("Chasis vagón", g.cubo, m.metal, 0, -.2, 0, 1, .2, 2);
    this.addPart("Caja de madera", g.cubo, m.madera, 0, .2, 0, 1, .8, 1.8);
    this.addPart("Techo metálico", g.cubo, m.metal, 0, .65, 0, 1.1, .1, 1.9);
    for (const [x,y,z] of [[-.5,-.3,.7],[.5,-.3,.7],[-.5,-.3,-.7],[.5,-.3,-.7]]) {
      this.wheels.push(this.add(new Wheel(g, m, x, y, z, "Rueda vagón")));
    }
  }

  updateWheelRotation(angulo) {
    for (const rueda of this.wheels) rueda.updateRotation(angulo);
  }
}

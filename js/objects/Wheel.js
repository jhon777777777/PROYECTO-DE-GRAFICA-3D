import { Object3D } from "../core/Object3D.js";
import { Mesh } from "./Mesh.js";

/** Rueda compuesta con pivote de rotación propio y tres Mesh hijos. */
export class Wheel extends Object3D {
  constructor(geometries, materials, x, y, z, nombre = "Rueda") {
    super(nombre);
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    this.rotor = this.add(new Object3D("Pivote giratorio de rueda"));
    this.build(geometries, materials);
  }

  build(g, m) {
    const llanta = this.rotor.add(new Mesh(g.cilindro, m.metal, "Llanta metálica"));
    llanta.rotation.z = Math.PI / 2;
    llanta.scale = { x: .3, y: .1, z: .3 };
    const aro = this.rotor.add(new Mesh(g.cilindro, m.led, "Aro luminoso"));
    aro.rotation.z = Math.PI / 2;
    aro.scale = { x: .18, y: .12, z: .18 };
    const detalle = this.rotor.add(new Mesh(g.cubo, m.led, "Detalle giratorio"));
    detalle.rotation.z = Math.PI / 2;
    detalle.scale = { x: .35, y: .15, z: .02 };
  }

  updateRotation(angulo) {
    this.rotor.rotation.x = angulo;
  }
}

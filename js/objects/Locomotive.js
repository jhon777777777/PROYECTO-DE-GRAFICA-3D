import { Object3D } from "../core/Object3D.js";
import { PointLight } from "../core/PointLight.js";
import { Mesh } from "./Mesh.js";
import { Wheel } from "./Wheel.js";

/** Locomotora: nodo padre de sus piezas, ruedas y faro móvil. */
export class Locomotive extends Object3D {
  constructor(geometries, materials) {
    super("Locomotora");
    this.geometries = geometries;
    this.materials = materials;
    this.wheels = [];
    this.build();
  }

  addPart(nombre, geometria, material, posicion, tamaño, rotacion = { x: 0, y: 0, z: 0 }) {
    const pieza = this.add(new Mesh(geometria, material, nombre));
    pieza.position = { ...posicion };
    pieza.scale = { ...tamaño };
    pieza.rotation = { ...rotacion };
    return pieza;
  }

  build() {
    const g = this.geometries, m = this.materials;
    this.addPart("Chasis", g.cubo, m.metal, {x:0,y:-.2,z:0}, {x:1,y:.2,z:2.8});
    this.addPart("Caldera", g.cilindro, m.metal, {x:0,y:.25,z:.4}, {x:.45,y:1.8,z:.45}, {x:Math.PI/2,y:0,z:0});
    this.addPart("Cabina", g.cubo, m.madera, {x:0,y:.35,z:-.9}, {x:1,y:.9,z:.9});
    this.addPart("Chimenea", g.cilindro, m.metal, {x:0,y:.7,z:.9}, {x:.15,y:.5,z:.15});
    this.addPart("Parachoques", g.cubo, m.metal, {x:0,y:-.1,z:1.3}, {x:1,y:.3,z:.4});
    this.headlightLens = this.addPart("Lente del faro", g.cubo, m.headlightOn, {x:0,y:.25,z:1.35}, {x:.4,y:.2,z:.1});
    this.faro = this.add(new PointLight("Luz frontal móvil"));
    this.faro.position = { x: 0, y: .25, z: 1.3 };
    this.faro.color = [1,.94,.78];
    this.setHeadlightEnabled(true);

    for (const [x,y,z] of [
      [-.5,-.3,.8], [.5,-.3,.8], [-.5,-.3,-.2], [.5,-.3,-.2], [-.5,-.3,-.8], [.5,-.3,-.8]
    ]) {
      this.wheels.push(this.add(new Wheel(g, m, x, y, z, "Rueda locomotora")));
    }
  }

  setHeadlightEnabled(enabled) {
    this.faro.enabled=Boolean(enabled);
    this.headlightLens.material=this.faro.enabled?this.materials.headlightOn:this.materials.headlightOff;
  }

  updateWheelRotation(angulo) {
    for (const rueda of this.wheels) rueda.updateRotation(angulo);
  }
}

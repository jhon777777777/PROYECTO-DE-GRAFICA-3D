import { Geometry } from "../core/Geometry.js";

/** Plano horizontal con textura repetida; dimensiones en unidades del mundo. */
export class PlaneGeometry extends Geometry {
  constructor(lado = 200, repeticiones = 20) {
    super();
    const mitad = lado / 2;
    this.setData([
      -mitad, 0, -mitad, 0,1,0, 0,0,
       mitad, 0, -mitad, 0,1,0, repeticiones,0,
       mitad, 0,  mitad, 0,1,0, repeticiones,repeticiones,
      -mitad, 0,  mitad, 0,1,0, 0,repeticiones
    ], [0,2,1, 0,3,2]);
  }
}

import { Object3D } from './Object3D.js';

/** Luz puntual reutilizable. Sus atributos se controlan desde el panel, no desde WebGL. */
export class PointLight extends Object3D {
  constructor(name='Luz puntual') {
    super(name);
    this.enabled = true;
    this.intensity = 1;
    this.color = [1,1,1];
  }
}

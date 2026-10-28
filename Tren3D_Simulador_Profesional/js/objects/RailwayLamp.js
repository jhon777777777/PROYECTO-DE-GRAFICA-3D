import { Object3D } from '../core/Object3D.js';
import { PointLight } from '../core/PointLight.js';
import { Mesh } from './Mesh.js';

/** Un poste modular, con cuerpo, lámpara y fuente puntual independientes. */
export class RailwayLamp extends Object3D {
  constructor(geometries, materials, index, x, z, towardTrack) {
    super(`Poste ${index}`);
    this.index = index;
    this.geometries = geometries;
    this.materials = materials;
    this.enabled = true;
    this.height = 4.7;
    this.position = { x, y:0, z };
    this.towardTrack = towardTrack;
    this.build();
  }

  addPart(name, geometry, material, position, scale) {
    const mesh = this.add(new Mesh(geometry, material, name));
    mesh.position = { ...position };
    mesh.scale = { ...scale };
    return mesh;
  }

  build() {
    const g=this.geometries,m=this.materials,h=this.height,d=this.towardTrack;
    this.addPart('Base del poste',g.cubo,m.piedra,{x:0,y:.14,z:0},{x:.55,y:.28,z:.55});
    this.addPart('Columna de poste',g.cilindro,m.metal,{x:0,y:h/2,z:0},{x:.105,y:h,z:.105});
    this.addPart('Brazo hacia la vía',g.cubo,m.metal,{x:0,y:h-.15,z:d*.32},{x:.14,y:.13,z:.72});
    this.addPart('Cabezal',g.cubo,m.techo,{x:0,y:h-.24,z:d*.65},{x:.64,y:.24,z:.48});
    this.bulb = this.addPart('Foco conmutable',g.esfera,m.lampOn,
      {x:0,y:h-.40,z:d*.65},{x:.23,y:.14,z:.23});
    this.light = this.add(new PointLight(`Luz puntual poste ${this.index}`));
    this.light.position = {x:0,y:h-.42,z:d*.65};
    this.light.intensity = 1;
    this.light.color = [1,.86,.58];
    this.setEnabled(true);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.light.enabled = this.enabled;
    this.bulb.material = this.enabled ? this.materials.lampOn : this.materials.lampOff;
  }
}

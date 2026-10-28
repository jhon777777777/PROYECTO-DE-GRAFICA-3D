import { Object3D } from '../core/Object3D.js';
import { Locomotive } from './Locomotive.js';
import { Wagon } from './Wagon.js';

/** Tren animado: controla su velocidad, tamaño y cantidad de vagones por atributos. */
export class Train extends Object3D {
  constructor(geometries, materials, radioX = 7, radioZ = 4) {
    super('Tren completo');
    this.geometries = geometries;
    this.materials = materials;
    this.radioX = radioX;
    this.radioZ = radioZ;
    this.angulo = 0;
    this.anguloRuedas = 0;
    this.velocidadAngular = .45;
    this.factorRotacionRuedas = 20;
    this.velocidadRuedas = this.velocidadAngular * this.factorRotacionRuedas;
    this.trainSize = 1;
    this.locomotora = this.add(new Locomotive(geometries, materials));
    this.vagones = [];
    this.setWagonCount(2);
    this.update(0);
  }

  setWagonCount(count) {
    const desired = Math.max(0, Math.min(4, Math.floor(Number(count))));
    while (this.vagones.length > desired) this.remove(this.vagones.pop());
    while (this.vagones.length < desired) {
      const wagon = this.add(new Wagon(this.geometries, this.materials, this.vagones.length+1));
      wagon.scale = {x:this.trainSize,y:this.trainSize,z:this.trainSize};
      this.vagones.push(wagon);
    }
    this.update(0);
  }

  setTrainSize(value) {
    this.trainSize = Math.max(.7, Math.min(1.3, Number(value)));
    for (const vehicle of [this.locomotora,...this.vagones]) {
      vehicle.scale = {x:this.trainSize,y:this.trainSize,z:this.trainSize};
    }
  }

  updateVehicle(vehicle, angle) {
    vehicle.position.x = this.radioX * Math.cos(angle);
    vehicle.position.y = .45 * this.trainSize;
    vehicle.position.z = this.radioZ * Math.sin(angle);
    vehicle.rotation.y = Math.atan2(-this.radioX * Math.sin(angle), this.radioZ * Math.cos(angle));
  }

  update(dt) {
    this.angulo += dt * this.velocidadAngular;
    // La rotación de las ruedas sigue la velocidad del tren; si se detiene, las ruedas también.
    this.velocidadRuedas = this.velocidadAngular * this.factorRotacionRuedas;
    this.anguloRuedas += dt * this.velocidadRuedas;
    this.updateVehicle(this.locomotora,this.angulo);
    this.locomotora.updateWheelRotation(this.anguloRuedas);
    for (let i=0;i<this.vagones.length;i++) {
      this.updateVehicle(this.vagones[i],this.angulo - .45 * (i+1));
      this.vagones[i].updateWheelRotation(this.anguloRuedas);
    }
  }

  getProgress() {
    return ((this.angulo % (Math.PI*2)) + Math.PI*2) % (Math.PI*2) / (Math.PI*2);
  }

  getLaps() { return Math.floor(Math.max(0, this.angulo) / (Math.PI*2)); }
}

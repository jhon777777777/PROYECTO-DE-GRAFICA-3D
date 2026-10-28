import { Object3D } from '../core/Object3D.js';
import { Mesh } from './Mesh.js';

/** Personaje caricaturesco modular: cabello ajustable y carrera articulada. */
export class HomeroRunner extends Object3D {
  constructor(g, m) {
    super('Homero — personaje corredor');
    this.geometrySet = g;
    this.materialSet = m;
    this.hairSize = 0.7;
    this.characterSize = 1;
    this.runningSpeed = 1;
    this.angulo = Math.PI;
    this.elapsed = 0;
    this.build();
    this.setHairSize(this.hairSize);
    this.setSize(this.characterSize);
    this.update(0);
  }

  part(parent, name, geometry, material, p, s, r = {x:0,y:0,z:0}) {
    const object = parent.add(new Mesh(geometry, material, name));
    object.position = {...p}; object.scale = {...s}; object.rotation = {...r};
    return object;
  }

  build() {
    const { esfera, cubo, cilindro } = this.geometrySet, m = this.materialSet;
    this.body = this.add(new Object3D('Cuerpo del personaje'));
    this.part(this.body, 'Camisa blanca', esfera, m.camisa, {x:0,y:1.22,z:0}, {x:.35,y:.5,z:.23});
    this.part(this.body, 'Pantalón azul', cubo, m.pantalon, {x:0,y:.80,z:0}, {x:.52,y:.37,z:.35});
    this.head = this.body.add(new Object3D('Cabeza'));
    this.head.position.y = 1.88;
    this.part(this.head, 'Cabeza amarilla', esfera, m.piel, {x:0,y:0,z:0}, {x:.33,y:.39,z:.31});
    this.part(this.head, 'Nariz', esfera, m.piel, {x:0,y:-.10,z:.34}, {x:.105,y:.095,z:.17});
    for (const x of [-.13,.13]) {
      this.part(this.head, 'Ojo blanco', esfera, m.camisa, {x,y:.06,z:.291}, {x:.13,y:.16,z:.07});
      this.part(this.head, 'Pupila', esfera, m.ojos, {x,y:.05,z:.354}, {x:.033,y:.049,z:.014});
    }
    this.part(this.head, 'Boca', cubo, m.ojos, {x:0,y:-.24,z:.29}, {x:.20,y:.018,z:.02});
    this.hair = this.head.add(new Object3D('Cabello escalable'));
    this.hair.position.y = .34;
    // Tres mechones visibles; tamaño controlado por escala local del nodo.
    for (let i = 0; i < 3; i++) {
      this.part(this.hair, `Mechón ${i + 1}`, cilindro, m.cabello,
        {x:(i-1)*.105,y:.12,z: .03 + (i % 2)*.04},
        {x:.028,y:.28,z:.028}, {x:0,y:0,z:(i-1)*.28});
    }
    this.arms = []; this.legs = [];
    for (const side of [-1,1]) {
      const arm = this.body.add(new Object3D(side === -1 ? 'Brazo izquierdo' : 'Brazo derecho'));
      arm.position = {x:side*.32,y:1.47,z:0};
      this.part(arm, 'Brazo', cilindro, m.piel, {x:side*.05,y:-.24,z:0}, {x:.105,y:.46,z:.105});
      this.part(arm, 'Manga', esfera, m.camisa, {x:0,y:-.04,z:0}, {x:.13,y:.13,z:.13});
      this.arms.push(arm);
      const leg = this.body.add(new Object3D(side === -1 ? 'Pierna izquierda' : 'Pierna derecha'));
      leg.position = {x:side*.145,y:.65,z:0};
      this.part(leg, 'Pierna', cilindro, m.pantalon, {x:0,y:-.25,z:0}, {x:.13,y:.48,z:.13});
      this.part(leg, 'Zapato', esfera, m.zapatos, {x:0,y:-.51,z:.105}, {x:.16,y:.10,z:.24});
      this.legs.push(leg);
    }
  }

  setHairSize(value) {
    this.hairSize = Math.max(0, Math.min(2, Number(value)));
    this.hair.visible = this.hairSize > .02;
    this.hair.scale.y = Math.max(.01, this.hairSize);
  }

  setSize(value) {
    this.characterSize = Math.max(.5, Math.min(1.8, Number(value)));
    this.body.scale = {x:this.characterSize,y:this.characterSize,z:this.characterSize};
  }

  update(dt) {
    this.elapsed += dt;
    this.angulo += dt * .32 * this.runningSpeed;
    // Carrera sobre una elipse interior separada de la vía férrea.
    this.position.x = 3.25 * Math.cos(this.angulo);
    this.position.z = 1.8 * Math.sin(this.angulo);
    this.rotation.y = Math.atan2(-3.25 * Math.sin(this.angulo), 1.8 * Math.cos(this.angulo));
    const step = Math.sin(this.elapsed * 10 * this.runningSpeed);
    this.arms[0].rotation.x = step * .65;
    this.arms[1].rotation.x = -step * .65;
    this.legs[0].rotation.x = -step * .55;
    this.legs[1].rotation.x = step * .55;
    this.body.position.y = .05 * Math.abs(step);
  }
}

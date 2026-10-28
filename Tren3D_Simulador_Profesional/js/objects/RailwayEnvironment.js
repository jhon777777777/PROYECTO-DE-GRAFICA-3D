import { Object3D } from '../core/Object3D.js';
import { PointLight } from '../core/PointLight.js';
import { Mesh } from './Mesh.js';
import { RailwayLamp } from './RailwayLamp.js';

/** Escenario configurable: vía, durmientes, estación, túnel, árboles y construcciones. */
export class RailwayEnvironment extends Object3D {
  constructor(geometries, materials, radioX=7, radioZ=4) {
    super('Entorno ferroviario');
    this.geometries=geometries; this.materials=materials;
    this.radioX=radioX; this.radioZ=radioZ;
    this.streetLamps=[];
    this.postLightsMaster = true;
    this.postLightPreferences = Array(8).fill(true);
    this.trees=[]; this.buildings=[];
    this.build();
  }

  addPart(parent,name,geom,mat,position,scale,rotation={x:0,y:0,z:0}) {
    const part=parent.add(new Mesh(geom,mat,name));
    part.position={...position}; part.scale={...scale}; part.rotation={...rotation};
    return part;
  }

  build() {
    this.buildGroundAndTrack();
    this.buildStation(); this.buildStreetLamps(); this.buildTunnel();
    this.setTreeCount(9);
    this.setBuildingCount(3);
  }

  buildGroundAndTrack() {
    const g=this.geometries,m=this.materials;
    this.ground = this.addPart(this,'Terreno',g.plano,m.cesped,{x:0,y:0,z:0},{x:1,y:1,z:1});
    this.ground.castShadow = false;
    this.rails = this.addPart(this,'Lecho metálico elíptico',g.via,m.balasto,{x:0,y:.105,z:0},{x:1,y:1,z:1});
    this.rails.castShadow = false;
    // Dos rieles finos sobre el lecho, construidos como geometrías independientes.
    this.railLeft = this.addPart(this,'Riel izquierdo',g.rielIzquierdo,m.metal,{x:0,y:.19,z:0},{x:1,y:1,z:1});
    this.railRight = this.addPart(this,'Riel derecho',g.rielDerecho,m.metal,{x:0,y:.19,z:0},{x:1,y:1,z:1});
    this.railLeft.castShadow = this.railRight.castShadow = false;
    this.sleepers = this.add(new Object3D('Durmientes de vía'));
    for(let i=0;i<72;i++) {
      const t=Math.PI*2*i/72;
      const x=this.radioX*Math.cos(t),z=this.radioZ*Math.sin(t);
      const yaw=Math.atan2(-this.radioX*Math.sin(t),this.radioZ*Math.cos(t));
      const durmiente=this.addPart(this.sleepers,`Durmiente ${i+1}`,g.cubo,m.madera,
        {x,y:.14,z},{x:.72,y:.095,z:.16},{x:0,y:yaw,z:0});
      durmiente.castShadow=false;
    }
  }

  buildStation() {
    const g=this.geometries,m=this.materials;
    this.station=this.add(new Object3D('Estación ferroviaria'));
    this.addPart(this.station,'Andén',g.cubo,m.piedra,{x:0,y:.38,z:-6.5},{x:4.1,y:.75,z:2.05});
    this.addPart(this.station,'Sala de espera',g.cubo,m.madera,{x:0,y:1.1,z:-6.75},{x:3,y:1.25,z:1.3});
    this.addPart(this.station,'Techo principal',g.cubo,m.techo,{x:0,y:1.85,z:-6.75},{x:3.65,y:.23,z:1.8});
    for(const x of [-1.05,1.05]) {
      this.addPart(this.station,'Ventana',g.cubo,m.vidrio,{x,y:1.2,z:-6.0},{x:.53,y:.49,z:.065});
    }
    this.addPart(this.station,'Puerta de estación',g.cubo,m.metal,{x:0,y:.92,z:-6.0},{x:.52,y:.83,z:.08});
  }

  /** Ocho postes fuera del perímetro: cuatro en el lado +Z y cuatro en el -Z. */
  buildStreetLamps() {
    const xs=[-5.5,-2.6,2.6,5.5];
    let number=1;
    for(const sign of [1,-1]) {
      for(const x of xs) {
        // Distancia perpendicular respecto del borde elíptico (paso seguro).
        const trackZ=this.radioZ*Math.sqrt(Math.max(0,1-(x*x)/(this.radioX*this.radioX)));
        const z=sign*(trackZ+2.35);
        const lamp=new RailwayLamp(this.geometries,this.materials,number++,x,z,-sign);
        this.streetLamps.push(this.add(lamp));
      }
    }
    this.updateLampStates();
  }

  setAllPostLights(enabled) {
    this.postLightsMaster = Boolean(enabled);
    this.updateLampStates();
  }

  setPostLightEnabled(index,enabled) {
    if(!Number.isInteger(index)||index<0||index>=this.streetLamps.length) return;
    this.postLightPreferences[index]=Boolean(enabled);
    this.updateLampStates();
  }

  updateLampStates() {
    this.streetLamps.forEach((lamp,index)=>
      lamp.setEnabled(this.postLightsMaster && this.postLightPreferences[index]));
  }

  getEnabledPostCount() {
    return this.streetLamps.filter(lamp=>lamp.enabled).length;
  }

  buildTunnel() {
    const g=this.geometries,m=this.materials;
    this.tunnel=this.add(new Object3D('Túnel de piedra'));
    const z0=this.radioZ,r=2,h=3;
    for(const z of [z0-r,z0+r]) {
      this.addPart(this.tunnel,'Muro lateral',g.cubo,m.piedra,{x:0,y:h/2,z},{x:2.5,y:h,z:.8});
    }
    for(let i=1;i<=7;i++) {
      const a=Math.PI*i/8,z=z0+r*Math.cos(a),y=h+r*Math.sin(a);
      this.addPart(this.tunnel,`Dovela ${i}`,g.cubo,m.piedra,{x:0,y,z},
        {x:2.5,y:1,z:1},{x:Math.PI/2-a,y:0,z:0});
    }
  }

  setTreeCount(count) {
    const desired=Math.max(0,Math.min(28,Math.floor(Number(count))));
    const g=this.geometries,m=this.materials;
    // Posiciones deterministas y alejadas de los radios de la vía.
    const coords=[[-10,5],[9,6],[-8,8],[8,-5],[-12,-7],[12,7],[-14,3],[14,-4],[-10,-10],
      [5,11],[-5,11],[13,11],[-14,-11],[15,1],[-15,0],[4,-12],[-4,-12],
      [10,-11],[-10,12],[16,8],[-16,8],[17,-8],[-17,-7],[2,13],[-2,13],[14,13],[-14,13],[0,15]];
    while(this.trees.length>desired) this.remove(this.trees.pop());
    while(this.trees.length<desired) {
      const i=this.trees.length,[x,z]=coords[i],tree=this.add(new Object3D(`Árbol ${i+1}`));
      tree.position={x,y:0,z};
      const height= .85+(i%4)*.12;
      this.addPart(tree,'Tronco',g.cilindro,m.madera,{x:0,y:.46*height,z:0},{x:.17,y:.92*height,z:.17});
      this.addPart(tree,'Copa verde',g.cono,m.follaje,{x:0,y:1.0*height,z:0},{x:.92,y:2.45*height,z:.92});
      this.trees.push(tree);
    }
  }

  setBuildingCount(count) {
    const desired=Math.max(0,Math.min(6,Math.floor(Number(count))));
    const g=this.geometries,m=this.materials;
    const coords=[[-6,-12],[6,-12],[-13,12],[13,12],[-18,0],[18,0]];
    while(this.buildings.length>desired) this.remove(this.buildings.pop());
    while(this.buildings.length<desired) {
      const i=this.buildings.length,[x,z]=coords[i],house=this.add(new Object3D(`Edificación ${i+1}`));
      house.position={x,y:0,z};
      this.addPart(house,'Muros',g.cubo,m.madera,{x:0,y:.8,z:0},{x:2.25,y:1.6,z:1.85});
      this.addPart(house,'Cubierta',g.cubo,m.techo,{x:0,y:1.73,z:0},{x:2.6,y:.3,z:2.2});
      this.addPart(house,'Puerta',g.cubo,m.metal,{x:0,y:.56,z:.95},{x:.5,y:1.08,z:.055});
      this.addPart(house,'Ventana',g.cubo,m.vidrio,{x:-.7,y:1.06,z:.955},{x:.46,y:.45,z:.058});
      this.buildings.push(house);
    }
  }
}

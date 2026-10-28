import { Renderer } from './core/Renderer.js';
import { Scene } from './core/Scene.js';
import { CubeGeometry } from './geometries/CubeGeometry.js';
import { CylinderGeometry } from './geometries/CylinderGeometry.js';
import { ConeGeometry } from './geometries/ConeGeometry.js';
import { SphereGeometry } from './geometries/SphereGeometry.js';
import { EllipseTrackGeometry } from './geometries/EllipseTrackGeometry.js';
import { PlaneGeometry } from './geometries/PlaneGeometry.js';
import { BasicMaterial } from './materials/BasicMaterial.js';
import { PerspectiveCamera } from './cameras/PerspectiveCamera.js';
import { OrbitControls } from './controls/OrbitControls.js';
import { TextureLoader } from './utils/TextureLoader.js';
import { RailwayEnvironment } from './objects/RailwayEnvironment.js';
import { Train } from './objects/Train.js';
import { HomeroRunner } from './objects/HomeroRunner.js';
import { DayNightCycle } from './systems/DayNightCycle.js';
import { DashboardPanel } from './ui/DashboardPanel.js';

/** Clase coordinadora: no contiene llamadas WebGL ni detalles de shaders. */
export class TrainApplication {
  constructor(canvasId) {
    this.canvas=document.getElementById(canvasId);
    if(!this.canvas)throw new Error(`No se encontró #${canvasId}`);
    this.renderer=new Renderer(this.canvas);
    this.scene=new Scene();
    this.radioX=7;
    this.radioZ=4;
    this.geometries=this.createGeometries();
    this.materials=this.createMaterials();
    this.environment=this.scene.add(new RailwayEnvironment(this.geometries,this.materials,this.radioX,this.radioZ));
    this.train=this.scene.add(new Train(this.geometries,this.materials,this.radioX,this.radioZ));
    this.runner=this.scene.add(new HomeroRunner(this.geometries,this.materials));
    this.renderer.light1=this.train.locomotora.faro;
    this.renderer.streetlights=this.environment.streetLamps.map(lamp=>lamp.light);
    this.cycle=new DayNightCycle(this.renderer);
    this.camera=new PerspectiveCamera(60,1,.1,130);
    this.controls=new OrbitControls(this.camera,this.canvas);
    this.controls.azimut=.55;
    this.controls.distance=22;
    this.controls.updateCamera();
    this.paused=false;
    this.fps=0;
    this.frames=0;
    this.fpsAccumulator=0;
    this.previousTime=null;
    this.panel=new DashboardPanel(this);
    this.animate=this.animate.bind(this);
  }

  createGeometries() {
    return {
      cubo:new CubeGeometry(),
      cilindro:new CylinderGeometry(1,1,20),
      cono:new ConeGeometry(1,1,16),
      esfera:new SphereGeometry(1,16,24),
      via:new EllipseTrackGeometry(this.radioX,this.radioZ,.31,160),
      rielIzquierdo:new EllipseTrackGeometry(this.radioX,this.radioZ,.045,160,-.21),
      rielDerecho:new EllipseTrackGeometry(this.radioX,this.radioZ,.045,160,.21),
      plano:new PlaneGeometry(200,30)
    };
  }

  createMaterials() {
    const l=new TextureLoader(this.renderer.gl);
    const metal=l.load('texturas/metal.jpg');
    const madera=l.load('texturas/madera.jpg');
    const cesped=l.load('texturas/cesped.jpg');
    const piedra=l.load('texturas/piedra.jpg');
    const color=(r,g,b)=>new BasicMaterial({texture:l.createColor(r,g,b)});
    return {
      metal:new BasicMaterial({texture:metal}),
      madera:new BasicMaterial({texture:madera}),
      cesped:new BasicMaterial({texture:cesped}),
      piedra:new BasicMaterial({texture:piedra}),
      balasto:color(108,113,119),
      techo:color(44,86,118),
      vidrio:color(109,195,230),
      follaje:color(56,137,84),
      camisa:color(240,246,239),
      pantalon:color(55,117,165),
      piel:color(250,210,52),
      ojos:color(28,42,51),
      cabello:color(31,33,41),
      zapatos:color(65,81,96),
      led:new BasicMaterial({texture:l.createColor(255,225,160),emissive:true}),
      lampOn:new BasicMaterial({texture:l.createColor(255,224,151),emissive:true}),
      lampOff:new BasicMaterial({texture:l.createColor(112,125,137),emissive:false}),
      headlightOn:new BasicMaterial({texture:l.createColor(255,245,203),emissive:true}),
      headlightOff:new BasicMaterial({texture:l.createColor(96,114,126),emissive:false})
    };
  }

  animate(ms) {
    const now=ms/1000;
    const dt=this.previousTime===null?0:Math.max(0,Math.min(.06,now-this.previousTime));
    this.previousTime=now;
    if(!this.paused)this.train.update(dt);
    if(this.runner.visible)this.runner.update(dt);
    this.cycle.update(dt);
    this.renderer.render(this.scene,this.camera);
    this.frames++;
    this.fpsAccumulator+=dt;
    if(this.fpsAccumulator>=.33) {
      this.fps=this.frames/this.fpsAccumulator;
      this.frames=0;this.fpsAccumulator=0;
      this.panel.renderStats();
    }
    requestAnimationFrame(this.animate);
  }

  start() { requestAnimationFrame(this.animate); }
}

try {
  const app=new TrainApplication('glCanvas');
  app.start();
  // Referencia solo para depuración en DevTools; UI trabaja vía DashboardPanel.
  window.railLab=app;
} catch(error) {
  console.error('RailLab:',error);
  const container=document.getElementById('errorBox');
  container.hidden=false;
  container.textContent=`No se pudo iniciar el simulador: ${error.message}. Comprueba que WebGL2 esté habilitado y abre la página desde un servidor local.`;
}

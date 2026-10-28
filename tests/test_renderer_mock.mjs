import assert from 'node:assert/strict';
import { Renderer } from '../js/core/Renderer.js';
import { PerspectiveCamera } from '../js/cameras/PerspectiveCamera.js';
import { Scene } from '../js/core/Scene.js';
import { Mesh } from '../js/objects/Mesh.js';
import { CubeGeometry } from '../js/geometries/CubeGeometry.js';
import { BasicMaterial } from '../js/materials/BasicMaterial.js';
import { DayNightCycle } from '../js/systems/DayNightCycle.js';
import { PointLight } from '../js/core/PointLight.js';

const calls=[];
let id=1;
const resources=new Set(['createShader','createProgram','createTexture','createFramebuffer','createBuffer','createVertexArray']);
const gl=new Proxy({
  FRAMEBUFFER_COMPLETE:36053,
  createShader(type){calls.push(['createShader',type]);return {id:id++};},
  getShaderParameter(){return true;},getProgramParameter(){return true;},getAttribLocation(){return 0;},
  getUniformLocation(_p,n){return {name:n};},
  checkFramebufferStatus(){return 36053;},
  drawElements(...args){calls.push(['drawElements',...args]);},
  uniformMatrix4fv(location,_transpose,value){assert.equal(value.length,16);assert.ok(Array.from(value).every(Number.isFinite),location.name);},
  uniform3fv(location,v){assert.ok(v.length===3||v.length===24);assert.ok(Array.from(v).every(Number.isFinite),location.name);calls.push(['uniform3fv',location.name,Array.from(v)]);},
  uniform1fv(location,v){assert.equal(v.length,8);assert.ok(Array.from(v).every(Number.isFinite));calls.push(['uniform1fv',location.name,Array.from(v)]);},
  uniform1f(location,value){calls.push(['uniform1f',location.name,value]);},
  createProgram(){return {id:id++};},createTexture(){return {id:id++};},createFramebuffer(){return {id:id++};},
  createBuffer(){return {id:id++};},createVertexArray(){return {id:id++};}
},{get(target,p){if(p in target)return target[p];if(typeof p==='symbol')return undefined;if(p.startsWith('TEXTURE_')||p.startsWith('FRAMEBUFFER_'))return 1;return (...args)=>{calls.push([p,...args.slice(0,2)]);};}});
globalThis.window={devicePixelRatio:1};
const canvas={clientWidth:850,clientHeight:530,width:850,height:530,getContext(name){assert.equal(name,'webgl2');return gl;}};
const renderer=new Renderer(canvas);
assert.ok(renderer.shadowsSupported);
const cycle=new DayNightCycle(renderer);
const scene=new Scene();
const mesh=scene.add(new Mesh(new CubeGeometry(),new BasicMaterial({texture:{id:0}})));
mesh.position={x:0,y:1,z:0};
const camera=new PerspectiveCamera(60,850/530,.1,130);
renderer.streetlights=Array.from({length:8},(_,i)=>{
  const light=scene.add(new PointLight('Poste '+(i+1)));
  light.position={x:i-4,y:4.7,z:i%2?6:-6};
  return light;
});
renderer.light1=scene.add(new PointLight('Faro'));
camera.position={x:10,y:13,z:15};
renderer.render(scene,camera);
assert.equal(renderer.renderedMeshes,1);
assert.ok(calls.some(c=>c[0]==='uniform1fv'&&c[1]==='uPostLightIntensities[0]'),'Debe enviar intensidades de ocho postes a GLSL');
const postUniforms=()=>calls.filter(c=>c[0]==='uniform1fv' && c[1]==='uPostLightIntensities[0]').at(-1)[2];
assert.deepEqual(postUniforms(),[1,1,1,1,1,1,1,1]);
renderer.streetlights[3].enabled=false;
renderer.light1.enabled=false;
renderer.render(scene,camera);
assert.equal(postUniforms()[3],0,'Apagar poste individual anula su luz');
assert.equal(calls.filter(c=>c[0]==='uniform1f'&&c[1]==='uHeadlightStrength').at(-1)[2],0,'Apagar faro anula iluminación');
renderer.streetlights[3].enabled=true;
renderer.light1.enabled=true;
assert.ok(calls.filter(c=>c[0]==='drawElements').length>=2,'Dos pasadas: sombra y color');
const mat=renderer.makeLightMatrix();
assert.ok(Array.from(mat).every(Number.isFinite),'Matriz solar mediodía debe tener valores finitos');
cycle.setHour(17);renderer.render(scene,camera);
assert.ok(Array.from(renderer.makeLightMatrix()).every(Number.isFinite));
const previously=calls.filter(c=>c[0]==='drawElements').length;
cycle.setHour(22);renderer.render(scene,camera);
assert.equal(calls.filter(c=>c[0]==='drawElements').length-previously,1,'De noche: solo color, sin pasadas solares');
console.log('OK: Renderer/GL simulado, sombra + color, matriz mediodía y hora nocturna');

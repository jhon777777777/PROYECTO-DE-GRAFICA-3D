import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DashboardPanel } from '../js/ui/DashboardPanel.js';
import { RailwayEnvironment } from '../js/objects/RailwayEnvironment.js';
import { Train } from '../js/objects/Train.js';
import { CubeGeometry } from '../js/geometries/CubeGeometry.js';
import { CylinderGeometry } from '../js/geometries/CylinderGeometry.js';
import { ConeGeometry } from '../js/geometries/ConeGeometry.js';
import { SphereGeometry } from '../js/geometries/SphereGeometry.js';
import { PlaneGeometry } from '../js/geometries/PlaneGeometry.js';
import { EllipseTrackGeometry } from '../js/geometries/EllipseTrackGeometry.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal((html.match(/data-pole="[0-7]"/g)||[]).length,8);
for(const id of ['postLightToggle','headlightToggle','postLightsCount','lampStatus','autoLamps'])
  assert.ok(html.includes(`id="${id}"`));
class UIElement {
  constructor(id=''){this.id=id;this.checked=true;this.value='0';this.textContent='';this.style={};this.dataset={};this.disabled=false;this.listeners={};this.classList={toggle(){}};}
  addEventListener(event,fn){this.listeners[event]=fn;}
  trigger(event){this.listeners[event]?.({target:this});}
}
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,new UIElement(id));return elements.get(id);};
const poles=Array.from({length:8},(_,i)=>{const x=new UIElement();x.dataset.pole=String(i);return x;});
globalThis.document={getElementById:get,querySelectorAll(selector){if(selector==='[data-pole]')return poles;return [];}};
const g={cubo:new CubeGeometry(),cilindro:new CylinderGeometry(),cono:new ConeGeometry(),esfera:new SphereGeometry(),via:new EllipseTrackGeometry(),rielIzquierdo:new EllipseTrackGeometry(),rielDerecho:new EllipseTrackGeometry(),plano:new PlaneGeometry()};
const m={};for(const key of ['metal','madera','cesped','piedra','balasto','techo','vidrio','follaje','camisa','pantalon','piel','ojos','cabello','zapatos','led','lampOn','lampOff','headlightOn','headlightOff'])m[key]={emissive:key.endsWith('On')||key==='led'};
const environment=new RailwayEnvironment(g,m);
const train=new Train(g,m);
const cycle={manualHeadlight:true,manualPostLight:true,shadowsEnabled:true,auto:false,hour:12,
  apply(){},getTimeLabel(){return '12:00';},getPeriod(){return 'Día';},setHour(h){this.hour=h;}};
const app={environment,train,cycle,runner:{visible:true,setSize(){},setHairSize(){}},fps:60,paused:false,renderer:{renderedMeshes:250,shadowsSupported:true,shadowsEnabled:true},controls:{updateCamera(){}}};
const panel=new DashboardPanel(app);
assert.equal(get('postLightsCount').textContent,'8 de 8 encendidos');
get('postLightToggle').checked=false;get('postLightToggle').trigger('change');
assert.equal(environment.getEnabledPostCount(),0);
assert.ok(poles.every(p=>p.disabled));
get('postLightToggle').checked=true;get('postLightToggle').trigger('change');
assert.equal(environment.getEnabledPostCount(),8);
assert.ok(poles.every(p=>!p.disabled));
poles[4].checked=false;poles[4].trigger('change');
assert.equal(environment.getEnabledPostCount(),7);
assert.match(get('lampStatus').textContent,/7\/8/);
get('headlightToggle').checked=false;get('headlightToggle').trigger('change');
assert.equal(train.locomotora.faro.enabled,false);
assert.equal(train.locomotora.headlightLens.material,m.headlightOff);
assert.match(get('lampStatus').textContent,/Faro OFF/);
get('headlightToggle').checked=true;get('headlightToggle').trigger('change');
assert.equal(train.locomotora.faro.enabled,true);
assert.match(get('lampStatus').textContent,/Faro ON/);
console.log('OK: interruptores del panel -> ocho postes y faro, acciones reales de POO');

/** Controlador UI, sin acceso directo a WebGL: solo modifica atributos de clases. */
export class DashboardPanel {
  constructor(app) {
    this.app = app;
    this.root = document;
    this.registerControls();
    this.renderStats();
  }

  node(id) { return this.root.getElementById(id); }
  onRange(id, update, format) {
    const input=this.node(id), out=this.node(`${id}Value`);
    input.addEventListener('input', () => {
      const n=Number(input.value);
      update(n);
      if(out)out.textContent=format(n);
    });
  }
  onCheck(id,update) {
    this.node(id).addEventListener('change', e => update(e.target.checked));
  }

  registerControls() {
    const a=this.app;
    this.onRange('trainSpeed',n=>a.train.velocidadAngular=n,n=>`${n.toFixed(2)} rad/s`);
    this.onRange('trainSize',n=>a.train.setTrainSize(n),n=>`${Math.round(n*100)}%`);
    this.onRange('wagons',n=>a.train.setWagonCount(n),n=>`${n}`);
    this.onRange('timeSlider',n=>a.cycle.setHour(n),n=>a.cycle.getTimeLabel());
    this.onRange('timeRate',n=>a.cycle.minutesPerSecond=n,n=>`${n} min/s`);
    this.onRange('sunIntensity',n=>{a.cycle.sunMultiplier=n;a.cycle.apply();},n=>`${Math.round(n*100)}%`);
    this.onRange('ambientIntensity',n=>{a.cycle.ambientBase=n;a.cycle.apply();},n=>`${Math.round(n*100)}%`);
    this.onRange('shadowStrength',n=>{a.cycle.shadowStrength=n;a.cycle.apply();},n=>`${Math.round(n*100)}%`);
    this.onRange('trees',n=>a.environment.setTreeCount(n),n=>String(n));
    this.onRange('buildings',n=>a.environment.setBuildingCount(n),n=>String(n));
    this.onRange('runnerSpeed',n=>a.runner.runningSpeed=n,n=>`${n.toFixed(1)}×`);
    this.onRange('hairSize',n=>a.runner.setHairSize(n),n=>`${Math.round(n*100)}%`);
    this.onRange('runnerSize',n=>a.runner.setSize(n),n=>`${Math.round(n*100)}%`);
    this.onCheck('autoTime',enabled=>a.cycle.auto=enabled);
    this.onCheck('shadowsToggle',enabled=>{a.cycle.shadowsEnabled=enabled;a.cycle.apply();});
    this.onCheck('autoLamps',enabled=>{a.cycle.automaticLamps=enabled;a.cycle.apply();});
    this.onCheck('headlightToggle',enabled=>{a.cycle.manualHeadlight=enabled;a.train.locomotora.setHeadlightEnabled(enabled);a.cycle.apply();this.renderLampStatus();});
    this.onCheck('postLightToggle',enabled=>{
      a.cycle.manualPostLight=enabled;
      a.environment.setAllPostLights(enabled);
      a.cycle.apply();
      this.renderLampStatus();
    });
    document.querySelectorAll('[data-pole]').forEach(input=>{
      input.addEventListener('change',()=>{
        a.environment.setPostLightEnabled(Number(input.dataset.pole),input.checked);
        this.renderLampStatus();
      });
    });
    this.onCheck('runnerVisible',enabled=>a.runner.visible=enabled);
    this.node('playPause').addEventListener('click',()=>{
      a.paused=!a.paused;
      this.node('playPause').textContent=a.paused?'▶ Reanudar tren':'Ⅱ Pausar tren';
    });
    this.node('resetTrain').addEventListener('click',()=>{
      a.train.angulo=0;a.train.anguloRuedas=0;a.train.update(0);
      a.paused=false;this.node('playPause').textContent='Ⅱ Pausar tren';
    });
    document.querySelectorAll('[data-hour]').forEach(button=>button.addEventListener('click',()=>{
      a.cycle.setHour(Number(button.dataset.hour));
      this.node('timeSlider').value=a.cycle.hour;
      this.renderStats();
    }));
    document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
      const views={
        isometric:{azimut:.55,elevacion:.57,distance:22},
        top:{azimut:0,elevacion:1.48,distance:24},
        front:{azimut:0,elevacion:.20,distance:19},
        side:{azimut:Math.PI/2,elevacion:.22,distance:19}
      };
      Object.assign(a.controls,views[button.dataset.view]);
      a.controls.updateCamera();
    }));
  }

  renderLampStatus() {
    const env=this.app.environment;
    const on=env.getEnabledPostCount();
    this.node('postLightsCount').textContent=`${on} de 8 encendidos`;
    this.node('lampStatus').textContent=`💡 ${on}/8 postes · Faro ${this.app.train.locomotora.faro.enabled?'ON':'OFF'}`;
    document.querySelectorAll('[data-pole]').forEach(input=>{
      const i=Number(input.dataset.pole);
      input.checked=env.postLightPreferences[i];
      input.disabled=!env.postLightsMaster;
    });
  }

  renderStats() {
    this.renderLampStatus();
    const a=this.app,c=a.cycle;
    const time=c.getTimeLabel(),period=c.getPeriod(), progress=a.train.getProgress();
    this.node('timeDisplay').textContent=time;
    this.node('timeSlider').value=c.hour;
    this.node('periodDisplay').textContent=period;
    this.node('statTime').textContent=time;
    this.node('statPeriod').textContent=period+' · ciclo solar';
    this.node('timeIcon').textContent=period==='Noche'?'☾':period==='Día'?'☀':'◒';
    this.node('statSpeed').innerHTML=`${a.train.velocidadAngular.toFixed(2)} <span>rad/s</span>`;
    this.node('statMotion').textContent=a.paused?'Animación pausada':a.train.velocidadAngular>0?'Tren en marcha':'Sin movimiento';
    this.node('statObjects').textContent=String(a.renderer.renderedMeshes);
    this.node('statLaps').textContent=String(a.train.getLaps());
    this.node('lapPercentage').textContent=`${Math.round(progress*100)}%`;
    this.node('lapProgress').style.width=`${progress*100}%`;
    this.node('fpsDisplay').textContent=`${a.fps?Math.round(a.fps):'—'} FPS`;
    this.node('topPeriod').textContent=period==='Noche'?'☾ Iluminación nocturna':`☀ ${period}`;
    this.node('shadowStatus').textContent=a.renderer.shadowsSupported
      ? a.renderer.shadowsEnabled?'◩ Sombras solares activas':'○ Sombras solares inactivas'
      : '⚠ Sombras no compatibles';
    document.querySelectorAll('[data-hour]').forEach(button=>{
      button.classList.toggle('active',Math.abs(Number(button.dataset.hour)-c.hour)<.1);
    });
  }
}

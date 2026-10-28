/**
 * Reloj del simulador: el Sol sube de 06:00 a 12:00 y se pone a las 18:00.
 * Los tonos y la luz son una simulación artística, no una predicción astronómica.
 */
export class DayNightCycle {
  constructor(renderer) {
    this.renderer = renderer;
    this.hour = 12;
    this.auto = false;
    this.minutesPerSecond = 5;
    this.ambientBase = .42;
    this.sunMultiplier = 1.0;
    this.shadowStrength = .78;
    this.shadowsEnabled = true;
    this.automaticLamps = true;
    this.manualHeadlight = true;
    this.manualPostLight = true;
    this.apply();
  }

  setHour(hour) {
    this.hour = ((Number(hour) % 24) + 24) % 24;
    this.apply();
  }

  getTimeLabel() {
    const m = Math.floor(this.hour * 60 + 0.0001);
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0');
    return `${hh}:${String(m % 60).padStart(2, '0')}`;
  }

  getPeriod() {
    if (this.hour < 5.5 || this.hour >= 19) return 'Noche';
    if (this.hour < 9) return 'Amanecer';
    if (this.hour < 16) return 'Día';
    if (this.hour < 19) return 'Atardecer';
    return 'Noche';
  }

  update(deltaSeconds) {
    if (this.auto) {
      this.hour = (this.hour + deltaSeconds * this.minutesPerSecond / 60) % 24;
      this.apply();
    }
  }

  apply() {
    const r = this.renderer;
    const angle = Math.PI * (this.hour - 6) / 12;
    const altitude = Math.sin(angle);
    const daylight = Math.max(0, altitude);
    // Transición suave en amanecer/anochecer.
    const twilight = Math.max(0, Math.min(1, (altitude + .10) / .35));
    const warmth = Math.pow(1 - daylight, 2.4);
    const azimuth = (this.hour - 12) / 24 * Math.PI * 1.5;
    const h = Math.max(.02, daylight);
    const lateral = Math.sqrt(1 - h * h);
    r.sunDirection = [Math.cos(azimuth) * lateral, h, Math.sin(azimuth) * lateral];
    r.sunIntensity = this.sunMultiplier * Math.pow(daylight, .64) * 1.06;
    r.sunColor = [1.0, 1.0 - .24 * warmth, 1.0 - .50 * warmth];
    r.ambientIntensity = this.ambientBase * (.16 + .84 * twilight);
    r.shadowStrength = this.shadowsEnabled ? this.shadowStrength : 0;
    r.shadowsEnabled = this.shadowsEnabled && daylight > .025;
    const night = 1 - twilight;
    r.headlightStrength = this.manualHeadlight ? (this.automaticLamps ? .16 + night * 2.0 : 1.45) : 0;
    r.lampStrength = this.manualPostLight ? (this.automaticLamps ? .05 + night * 2.2 : 1.15) : 0;
    const midnight = [.027, .052, .12];
    const horizon = [1.0, .53, .32];
    const daytime = [.46, .72, .96];
    const skyMix = (a, b, t) => a.map((c, i) => c + (b[i] - c) * t);
    const twilightSky = skyMix(midnight, horizon, Math.min(1, twilight * 1.6));
    const sky = skyMix(twilightSky, daytime, Math.max(0, Math.min(1, daylight * 2.3)));
    r.setSkyColor(sky);
    this.daylight = daylight;
  }
}

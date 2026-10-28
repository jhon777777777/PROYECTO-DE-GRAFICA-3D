/** Cámara orbital controlada por el mouse o por arrastre táctil. */
export class OrbitControls {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.distance = 18;
    this.azimut = 0;
    this.elevacion = .6;
    this.dragging = false;
    this.prevX = 0;
    this.prevY = 0;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("lostpointercapture", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.updateCamera();
  }

  onPointerDown(evento) {
    this.dragging = true;
    this.prevX = evento.clientX;
    this.prevY = evento.clientY;
    this.canvas.setPointerCapture(evento.pointerId);
    this.canvas.classList.add("arrastrando");
  }

  onPointerMove(evento) {
    if (!this.dragging) return;
    this.azimut -= (evento.clientX - this.prevX) * .01;
    this.elevacion += (evento.clientY - this.prevY) * .01;
    this.elevacion = Math.max(.1, Math.min(Math.PI / 2 - .1, this.elevacion));
    this.prevX = evento.clientX;
    this.prevY = evento.clientY;
    this.updateCamera();
  }

  onPointerUp() {
    this.dragging = false;
    this.canvas.classList.remove("arrastrando");
  }

  onWheel(evento) {
    evento.preventDefault();
    this.distance = Math.max(8, Math.min(40, this.distance + evento.deltaY * .01));
    this.updateCamera();
  }

  updateCamera() {
    const c = this.camera;
    c.position.x = c.target.x + this.distance * Math.cos(this.elevacion) * Math.sin(this.azimut);
    c.position.y = c.target.y + this.distance * Math.sin(this.elevacion);
    c.position.z = c.target.z + this.distance * Math.cos(this.elevacion) * Math.cos(this.azimut);
  }
}

/** Material: textura y propiedad emisiva, independientes de la geometría. */
export class BasicMaterial {
  constructor({ texture = null, emissive = false } = {}) {
    this.texture = texture;
    this.emissive = emissive;
  }
}

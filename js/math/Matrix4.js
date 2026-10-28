/** Operaciones matriciales 4x4, con almacenamiento column-major como WebGL. */
export class Matrix4 {
  static identidad() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  static multiplicar(a, b) {
    const resultado = new Float32Array(16);
    for (let columna = 0; columna < 4; columna++) {
      for (let fila = 0; fila < 4; fila++) {
        for (let k = 0; k < 4; k++) {
          resultado[columna * 4 + fila] += a[k * 4 + fila] * b[columna * 4 + k];
        }
      }
    }
    return resultado;
  }

  static traslacion(x, y, z) {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  }

  static escala(x, y, z) {
    return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
  }

  static rotacionX(angulo) {
    const c = Math.cos(angulo), s = Math.sin(angulo);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  static rotacionY(angulo) {
    const c = Math.cos(angulo), s = Math.sin(angulo);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  static rotacionZ(angulo) {
    const c = Math.cos(angulo), s = Math.sin(angulo);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  static perspectiva(fovRadianes, aspect, near, far) {
    const f = 1 / Math.tan(fovRadianes / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }

  static lookAt(eye, target, up) {
    const z = [eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]];
    let longitud = Math.hypot(...z) || 1;
    z[0] /= longitud; z[1] /= longitud; z[2] /= longitud;
    const x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]];
    longitud = Math.hypot(...x) || 1;
    x[0] /= longitud; x[1] /= longitud; x[2] /= longitud;
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([
      x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1
    ]);
  }

  /** Proyección ortográfica para la cámara del Sol y su mapa de sombras. */
  static ortografica(left, right, bottom, top, near, far) {
    const w = right - left, h = top - bottom, d = far - near;
    return new Float32Array([
      2 / w, 0, 0, 0,
      0, 2 / h, 0, 0,
      0, 0, -2 / d, 0,
      -(right + left) / w, -(top + bottom) / h, -(far + near) / d, 1
    ]);
  }

  /** M = T * Rz * Ry * Rx * S, el orden del Paso 16 de la guía. */
  static compose(position, rotation, scale) {
    const rotacion = Matrix4.multiplicar(
      Matrix4.rotacionZ(rotation.z),
      Matrix4.multiplicar(Matrix4.rotacionY(rotation.y), Matrix4.rotacionX(rotation.x))
    );
    return Matrix4.multiplicar(
      Matrix4.traslacion(position.x, position.y, position.z),
      Matrix4.multiplicar(rotacion, Matrix4.escala(scale.x, scale.y, scale.z))
    );
  }
}

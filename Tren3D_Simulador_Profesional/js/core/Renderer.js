import { Mesh } from '../objects/Mesh.js';
import { Matrix4 } from '../math/Matrix4.js';

/** WebGL2 queda encapsulado aquí. Dos pasadas: profundidad solar y color. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias:true, alpha:false, powerPreference:'high-performance' });
    if (!this.gl) throw new Error('WebGL2 no está disponible en este navegador.');
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    this.skyColor = [.46,.72,.96];
    this.setSkyColor(this.skyColor);
    this.ambientIntensity = .42;
    this.sunIntensity = 1;
    this.sunDirection = [.2,1,.4];
    this.sunColor = [1,1,.94];
    this.shadowStrength = .78;
    this.shadowsEnabled = true;
    this.headlightStrength = .2;
    this.lampStrength = .05;
    this.light1 = null;
    this.streetlights = []; // 8 luces, una por poste, cada una con enabled/intensity
    this.width = 0;
    this.height = 0;
    this.shadowSize = 2048;
    this.program = this.createProgram();
    this.depthProgram = this.createDepthProgram();
    this.locations = this.getLocations();
    this.depthLocations = {
      lightVP:gl.getUniformLocation(this.depthProgram,'uLightVP'),
      model:gl.getUniformLocation(this.depthProgram,'uModelMatrix')
    };
    this.prepareShadowMap();
    this.renderedMeshes = 0;
  }

  setSkyColor(color) {
    this.skyColor = [...color];
    this.gl.clearColor(color[0], color[1], color[2], 1);
  }

  createShader(type, source) {
    const gl=this.gl, shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      const error=gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Error del shader: ${error}`);
    }
    return shader;
  }

  linkProgram(vertex,fragment) {
    const gl=this.gl, program=gl.createProgram();
    const vs=this.createShader(gl.VERTEX_SHADER,vertex);
    const fs=this.createShader(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs); gl.attachShader(program,fs);
    gl.bindAttribLocation(program,0,'aPosition');
    gl.bindAttribLocation(program,1,'aNormal');
    gl.bindAttribLocation(program,2,'aTexCoord');
    gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  createProgram() {
    const vs=`#version 300 es
      in vec3 aPosition;
      in vec3 aNormal;
      in vec2 aTexCoord;
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uLightVP;
      out vec3 vNormal;
      out vec3 vWorldPosition;
      out vec2 vTexCoord;
      out vec4 vShadowCoord;
      void main(){
        vec4 worldPos=uModelMatrix*vec4(aPosition,1.0);
        gl_Position=uProjectionMatrix*uViewMatrix*worldPos;
        vWorldPosition=worldPos.xyz;
        vNormal=normalize(transpose(inverse(mat3(uModelMatrix)))*aNormal);
        vTexCoord=aTexCoord;
        vShadowCoord=uLightVP*worldPos;
      }
    `;
    const fs=`#version 300 es
      precision highp float;
      in vec3 vNormal;
      in vec3 vWorldPosition;
      in vec2 vTexCoord;
      in vec4 vShadowCoord;
      uniform sampler2D uTexture;
      uniform sampler2D uShadowMap;
      uniform vec3 uLight1Position;
      const int MAX_POST_LIGHTS=8;
      uniform vec3 uPostLightPositions[MAX_POST_LIGHTS];
      uniform float uPostLightIntensities[MAX_POST_LIGHTS];
      uniform bool uEmissive;
      uniform float uAmbientIntensity;
      uniform float uSunIntensity;
      uniform vec3 uSunDirection;
      uniform vec3 uSunColor;
      uniform float uHeadlightStrength;
      uniform float uLampStrength;
      uniform float uShadowStrength;
      uniform bool uShadowsEnabled;
      out vec4 outColor;

      float shadowVisibility(vec3 normal,vec3 lightDir){
        if(!uShadowsEnabled) return 1.0;
        vec3 p=vShadowCoord.xyz / max(vShadowCoord.w,0.00001);
        p=p*.5+.5;
        if(p.x<=0.0 || p.x>=1.0 || p.y<=0.0 || p.y>=1.0 || p.z<=0.0 || p.z>=1.0) return 1.0;
        float bias=max(.002*(1.0-max(dot(normal,lightDir),0.0)),.0007);
        vec2 pixel=1.0/vec2(textureSize(uShadowMap,0));
        float lit=0.0;
        for(int x=-1;x<=1;x++) {
          for(int y=-1;y<=1;y++) {
            float stored=texture(uShadowMap,p.xy+vec2(float(x),float(y))*pixel).r;
            lit+=(p.z-bias<=stored)?1.0:0.0;
          }
        }
        return mix(1.0,lit/9.0,uShadowStrength);
      }

      void main(){
        vec3 tex=texture(uTexture,vTexCoord).rgb;
        if(uEmissive){outColor=vec4(tex*.95+vec3(.045),1.0);return;}
        vec3 N=normalize(vNormal);
        vec3 sunDir=normalize(uSunDirection);
        float lambert=max(dot(N,sunDir),0.0);
        float solar=lambert*uSunIntensity*shadowVisibility(N,sunDir);
        vec3 d1=uLight1Position-vWorldPosition;
        float l1=length(d1);
        float p1=max(dot(N,normalize(d1)),0.0)/(1.0+.12*l1+.09*l1*l1);
        vec3 lighting=vec3(uAmbientIntensity)+solar*uSunColor+
          p1*uHeadlightStrength*vec3(1.0,.92,.72);
        // Cada uno de los ocho postes afecta los objetos próximos.
        for(int i=0;i<MAX_POST_LIGHTS;i++) {
          vec3 delta=uPostLightPositions[i]-vWorldPosition;
          float distanceToPost=length(delta);
          float diffuse=max(dot(N,normalize(delta)),0.0);
          float attenuation=1.0/(1.0+.09*distanceToPost+.060*distanceToPost*distanceToPost);
          lighting+=diffuse*attenuation*uPostLightIntensities[i]*uLampStrength*vec3(1.0,.85,.58);
        }
        vec3 result=tex*lighting;
        result=result/(result+vec3(.21)); // compresión tonal suave para luces fuertes
        outColor=vec4(pow(result,vec3(.92)),1.0);
      }
    `;
    return this.linkProgram(vs,fs);
  }

  createDepthProgram() {
    return this.linkProgram(`#version 300 es
      in vec3 aPosition;
      uniform mat4 uModelMatrix;
      uniform mat4 uLightVP;
      void main(){ gl_Position=uLightVP*uModelMatrix*vec4(aPosition,1.0); }
    `, `#version 300 es
      precision highp float;
      void main(){}
    `);
  }

  getLocations() {
    const gl=this.gl,p=this.program;
    const a=name=>gl.getAttribLocation(p,name),u=name=>gl.getUniformLocation(p,name);
    return {
      position:a('aPosition'),normal:a('aNormal'),uv:a('aTexCoord'),
      model:u('uModelMatrix'),view:u('uViewMatrix'),projection:u('uProjectionMatrix'),
      lightVP:u('uLightVP'),texture:u('uTexture'),shadowMap:u('uShadowMap'),
      light1:u('uLight1Position'),postPositions:u('uPostLightPositions[0]'),
      postIntensities:u('uPostLightIntensities[0]'),emissive:u('uEmissive'),
      ambient:u('uAmbientIntensity'),sun:u('uSunIntensity'),sunDirection:u('uSunDirection'),
      sunColor:u('uSunColor'),headlight:u('uHeadlightStrength'),lamp:u('uLampStrength'),
      shadowStrength:u('uShadowStrength'),shadowsEnabled:u('uShadowsEnabled')
    };
  }

  initGeometry(geometry) {
    if(geometry.initialized)return;
    const gl=this.gl;
    geometry.vao=gl.createVertexArray();
    gl.bindVertexArray(geometry.vao);
    geometry.vbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,geometry.vbo);
    gl.bufferData(gl.ARRAY_BUFFER,geometry.vertices,gl.STATIC_DRAW);
    geometry.ebo=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,geometry.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometry.indices,gl.STATIC_DRAW);
    const stride=32;
    // Ubicaciones explícitas para ambos programas (fijadas antes de link).
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,3,gl.FLOAT,false,stride,0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1,3,gl.FLOAT,false,stride,12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2,2,gl.FLOAT,false,stride,24);
    gl.bindVertexArray(null);
    geometry.initialized=true;
  }

  prepareShadowMap() {
    const gl=this.gl, n=this.shadowSize;
    this.shadowTexture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,n,n,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.shadowFbo=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadowTexture,0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status!==gl.FRAMEBUFFER_COMPLETE) {
      console.warn('Sombras no disponibles (FBO):',status);
      this.shadowsSupported=false;
    } else this.shadowsSupported=true;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }

  resizeToDisplaySize(camera) {
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const width=Math.max(1,Math.round(this.canvas.clientWidth*dpr));
    const height=Math.max(1,Math.round(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==width || this.canvas.height!==height){
      this.canvas.width=width;this.canvas.height=height;
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    }
    this.width=width;this.height=height;
  }

  makeLightMatrix() {
    const d=this.sunDirection;
    const sun=[d[0]*50,d[1]*50,d[2]*50];
    // En el mediodía el Sol queda casi vertical: evitar un up paralelo.
    const up=Math.abs(d[1])>.95?[0,0,1]:[0,1,0];
    const view=Matrix4.lookAt(sun,[0,0,0],up);
    const projection=Matrix4.ortografica(-31,31,-31,31,1,115);
    return Matrix4.multiplicar(projection,view);
  }

  render(scene,camera) {
    const gl=this.gl;
    this.resizeToDisplaySize(camera);
    scene.updateMatrixWorld();camera.updateViewMatrix();
    const lightVP=this.makeLightMatrix();
    this.renderedMeshes=0;
    const useShadow=this.shadowsSupported && this.shadowsEnabled && this.sunIntensity>.02;
    if(useShadow){
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);
      gl.viewport(0,0,this.shadowSize,this.shadowSize);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.depthProgram);
      gl.uniformMatrix4fv(this.depthLocations.lightVP,false,lightVP);
      this.drawShadowObjects(scene);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,this.width,this.height);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    const l=this.locations;
    gl.uniformMatrix4fv(l.view,false,camera.viewMatrix);
    gl.uniformMatrix4fv(l.projection,false,camera.projectionMatrix);
    gl.uniformMatrix4fv(l.lightVP,false,lightVP);
    const headlight=this.light1?this.light1.getWorldPosition():[0,10,0];
    gl.uniform3fv(l.light1,headlight);
    // Un array compacto de 8 posiciones e intensidades para GLSL.
    const postPositions=new Float32Array(8*3);
    const postIntensities=new Float32Array(8);
    for(let i=0;i<Math.min(8,this.streetlights.length);i++) {
      const post=this.streetlights[i];
      postPositions.set(post.getWorldPosition(),i*3);
      postIntensities[i]=post.enabled?post.intensity:0;
    }
    gl.uniform3fv(l.postPositions,postPositions);
    gl.uniform1fv(l.postIntensities,postIntensities);
    gl.uniform1f(l.ambient,this.ambientIntensity);
    gl.uniform1f(l.sun,this.sunIntensity);
    gl.uniform3fv(l.sunDirection,this.sunDirection);
    gl.uniform3fv(l.sunColor,this.sunColor);
    gl.uniform1f(l.headlight,this.light1 && this.light1.enabled ? this.headlightStrength*this.light1.intensity : 0);
    gl.uniform1f(l.lamp,this.lampStrength);
    gl.uniform1f(l.shadowStrength,this.shadowStrength);
    gl.uniform1i(l.shadowsEnabled,useShadow?1:0);
    gl.uniform1i(l.texture,0);
    gl.uniform1i(l.shadowMap,1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
    this.drawColorObjects(scene);
  }

  drawShadowObjects(object) {
    if(!object.visible)return;
    if(object instanceof Mesh && object.castShadow) {
      this.initGeometry(object.geometry);
      const gl=this.gl;
      gl.bindVertexArray(object.geometry.vao);
      gl.uniformMatrix4fv(this.depthLocations.model,false,object.matrixWorld);
      gl.drawElements(gl.TRIANGLES,object.geometry.indexCount,gl.UNSIGNED_SHORT,0);
    }
    for(const child of object.children)this.drawShadowObjects(child);
  }

  drawColorObjects(object) {
    if(!object.visible)return;
    if(object instanceof Mesh) {
      this.initGeometry(object.geometry);
      const gl=this.gl,l=this.locations;
      gl.bindVertexArray(object.geometry.vao);
      gl.uniformMatrix4fv(l.model,false,object.matrixWorld);
      gl.uniform1i(l.emissive,object.material.emissive?1:0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,object.material.texture);
      gl.drawElements(gl.TRIANGLES,object.geometry.indexCount,gl.UNSIGNED_SHORT,0);
      this.renderedMeshes++;
    }
    for(const child of object.children)this.drawColorObjects(child);
  }
}

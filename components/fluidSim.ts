"use client";

/**
 * WebGL sıvı simülasyonu (stable-fluids / Navier-Stokes): splat → divergence
 * → basınç (Jacobi) → gradyan çıkarma → advection. Mürekkep yoğunluğu video
 * dokusunu açığa çıkaran bir maske/alpha olarak kullanılır; hız alanı da
 * videoyu hafifçe kaydırıp gerçek bir "akışkan" hissi verir.
 *
 * Zehra'nın verdiği referans motorun birebir portu — aynı uniform isimleri,
 * aynı geçiş sırası, aynı varsayılan parametreler.
 */

export interface FluidSimOptions {
  simResolution: number;
  dyeResolution: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressureIterations: number;
  splatRadius: number;
  distortion: number; // videoyu hız alanına göre ne kadar kaydırsın
}

export const FLUID_DEFAULTS: FluidSimOptions = {
  simResolution: 128,
  dyeResolution: 1024,
  densityDissipation: 0.995,
  velocityDissipation: 0.9,
  pressureIterations: 5,
  splatRadius: 1 / (typeof window !== "undefined" ? window.innerHeight : 900),
  distortion: 6,
};

const VERT_SRC = `
precision highp float;
attribute vec2 a_position;
varying vec2 v_uv;
void main () {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const SPLAT_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_input_txr;
uniform float u_ratio;
uniform vec2 u_point;
uniform vec3 u_point_value;
uniform float u_point_size;
void main () {
  vec2 p = v_uv - u_point;
  p.x *= u_ratio;
  vec3 splat = exp(-dot(p, p) / u_point_size) * u_point_value;
  vec3 base = texture2D(u_input_txr, v_uv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const DIVERGENCE_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_velocity_txr;
uniform vec2 u_vertex_texel;
void main () {
  float L = texture2D(u_velocity_txr, v_uv - vec2(u_vertex_texel.x, 0.0)).x;
  float R = texture2D(u_velocity_txr, v_uv + vec2(u_vertex_texel.x, 0.0)).x;
  float T = texture2D(u_velocity_txr, v_uv + vec2(0.0, u_vertex_texel.y)).y;
  float B = texture2D(u_velocity_txr, v_uv - vec2(0.0, u_vertex_texel.y)).y;
  vec2 C = texture2D(u_velocity_txr, v_uv).xy;
  if (v_uv.x - u_vertex_texel.x < 0.0) L = -C.x;
  if (v_uv.x + u_vertex_texel.x > 1.0) R = -C.x;
  if (v_uv.y + u_vertex_texel.y > 1.0) T = -C.y;
  if (v_uv.y - u_vertex_texel.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const PRESSURE_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_pressure_txr;
uniform sampler2D u_divergence_txr;
uniform vec2 u_vertex_texel;
void main () {
  float L = texture2D(u_pressure_txr, v_uv - vec2(u_vertex_texel.x, 0.0)).x;
  float R = texture2D(u_pressure_txr, v_uv + vec2(u_vertex_texel.x, 0.0)).x;
  float T = texture2D(u_pressure_txr, v_uv + vec2(0.0, u_vertex_texel.y)).x;
  float B = texture2D(u_pressure_txr, v_uv - vec2(0.0, u_vertex_texel.y)).x;
  float divergence = texture2D(u_divergence_txr, v_uv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_pressure_txr;
uniform sampler2D u_velocity_txr;
uniform vec2 u_vertex_texel;
void main () {
  float L = texture2D(u_pressure_txr, v_uv - vec2(u_vertex_texel.x, 0.0)).x;
  float R = texture2D(u_pressure_txr, v_uv + vec2(u_vertex_texel.x, 0.0)).x;
  float T = texture2D(u_pressure_txr, v_uv + vec2(0.0, u_vertex_texel.y)).x;
  float B = texture2D(u_pressure_txr, v_uv - vec2(0.0, u_vertex_texel.y)).x;
  vec2 velocity = texture2D(u_velocity_txr, v_uv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const ADVECTION_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_velocity_txr;
uniform sampler2D u_input_txr;
uniform vec2 u_vertex_texel;
uniform vec2 u_output_textel;
uniform float u_dt;
uniform float u_dissipation;
vec4 bilerp (sampler2D tex, vec2 uv, vec2 texel) {
  vec2 st = uv / texel - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(tex, (iuv + vec2(0.5, 0.5)) * texel);
  vec4 b = texture2D(tex, (iuv + vec2(1.5, 0.5)) * texel);
  vec4 c = texture2D(tex, (iuv + vec2(0.5, 1.5)) * texel);
  vec4 d = texture2D(tex, (iuv + vec2(1.5, 1.5)) * texel);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}
void main () {
  vec2 coord = v_uv - u_dt * texture2D(u_velocity_txr, v_uv).xy * u_vertex_texel;
  vec4 result = bilerp(u_input_txr, coord, u_output_textel);
  gl_FragColor = u_dissipation * result;
}`;

const DISPLAY_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 v_uv;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_txr;
uniform sampler2D u_video_texture;
uniform vec2 u_vertex_texel;
uniform float u_distortion;
void main () {
  vec3 dye = texture2D(u_output_texture, v_uv).rgb;
  float alpha = clamp(max(max(dye.r, dye.g), dye.b), 0.0, 1.0);
  vec2 vel = texture2D(u_velocity_txr, v_uv).xy;
  vec2 uv = v_uv + vel * u_vertex_texel * u_distortion;
  vec3 videoColor = texture2D(u_video_texture, uv).rgb;
  gl_FragColor = vec4(videoColor, alpha);
}`;

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
}

interface FBO {
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach(id: number): number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read(): FBO;
  write(): FBO;
  swap(): void;
}

export function createFluidReveal(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  opts: Partial<FluidSimOptions> = {}
): { destroy: () => void } | null {
  const params: FluidSimOptions = { ...FLUID_DEFAULTS, ...opts };

  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  }) as WebGLRenderingContext | null;
  if (!gl) return null;
  if (!gl.getExtension("OES_texture_float")) return null;

  function createShader(source: string, type: number): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.error(gl!.getShaderInfoLog(shader));
      gl!.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createShaderProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
    const program = gl!.createProgram();
    if (!program) return null;
    gl!.attachShader(program, vs);
    gl!.attachShader(program, fs);
    gl!.bindAttribLocation(program, 0, "a_position");
    gl!.linkProgram(program);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
      console.error(gl!.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation> {
    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl!.getActiveUniform(program, i);
      if (!info) continue;
      const loc = gl!.getUniformLocation(program, info.name);
      if (loc) uniforms[info.name] = loc;
    }
    return uniforms;
  }

  function createProgram(fragSrc: string): Program | null {
    const fs = createShader(fragSrc, gl!.FRAGMENT_SHADER);
    if (!fs) return null;
    const program = createShaderProgram(vertexShader!, fs);
    if (!program) return null;
    return { program, uniforms: getUniforms(program) };
  }

  const vertexShader = createShader(VERT_SRC, gl.VERTEX_SHADER);
  if (!vertexShader) return null;

  const splatProgram = createProgram(SPLAT_SRC);
  const divergenceProgram = createProgram(DIVERGENCE_SRC);
  const pressureProgram = createProgram(PRESSURE_SRC);
  const gradientSubtractProgram = createProgram(GRADIENT_SUBTRACT_SRC);
  const advectionProgram = createProgram(ADVECTION_SRC);
  const displayProgram = createProgram(DISPLAY_SRC);
  if (
    !splatProgram || !divergenceProgram || !pressureProgram ||
    !gradientSubtractProgram || !advectionProgram || !displayProgram
  ) {
    return null;
  }

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW
  );
  const quadIndex = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndex);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 0, 2, 3]),
    gl.STATIC_DRAW
  );

  function blit(target: FBO | null) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, quadIndex);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
    gl!.enableVertexAttribArray(0);
    if (target == null) {
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    } else {
      gl!.viewport(0, 0, target.width, target.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
    }
    gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
  }

  function createFBO(w: number, h: number, type: number = gl!.RGBA): FBO {
    gl!.activeTexture(gl!.TEXTURE0);
    const texture = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, type, w, h, 0, type, gl!.FLOAT, null);

    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
    gl!.viewport(0, 0, w, h);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    return {
      fbo,
      width: w,
      height: h,
      attach(id: number) {
        gl!.activeTexture(gl!.TEXTURE0 + id);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w: number, h: number, type?: number): DoubleFBO {
    let fbo1 = createFBO(w, h, type);
    let fbo2 = createFBO(w, h, type);
    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      read: () => fbo1,
      write: () => fbo2,
      swap() {
        const t = fbo1;
        fbo1 = fbo2;
        fbo2 = t;
      },
    };
  }

  function getResolution(resolution: number) {
    let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspectRatio);
    return gl!.drawingBufferWidth > gl!.drawingBufferHeight
      ? { width: max, height: min }
      : { width: min, height: max };
  }

  let outputColor: DoubleFBO, velocity: DoubleFBO, divergence: FBO, pressure: DoubleFBO;

  function initFBOs() {
    const simRes = getResolution(params.simResolution);
    const dyeRes = getResolution(params.dyeResolution);
    outputColor = createDoubleFBO(dyeRes.width, dyeRes.height);
    velocity = createDoubleFBO(simRes.width, simRes.height);
    divergence = createFBO(simRes.width, simRes.height, gl!.RGB);
    pressure = createDoubleFBO(simRes.width, simRes.height, gl!.RGB);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  resizeCanvas();
  initFBOs();

  // Video dokusu
  const videoTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, firstMove: false };
  const firstMoveTimer = window.setTimeout(() => {
    pointer.firstMove = true;
  }, 3000);

  function splatAt(x: number, y: number, dx: number, dy: number) {
    gl!.disable(gl!.BLEND);
    gl!.useProgram(splatProgram!.program);
    gl!.uniform1i(splatProgram!.uniforms.u_input_txr, velocity.read().attach(0));
    gl!.uniform1f(splatProgram!.uniforms.u_ratio, canvas.width / canvas.height);
    gl!.uniform2f(splatProgram!.uniforms.u_point, x / canvas.width, 1 - y / canvas.height);
    gl!.uniform3f(splatProgram!.uniforms.u_point_value, dx, -dy, 1);
    gl!.uniform1f(splatProgram!.uniforms.u_point_size, params.splatRadius);
    blit(velocity.write());
    velocity.swap();

    gl!.uniform1i(splatProgram!.uniforms.u_input_txr, outputColor.read().attach(0));
    gl!.uniform3f(splatProgram!.uniforms.u_point_value, 0.9, 0.9, 0.9);
    blit(outputColor.write());
    outputColor.swap();
  }

  const onMouseMove = (e: MouseEvent) => {
    pointer.moved = true;
    pointer.dx = 5 * (e.clientX - pointer.x);
    pointer.dy = 5 * (e.clientY - pointer.y);
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.firstMove = true;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    pointer.moved = true;
    pointer.dx = 5 * (e.touches[0].clientX - pointer.x);
    pointer.dy = 8 * (e.touches[0].clientY - pointer.y);
    pointer.x = e.touches[0].clientX;
    pointer.y = e.touches[0].clientY;
    pointer.firstMove = true;
  };
  const onResize = () => {
    resizeCanvas();
  };

  addEventListener("mousemove", onMouseMove);
  addEventListener("touchmove", onTouchMove, { passive: true });
  addEventListener("resize", onResize);

  pointer.x = innerWidth * 0.5;
  pointer.y = innerHeight * 0.45;

  let prevTimestamp = performance.now();
  let raf = 0;
  let destroyed = false;

  function step() {
    if (destroyed) return;
    const now = performance.now();
    const dt = Math.min(0.033, (now - prevTimestamp) / 1000);
    prevTimestamp = now;

    if (!pointer.firstMove) {
      pointer.moved = true;
      const newX = (0.5 + 0.16 * Math.cos(0.0006 * now) * Math.sin(0.0008 * now)) * canvas.clientWidth;
      const newY = (0.45 + 0.1 * Math.sin(0.001 * now)) * canvas.clientHeight;
      pointer.dx = 10 * (newX - pointer.x);
      pointer.dy = 10 * (newY - pointer.y);
      pointer.x = newX;
      pointer.y = newY;
    }

    if (pointer.moved) {
      pointer.moved = false;
      splatAt(pointer.x, pointer.y, pointer.dx, pointer.dy);
    }

    gl!.disable(gl!.BLEND);

    gl!.useProgram(divergenceProgram!.program);
    gl!.uniform2f(divergenceProgram!.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(divergenceProgram!.uniforms.u_velocity_txr, velocity.read().attach(0));
    blit(divergence);

    gl!.useProgram(pressureProgram!.program);
    gl!.uniform2f(pressureProgram!.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(pressureProgram!.uniforms.u_divergence_txr, divergence.attach(0));
    for (let i = 0; i < params.pressureIterations; i++) {
      gl!.uniform1i(pressureProgram!.uniforms.u_pressure_txr, pressure.read().attach(1));
      blit(pressure.write());
      pressure.swap();
    }

    gl!.useProgram(gradientSubtractProgram!.program);
    gl!.uniform2f(gradientSubtractProgram!.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(gradientSubtractProgram!.uniforms.u_pressure_txr, pressure.read().attach(0));
    gl!.uniform1i(gradientSubtractProgram!.uniforms.u_velocity_txr, velocity.read().attach(1));
    blit(velocity.write());
    velocity.swap();

    gl!.useProgram(advectionProgram!.program);
    gl!.uniform2f(advectionProgram!.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform2f(advectionProgram!.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(advectionProgram!.uniforms.u_velocity_txr, velocity.read().attach(0));
    gl!.uniform1i(advectionProgram!.uniforms.u_input_txr, velocity.read().attach(0));
    gl!.uniform1f(advectionProgram!.uniforms.u_dt, dt);
    gl!.uniform1f(advectionProgram!.uniforms.u_dissipation, params.velocityDissipation);
    blit(velocity.write());
    velocity.swap();

    gl!.uniform2f(advectionProgram!.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
    gl!.uniform1i(advectionProgram!.uniforms.u_velocity_txr, velocity.read().attach(0));
    gl!.uniform1i(advectionProgram!.uniforms.u_input_txr, outputColor.read().attach(1));
    gl!.uniform1f(advectionProgram!.uniforms.u_dissipation, params.densityDissipation);
    blit(outputColor.write());
    outputColor.swap();

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, videoTexture);
      try {
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, video);
      } catch {
        // video henüz hazır değilse sessizce atla
      }
    }

    gl!.useProgram(displayProgram!.program);
    gl!.uniform1i(displayProgram!.uniforms.u_output_texture, outputColor.read().attach(0));
    gl!.uniform1i(displayProgram!.uniforms.u_velocity_txr, velocity.read().attach(1));
    gl!.uniform1i(displayProgram!.uniforms.u_video_texture, 2);
    gl!.uniform2f(displayProgram!.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1f(displayProgram!.uniforms.u_distortion, params.distortion);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
    blit(null);

    raf = requestAnimationFrame(step);
  }

  raf = requestAnimationFrame(step);

  return {
    destroy() {
      destroyed = true;
      clearTimeout(firstMoveTimer);
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMouseMove);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("resize", onResize);
    },
  };
}

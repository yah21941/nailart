'use client';

import { useEffect, useRef } from 'react';

export type AetherHeroProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  overlayGradient?: string;
  textColor?: string;
  fragmentSource?: string;
  dprMax?: number;
  clearColor?: [number, number, number, number];
  height?: string | number;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

export default function AetherHero({
  title = 'AI가 만드는\n완벽한 유튜브 썸네일',
  subtitle = '제목만 입력하면 클릭을 부르는 썸네일을 자동으로 생성합니다.',
  ctaLabel = '무료로 시작하기',
  ctaHref = '#start',
  secondaryCtaLabel = '데모 보기',
  secondaryCtaHref = '#demo',
  align = 'center',
  maxWidth = 900,
  overlayGradient = 'linear-gradient(180deg, rgba(10,10,15,0.6) 0%, rgba(10,10,15,0.2) 40%, rgba(10,10,15,0.7) 100%)',
  textColor = '#ffffff',
  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor = [0.04, 0.04, 0.06, 1],
  height = '100vh',
  className = '',
  ariaLabel = 'Naliart AI hero background',
}: AetherHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufRef = useRef<WebGLBuffer | null>(null);
  const uniTimeRef = useRef<WebGLUniformLocation | null>(null);
  const uniResRef = useRef<WebGLUniformLocation | null>(null);
  const rafRef = useRef<number | null>(null);

  const compileShader = (gl: WebGL2RenderingContext, src: string, type: number) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) || 'Unknown shader error';
      gl.deleteShader(sh);
      throw new Error(info);
    }
    return sh;
  };

  const createProgram = (gl: WebGL2RenderingContext, vs: string, fs: string) => {
    const v = compileShader(gl, vs, gl.VERTEX_SHADER);
    const f = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog) || 'Program link error';
      gl.deleteProgram(prog);
      throw new Error(info);
    }
    return prog;
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;

    let prog: WebGLProgram;
    try {
      prog = createProgram(gl, VERT_SRC, fragmentSource);
    } catch (e) {
      console.error(e);
      return;
    }
    programRef.current = prog;

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    const buf = gl.createBuffer()!;
    bufRef.current = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    uniTimeRef.current = gl.getUniformLocation(prog, 'time');
    uniResRef.current = gl.getUniformLocation(prog, 'resolution');
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax));
      const rect = canvas.getBoundingClientRect();
      const W = Math.floor(Math.max(1, rect.width) * dpr);
      const H = Math.floor(Math.max(1, rect.height) * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    window.addEventListener('resize', fit);

    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (uniResRef.current) gl.uniform2f(uniResRef.current, canvas.width, canvas.height);
      if (uniTimeRef.current) gl.uniform1f(uniTimeRef.current, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (bufRef.current) gl.deleteBuffer(bufRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
  }, [fragmentSource, dprMax, clearColor]);

  const justify =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign =
    align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full block select-none touch-none"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: overlayGradient }}
      />

      <div
        className="relative z-10 h-full flex flex-col px-[min(6vw,80px)]"
        style={{
          alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
          justifyContent: 'center',
          color: textColor,
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-md text-xs font-semibold tracking-widest">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
            <path d="M5 0L6.12 3.38L9.76 3.45L6.94 5.57L7.94 9.04L5 7L2.06 9.04L3.06 5.57L0.24 3.45L3.88 3.38L5 0Z" />
          </svg>
          <span>AI-Powered Thumbnail Generator</span>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth,
            marginInline: align === 'center' ? 'auto' : undefined,
            textAlign,
          }}
        >
          <h1 className="m-0 font-bold tracking-tight" style={{
            fontSize: 'clamp(2.4rem, 6.5vw, 5rem)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            textShadow: '0 6px 40px rgba(0,0,0,0.5)',
            whiteSpace: 'pre-line',
          }}>
            {title}
          </h1>

          {subtitle && (
            <p className="mt-5 opacity-80" style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.7,
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              maxWidth: 620,
              marginInline: align === 'center' ? 'auto' : undefined,
            }}>
              {subtitle}
            </p>
          )}

          <div
            className="flex flex-wrap gap-3 mt-10"
            style={{ justifyContent: justify }}
          >
            {ctaLabel && (
              <a
                href={ctaHref}
                className="px-7 py-3.5 rounded-xl font-bold text-white no-underline text-base transition-colors hover:bg-white/20 border border-white/30 bg-white/[0.12] backdrop-blur-md"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
              >
                {ctaLabel}
              </a>
            )}
            {secondaryCtaLabel && (
              <a
                href={secondaryCtaHref}
                className="px-7 py-3.5 rounded-xl font-semibold no-underline text-base border border-white/15 bg-white/[0.04] backdrop-blur-md hover:bg-white/10 transition-colors"
                style={{ color: textColor }}
              >
                {secondaryCtaLabel}
              </a>
            )}
          </div>

          <p className="mt-8 text-sm opacity-50 tracking-wide">
            신용카드 불필요 · 무료 10회 제공
          </p>
        </div>
      </div>
    </section>
  );
}

export { AetherHero };

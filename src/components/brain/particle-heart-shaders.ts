export const particleHeartVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uBeatScale;
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform vec3 uRippleOrigins[3];
  uniform float uRippleStartTimes[3];

  attribute float aSeed;
  attribute float aSize;
  attribute float aColorMix;
  attribute float aEdge;

  varying float vSeed;
  varying float vColorMix;
  varying float vDepth;
  varying float vGlow;
  varying float vEdge;
  varying float vSide;
  varying float vPulse;

  vec3 safeDirection(vec3 vector, float seed) {
    float vectorLength = length(vector);
    if (vectorLength > 0.0001) return vector / vectorLength;
    return normalize(vec3(seed - 0.5, 0.35, 0.65 - seed));
  }

  void main() {
    vec3 displaced = position;
    float glow = 0.0;

    float organicMotion = sin(
      uTime * (0.85 + aSeed * 1.7) + aSeed * 47.0 + position.y * 5.0
    );
    vec3 livingDirection = safeDirection(position, aSeed);
    displaced += livingDirection * organicMotion * (0.004 + aEdge * 0.006);

    float mouseDistance = distance(displaced, uMouse);
    float mouseField =
      (1.0 - smoothstep(0.0, 0.78, mouseDistance)) * uMouseStrength;
    vec3 mouseDirection = safeDirection(uMouse - displaced, aSeed);
    displaced += mouseDirection * mouseField * (0.1 + 0.035 * aSeed);
    glow += mouseField * 0.22;

    for (int index = 0; index < 3; index++) {
      float age = uTime - uRippleStartTimes[index];
      float active = step(0.0, age) * step(age, 1.35);
      float radius = age * 2.2;
      float distanceFromOrigin = distance(position, uRippleOrigins[index]);
      float band =
        1.0 - smoothstep(0.0, 0.14, abs(distanceFromOrigin - radius));
      band *= exp(-age * 1.15) * active;
      vec3 rippleDirection = safeDirection(position - uRippleOrigins[index], aSeed);
      displaced += rippleDirection * band * (0.15 + 0.04 * aSeed);
      glow += band * 0.7;
    }

    displaced *= uBeatScale;

    vec4 modelPosition = modelMatrix * vec4(displaced, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    float perspective = 4.2 / max(1.0, -viewPosition.z);
    gl_PointSize = min(
      10.0,
      (2.1 + aSeed * 1.35 + smoothstep(0.72, 1.0, aEdge) * 1.55) *
        aSize * uPixelRatio * perspective
    );

    vSeed = aSeed;
    vColorMix = aColorMix;
    vDepth = smoothstep(-0.58, 0.58, position.z);
    vGlow = glow;
    vEdge = smoothstep(0.68, 1.0, aEdge);
    vSide = smoothstep(-1.15, 1.15, position.x);
    vPulse = max(0.0, (uBeatScale - 1.0) * 15.0);
  }
`;

export const particleHeartFragmentShader = /* glsl */ `
  uniform float uTime;

  varying float vSeed;
  varying float vColorMix;
  varying float vDepth;
  varying float vGlow;
  varying float vEdge;
  varying float vSide;
  varying float vPulse;

  void main() {
    float pointDistance = length(gl_PointCoord - vec2(0.5));
    float spriteAlpha = 1.0 - smoothstep(0.32, 0.5, pointDistance);
    if (spriteAlpha < 0.04) discard;

    vec3 electricBlue = vec3(0.02, 0.2, 1.0);
    vec3 cyan = vec3(0.0, 0.78, 1.0);
    vec3 violet = vec3(0.46, 0.12, 1.0);
    vec3 magenta = vec3(0.96, 0.02, 0.62);
    vec3 hotPink = vec3(1.0, 0.16, 0.72);

    vec3 leftColor = mix(electricBlue, cyan, 0.45 + vDepth * 0.42);
    vec3 rightColor = mix(magenta, hotPink, vDepth * 0.72);
    vec3 color = mix(leftColor, rightColor, vSide);
    float centerViolet = 1.0 - abs(vSide * 2.0 - 1.0);
    color = mix(color, violet, centerViolet * (0.34 + vColorMix * 0.18));
    color = mix(color, vec3(1.0), vEdge * (0.28 + vDepth * 0.22));

    float shimmer = 0.82 + 0.18 * sin(
      uTime * (1.35 + vSeed * 1.8) + vSeed * 37.0
    );
    float brightness =
      0.66 + shimmer * 0.3 + vDepth * 0.22 + vEdge * 0.92 +
      vGlow * 0.72 + vPulse * 0.42;
    float alpha = spriteAlpha * (
      0.34 + vDepth * 0.24 + vEdge * 0.48 + vGlow * 0.16
    );

    gl_FragColor = vec4(color * brightness, alpha);
  }
`;

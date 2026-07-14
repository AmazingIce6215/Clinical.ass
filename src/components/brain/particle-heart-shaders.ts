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

  varying float vSeed;
  varying float vColorMix;
  varying float vDepth;
  varying float vGlow;

  vec3 safeDirection(vec3 vector, float seed) {
    float vectorLength = length(vector);
    if (vectorLength > 0.0001) return vector / vectorLength;
    return normalize(vec3(seed - 0.5, 0.35, 0.65 - seed));
  }

  void main() {
    vec3 displaced = position;
    float glow = 0.0;

    float mouseDistance = distance(displaced, uMouse);
    float mouseField = smoothstep(0.78, 0.0, mouseDistance) * uMouseStrength;
    vec3 mouseDirection = safeDirection(uMouse - displaced, aSeed);
    displaced += mouseDirection * mouseField * (0.1 + 0.035 * aSeed);
    glow += mouseField * 0.22;

    for (int index = 0; index < 3; index++) {
      float age = uTime - uRippleStartTimes[index];
      float active = step(0.0, age) * step(age, 1.35);
      float radius = age * 2.2;
      float distanceFromOrigin = distance(position, uRippleOrigins[index]);
      float band = smoothstep(0.14, 0.0, abs(distanceFromOrigin - radius));
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
      8.0,
      (2.6 + aSeed * 1.5) * aSize * uPixelRatio * perspective
    );

    vSeed = aSeed;
    vColorMix = aColorMix;
    vDepth = smoothstep(-0.58, 0.58, position.z);
    vGlow = glow;
  }
`;

export const particleHeartFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uSprite;

  varying float vSeed;
  varying float vColorMix;
  varying float vDepth;
  varying float vGlow;

  void main() {
    vec4 sprite = texture2D(uSprite, gl_PointCoord);
    if (sprite.a < 0.04) discard;

    vec3 burgundy = vec3(0.48, 0.015, 0.045);
    vec3 heartRed = vec3(0.94, 0.025, 0.075);
    vec3 vividRed = vec3(1.0, 0.08, 0.11);
    vec3 warmHighlight = vec3(1.0, 0.28, 0.22);
    vec3 color = mix(burgundy, heartRed, vColorMix);
    color = mix(color, vividRed, vDepth * 0.72);
    color = mix(color, warmHighlight, smoothstep(0.78, 1.0, vDepth) * 0.34);

    float shimmer = 0.96 + 0.04 * sin(uTime * 1.1 + vSeed * 29.0);
    float brightness = shimmer * (0.82 + vDepth * 0.22) + vGlow * 0.38;
    float alpha = sprite.a * (0.76 + vDepth * 0.24);

    gl_FragColor = vec4(color * brightness, alpha);
  }
`;

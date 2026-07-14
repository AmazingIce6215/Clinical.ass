export const particleHeartVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uBeatScale;
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  uniform float uDissolve;
  uniform vec3 uMouse;
  uniform vec3 uRippleOrigins[3];
  uniform float uRippleStartTimes[3];
  uniform vec3 uDissolveOrigin;

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
    float mouseField = smoothstep(0.82, 0.0, mouseDistance) * uMouseStrength;
    vec3 mouseDirection = safeDirection(uMouse - displaced, aSeed);
    displaced += mouseDirection * mouseField * (0.12 + 0.05 * aSeed);
    glow += mouseField * 0.42;

    for (int index = 0; index < 3; index++) {
      float age = uTime - uRippleStartTimes[index];
      float active = step(0.0, age) * step(age, 1.45);
      float radius = age * 2.25;
      float distanceFromOrigin = distance(position, uRippleOrigins[index]);
      float band = smoothstep(0.18, 0.0, abs(distanceFromOrigin - radius));
      band *= exp(-age * 1.05) * active;
      vec3 rippleDirection = safeDirection(position - uRippleOrigins[index], aSeed);
      displaced += rippleDirection * band * (0.19 + 0.06 * aSeed);
      glow += band * 1.35;
    }

    float dissolveDistance = distance(position, uDissolveOrigin);
    float dissolveFront = uDissolve * 3.7;
    float dissolveBand = exp(-abs(dissolveDistance - dissolveFront) * 7.5);
    dissolveBand *= smoothstep(0.001, 0.08, uDissolve);
    float consumed = 1.0 - smoothstep(
      dissolveFront - 0.16,
      dissolveFront + 0.2,
      dissolveDistance
    );
    vec3 dissolveDirection = safeDirection(position - uDissolveOrigin, aSeed);
    vec3 tangent = normalize(vec3(-dissolveDirection.y, dissolveDirection.x, 0.25));
    displaced += dissolveDirection * (dissolveBand * 0.42 + consumed * uDissolve * 1.1);
    displaced += tangent * consumed * uDissolve * (0.12 + aSeed * 0.18);
    glow += dissolveBand * 2.2;

    displaced *= uBeatScale;

    vec4 modelPosition = modelMatrix * vec4(displaced, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    float perspective = 4.4 / max(1.0, -viewPosition.z);
    gl_PointSize = min(19.0, (5.6 + aSeed * 2.7) * aSize * uPixelRatio * perspective);

    vSeed = aSeed;
    vColorMix = aColorMix;
    vDepth = smoothstep(-0.58, 0.58, position.z);
    vGlow = glow;
  }
`;

export const particleHeartFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform sampler2D uSprite;

  varying float vSeed;
  varying float vColorMix;
  varying float vDepth;
  varying float vGlow;

  void main() {
    vec4 sprite = texture2D(uSprite, gl_PointCoord);
    if (sprite.a < 0.015) discard;

    vec3 deepBlue = vec3(0.10, 0.28, 1.0);
    vec3 electricBlue = vec3(0.12, 0.58, 1.0);
    vec3 cyan = vec3(0.22, 0.92, 1.0);
    vec3 violet = vec3(0.42, 0.32, 1.0);
    vec3 color = mix(deepBlue, electricBlue, vColorMix);
    color = mix(color, cyan, smoothstep(0.5, 1.0, vDepth) * 0.72);
    color = mix(color, violet, (1.0 - vDepth) * (0.16 + vSeed * 0.16));

    float shimmer = 0.88 + 0.12 * sin(uTime * 1.35 + vSeed * 31.0);
    float brightness = shimmer * (0.72 + vDepth * 0.48) + vGlow * 1.35;
    float alpha = sprite.a * uOpacity * (0.52 + vDepth * 0.48);
    alpha *= min(1.35, 0.88 + vGlow * 0.52);

    gl_FragColor = vec4(color * brightness, alpha);
  }
`;

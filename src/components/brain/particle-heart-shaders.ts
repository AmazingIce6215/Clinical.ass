export const particleHeartVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uBeatScale;
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  uniform float uRim;
  uniform float uOpacity;
  uniform float uDissolve;
  uniform vec3 uMouse;
  uniform vec3 uDissolveOrigin;
  uniform vec3 uRippleOrigins[3];
  uniform float uRippleStartTimes[3];

  attribute vec3 aBasePosition;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  attribute float aPhase;
  attribute float aFrequency;

  varying vec3 vColor;
  varying float vDepth;
  varying float vGlow;
  varying float vPulse;
  varying float vTwinkle;
  varying float vRim;
  varying float vOpacity;

  vec3 safeDirection(vec3 vector, float seed) {
    float vectorLength = length(vector);
    if (vectorLength > 0.0001) return vector / vectorLength;
    return normalize(vec3(seed - 0.5, 0.35, 0.65 - seed));
  }

  void main() {
    float independentMotion = sin(uTime * aFrequency + aPhase);
    vec3 jitter = vec3(
      independentMotion,
      sin(uTime * (aFrequency * 0.83) + aPhase * 1.31),
      cos(uTime * (aFrequency * 1.17) + aPhase * 0.79)
    );
    vec3 displaced = aBasePosition + jitter * mix(0.032, 0.045, uRim);
    float glow = 0.0;

    float mouseDistance = distance(displaced, uMouse);
    float mouseField =
      (1.0 - smoothstep(0.0, 0.78, mouseDistance)) * uMouseStrength;
    vec3 mouseDirection = safeDirection(uMouse - displaced, aSeed);
    displaced += mouseDirection * mouseField * (0.1 + 0.035 * aSeed);
    glow += mouseField * 0.25;

    for (int index = 0; index < 3; index++) {
      float age = uTime - uRippleStartTimes[index];
      float rippleActive = step(0.0, age) * step(age, 1.45);
      float radius = age * 2.2;
      float distanceFromOrigin = distance(aBasePosition, uRippleOrigins[index]);
      float band =
        1.0 - smoothstep(0.0, 0.14, abs(distanceFromOrigin - radius));
      band *= exp(-age * 1.05) * rippleActive;
      vec3 rippleDirection = safeDirection(
        aBasePosition - uRippleOrigins[index],
        aSeed
      );
      displaced += rippleDirection * band * (0.15 + 0.045 * aSeed);
      glow += band * 0.82;
    }

    displaced *= uBeatScale;
    displaced += safeDirection(aBasePosition - uDissolveOrigin, aSeed) *
      uDissolve * uDissolve * (0.2 + aSeed * 0.58);

    vec4 modelPosition = modelMatrix * vec4(displaced, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    float perspective = 4.2 / max(1.0, -viewPosition.z);
    gl_PointSize = min(
      10.0,
      (1.9 + aSeed * 1.25 + uRim * 1.4) *
        aSize * uPixelRatio * perspective
    );

    vColor = aColor;
    vDepth = smoothstep(-0.6, 0.6, aBasePosition.z);
    vGlow = glow;
    vPulse = max(0.0, (uBeatScale - 1.0) * 15.0);
    vTwinkle = 0.5 + 0.5 * sin(uTime * aFrequency + aPhase);
    vRim = uRim;
    float dissolveMask = 1.0 - smoothstep(
      aSeed - 0.18,
      aSeed + 0.18,
      uDissolve
    );
    vOpacity = uOpacity * dissolveMask * (1.0 - uDissolve);
  }
`;

export const particleHeartFragmentShader = /* glsl */ `
  uniform float uIntensity;

  varying vec3 vColor;
  varying float vDepth;
  varying float vGlow;
  varying float vPulse;
  varying float vTwinkle;
  varying float vRim;
  varying float vOpacity;

  void main() {
    float pointDistance = length(gl_PointCoord - vec2(0.5));
    float spriteAlpha = 1.0 - smoothstep(0.18, 0.5, pointDistance);
    if (spriteAlpha < 0.025) discard;

    vec3 coralPeak = vec3(1.0, 0.353, 0.353);
    vec3 color = mix(vColor, coralPeak, vRim * vTwinkle * 0.32);
    color = mix(color, vec3(1.0, 0.72, 0.72), vRim * vTwinkle * 0.2);

    float brightness =
      0.66 + vDepth * 0.17 + vRim * 0.58 + vGlow * 0.78 +
      vPulse * 0.42 + vTwinkle * (0.16 + vRim * 0.38);
    float alpha = spriteAlpha *
      (0.34 + vDepth * 0.12 + vRim * 0.4 + vGlow * 0.16) *
      mix(0.4, 1.0, vTwinkle) * uIntensity * vOpacity;

    gl_FragColor = vec4(color * brightness, alpha);
  }
`;

export const tendrilVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDissolve;

  attribute float aProgress;
  attribute float aPhase;
  attribute float aSize;

  varying float vTail;
  varying float vHead;
  varying float vOpacity;

  void main() {
    float head = fract(uTime * 0.115 + aPhase);
    float behindHead = fract(head - aProgress);
    float tail = 1.0 - smoothstep(0.0, 0.3, behindHead);
    float headGlow = 1.0 - smoothstep(0.0, 0.045, behindHead);

    vec3 animated = position;
    animated.x += sin(uTime * 0.72 + aProgress * 18.0 + aPhase * 23.0) * 0.012;
    animated.y += cos(uTime * 0.61 + aProgress * 15.0 + aPhase * 19.0) * 0.01;
    animated += normalize(position + vec3(0.001)) * uDissolve * 0.34;

    vec4 viewPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = min(
      7.0,
      (1.6 + headGlow * 2.2) * aSize * uPixelRatio *
        (4.2 / max(1.0, -viewPosition.z))
    );

    vTail = tail;
    vHead = headGlow;
    vOpacity = (1.0 - uDissolve) * (0.12 + tail * 0.88);
  }
`;

export const tendrilFragmentShader = /* glsl */ `
  varying float vTail;
  varying float vHead;
  varying float vOpacity;

  void main() {
    float pointDistance = length(gl_PointCoord - vec2(0.5));
    float spriteAlpha = 1.0 - smoothstep(0.2, 0.5, pointDistance);
    if (spriteAlpha < 0.03) discard;

    vec3 crimson = vec3(0.718, 0.11, 0.18);
    vec3 coral = vec3(1.0, 0.353, 0.353);
    vec3 color = mix(crimson, coral, vTail * 0.58 + vHead * 0.42);
    float alpha = spriteAlpha * vOpacity * (0.2 + vTail * 0.52 + vHead * 0.58);
    gl_FragColor = vec4(color * (0.7 + vHead * 1.25), alpha);
  }
`;

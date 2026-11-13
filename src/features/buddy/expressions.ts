/**
 * Buddy's expressions as small parameter sets. The model eases between them,
 * so any state can follow any other. Engine-agnostic (no three.js here).
 */
export type ExpressionParams = {
  eyeLeft: number; // overall eye scale, left
  eyeRight: number; // overall eye scale, right
  eyeWidth: number;
  eyeHeight: number; // < 1 reads as a happy squint
  eyeLift: number; // raises the eyes (curious / surprised)
  mouthWidth: number;
  mouthCurve: number; // depth of the smile
  tilt: number; // head tilt (radians)
};

export type ExpressionName = 'idle' | 'greeting' | 'happy' | 'curious' | 'listening' | 'thinking' | 'flying' | 'surprised' | 'wink' | 'laughing' | 'playful';

const base: ExpressionParams = { eyeLeft: 1, eyeRight: 1, eyeWidth: 1, eyeHeight: 1, eyeLift: 0, mouthWidth: 1, mouthCurve: 1, tilt: 0 };

export const expressions: Record<ExpressionName, ExpressionParams> = {
  idle: base,
  greeting: { ...base, eyeHeight: 1.04, eyeLift: 0.012, mouthWidth: 1.2, mouthCurve: 1.3, tilt: 0.05 },
  happy: { ...base, eyeHeight: 0.88, mouthWidth: 1.18, mouthCurve: 1.35, tilt: -0.04 },
  curious: { ...base, eyeLeft: 1.08, eyeRight: 0.94, eyeLift: 0.015, mouthWidth: 0.8, mouthCurve: 0.65, tilt: 0.12 },
  listening: { ...base, eyeLeft: 1.04, eyeRight: 1.04, mouthWidth: 0.9, mouthCurve: 0.9, tilt: -0.08 },
  thinking: { ...base, eyeHeight: 0.94, eyeLift: 0.02, mouthWidth: 0.75, mouthCurve: 0.5, tilt: 0.07 },
  flying: { ...base, eyeHeight: 0.96, mouthWidth: 0.85, mouthCurve: 0.8 },
  surprised: { ...base, eyeHeight: 1.2, eyeLift: 0.035, mouthWidth: 0.72, mouthCurve: 0.45, tilt: 0.04 },
  wink: { ...base, eyeLeft: 0.18, eyeRight: 1.05, eyeHeight: 1.02, mouthWidth: 1.2, mouthCurve: 1.3, tilt: -0.12 },
  laughing: { ...base, eyeHeight: 0.28, mouthWidth: 1.35, mouthCurve: 1.55, tilt: -0.08 },
  playful: { ...base, eyeLeft: 1.08, eyeRight: 0.88, eyeHeight: 0.95, mouthWidth: 1.3, mouthCurve: 1.35, tilt: 0.16 },
};

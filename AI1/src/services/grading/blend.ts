function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function blendScores(
  visionScore: number,
  reasonFinal: number,
  photoQuality: number
): { finalScore: number; weightUsed: number } {
  const w = clamp(photoQuality, 0, 1);
  const blended = Math.round(w * visionScore + (1 - w) * reasonFinal);
  const finalScore = clamp(blended, 0, 100);

  return {
    finalScore,
    weightUsed: w,
  };
}

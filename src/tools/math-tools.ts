/**
 * Calculate the median of the given numbers
 */
export function median(input: number[]) {
  const sorted = input.sort();
  if (sorted.length % 2 === 0) {
    // We haven an even number, so we do not have a middle element
    const middle = sorted.length / 2;
    return (sorted[Math.floor(middle)] + sorted[Math.ceil(middle)]) / 2;
  } else {
    return sorted[(sorted.length - 1) / 2];
  }
}

/**
 * Calculate the average of the given numbers
 */
export function average(input: number[]) {
  let runningAverage = 0;
  for (const num of input) {
    runningAverage += num / input.length;
  }
  return runningAverage;
}

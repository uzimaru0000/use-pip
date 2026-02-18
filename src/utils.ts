export const computeMinimalVideoSize = (width: number, height: number) => {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { width: 1, height: 1 };
  }

  const decimalPlaces = (value: number) => {
    const stringified = value.toString();
    if (!stringified.includes('e')) {
      const [, decimals = ''] = stringified.split('.');
      return decimals.length;
    }

    const [base, exponentPart] = stringified.split('e');
    const exponent = Number(exponentPart);
    const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0;
    return Math.max(0, baseDecimals - exponent);
  };

  const multiplier =
    10 ** Math.max(decimalPlaces(width), decimalPlaces(height));
  let a = Math.abs(Math.round(width * multiplier));
  let b = Math.abs(Math.round(height * multiplier));

  while (b !== 0) {
    const tmp = b;
    b = a % b;
    a = tmp;
  }

  const divisor = a || 1;
  const minimalWidth = Math.round((width * multiplier) / divisor);
  const minimalHeight = Math.round((height * multiplier) / divisor);

  return { width: minimalWidth, height: minimalHeight };
};

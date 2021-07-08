export class MathHelper {
  public static percentageOfBase(amount: number, base: number): number {
    return this.roundWithPrecision((amount / base) * 100, 1);
  }

  public static roundWithPrecision(value: number, precision: number): number {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }
}

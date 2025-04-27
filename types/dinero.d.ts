declare module 'dinero.js' {
  interface DineroOptions {
    amount: number;
    currency?: string;
    precision?: number;
  }

  interface Dinero {
    getAmount(): number;
    getCurrency(): string;
    getPrecision(): number;
    convertPrecision(precision: number): Dinero;
    add(dinero: Dinero): Dinero;
    subtract(dinero: Dinero): Dinero;
    multiply(multiplier: number): Dinero;
    divide(divisor: number): Dinero;
    percentage(percentage: number): Dinero;
    allocate(ratios: number[]): Dinero[];
    convert(exchange: number): Promise<Dinero>;
    equalsTo(dinero: Dinero): boolean;
    lessThan(dinero: Dinero): boolean;
    lessThanOrEqual(dinero: Dinero): boolean;
    greaterThan(dinero: Dinero): boolean;
    greaterThanOrEqual(dinero: Dinero): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    hasSubUnits(): boolean;
    hasSameCurrency(dinero: Dinero): boolean;
    hasSameAmount(dinero: Dinero): boolean;
    toFormat(format?: string): string;
    toObject(): DineroObject;
    toJSON(): DineroObject;
  }

  interface DineroObject {
    amount: number;
    currency: string;
    precision: number;
  }

  interface DineroFactory {
    (options: DineroOptions): Dinero;
    defaultCurrency: string;
    defaultPrecision: number;
    minimum(dineros: Dinero[]): Dinero;
    maximum(dineros: Dinero[]): Dinero;
  }

  const Dinero: DineroFactory;
  export default Dinero;
} 
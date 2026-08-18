/**
 * A small matcher shim over node:assert.
 *
 * The engine has zero runtime dependencies and the tests keep it that way:
 * `npm test` runs on Node's built-in test runner with nothing installed.
 * The matcher names match vitest/jest, so if you later add either, the test
 * bodies port across untouched — only this file gets deleted.
 *
 * Note: written in strip-only-safe TypeScript (no parameter properties, no
 * enums, no namespaces) because Node executes these .ts files directly.
 */
import assert from 'node:assert/strict';

class Expectation<T> {
  readonly actual: T;
  readonly negated: boolean;

  constructor(actual: T, negated = false) {
    this.actual = actual;
    this.negated = negated;
  }

  private check(pass: boolean, message: string): void {
    if (this.negated ? pass : !pass) {
      const shown = typeof this.actual === 'function' ? '[function]' : JSON.stringify(this.actual);
      assert.fail(`${this.negated ? 'not: ' : ''}${message}\n  actual: ${shown}`);
    }
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.negated);
  }

  toBe(expected: unknown): void {
    this.check(Object.is(this.actual, expected), `expected ${JSON.stringify(expected)}`);
  }

  toEqual(expected: unknown): void {
    let pass = true;
    try {
      assert.deepStrictEqual(this.actual, expected);
    } catch {
      pass = false;
    }
    this.check(pass, `expected deep equality with ${JSON.stringify(expected)}`);
  }

  toHaveLength(n: number): void {
    const len = (this.actual as { length?: number } | null)?.length;
    this.check(len === n, `expected length ${n}, got ${String(len)}`);
  }

  toBeNull(): void {
    this.check(this.actual === null, 'expected null');
  }

  toBeGreaterThan(n: number): void {
    this.check((this.actual as number) > n, `expected > ${n}`);
  }

  toBeGreaterThanOrEqual(n: number): void {
    this.check((this.actual as number) >= n, `expected >= ${n}`);
  }

  toBeLessThan(n: number): void {
    this.check((this.actual as number) < n, `expected < ${n}`);
  }

  toBeLessThanOrEqual(n: number): void {
    this.check((this.actual as number) <= n, `expected <= ${n}`);
  }

  toThrow(): void {
    let threw = false;
    try {
      (this.actual as () => unknown)();
    } catch {
      threw = true;
    }
    this.check(threw, 'expected the call to throw');
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

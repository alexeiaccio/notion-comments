import TestRenderer from "react-test-renderer";
import { expect } from "vitest";

export function expectRenderToEqual(
  actual: React.ReactElement,
  expected: React.ReactElement,
) {
  expect(TestRenderer.create(actual).toJSON()).toEqual(
    TestRenderer.create(expected).toJSON(),
  );
}

export function expectRenderToThrow(actual: React.ReactElement, error: string) {
  const consoleError = console.error;
  try {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.error = () => {};
    expect(() => TestRenderer.create(actual)).toThrow(error);
  } finally {
    console.error = consoleError;
  }
}

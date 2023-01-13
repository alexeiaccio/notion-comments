/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Meta, StoryFn } from "@storybook/react";
import React, { Suspense, useReducer, useState } from "react";
import { If } from "../If";

import { Show, Await, useAsyncValue } from "./Show";

const meta = {
  title: "UI/Show",
  component: Show,
  tags: ["autodocs"],
} satisfies Meta<typeof Show>;

export default meta;

export const WithFallback: StoryFn<typeof Show> = () => {
  const promise = new Promise<{ value: string }>((resolve) => {
    return setTimeout(() => {
      resolve({ value: "Value!" });
    }, 1000);
  });
  const [_, reload] = useReducer(
    (s) => s + 1,
    () => 0,
  );

  return (
    <>
      <button onClick={reload}>Reload</button>
      <Show when={promise} fallback={<div>Loading...</div>}>
        {(res) => {
          return <div>{res.value}</div>;
        }}
      </Show>
    </>
  );
};

export const WithError: StoryFn<typeof Show> = () => {
  const promise = new Promise<{ value: string }>((_, reject) => {
    return setTimeout(() => {
      reject(new Error("Promise was rejected"));
    }, 1000);
  });
  const [_, reload] = useReducer(
    (s) => s + 1,
    () => 0,
  );

  return (
    <>
      <button onClick={reload}>Reload</button>
      <Show
        when={promise}
        fallback={<div>Loading...</div>}
        errorElement={(e) => (
          <div>
            Some error was occured 🙁{" "}
            {e instanceof Error && `(cause: "${e.message}")`}
          </div>
        )}
      >
        {(res) => {
          return <div>{res.value}</div>;
        }}
      </Show>
    </>
  );
};

export const WithValue: StoryFn<typeof Show> = () => {
  const data = { value: "Value!" };

  return (
    <Show when={data} fallback={<div>Loading...</div>}>
      <div>{data.value}</div>
    </Show>
  );
};

export const WithFalsableValue: StoryFn<typeof Show> = () => {
  const promise = new Promise<{ value: string } | null>((resolve) => {
    const random = Math.random();
    return setTimeout(() => {
      if (random < 0.5) {
        resolve(null);
      } else {
        resolve({ value: "Value!" });
      }
    }, 1000);
  });
  const [_, reload] = useReducer(
    (s) => s + 1,
    () => 0,
  );

  return (
    <>
      <button onClick={reload}>Reload</button>
      <Show when={promise} fallback={<div>Loading...</div>}>
        {(res) => (
          <If
            test={res}
            then={({ value }) => <div>{value}</div>}
            else={<div>No value</div>}
          />
        )}
      </Show>
    </>
  );
};

export const WithAwait: StoryFn<typeof Show> = () => {
  const promise = new Promise<{ value: string }>((resolve) => {
    return setTimeout(() => {
      resolve({ value: "Value!" });
    }, 1000);
  });
  const [_, reload] = useReducer(
    (s) => s + 1,
    () => 0,
  );

  return (
    <>
      <button onClick={reload}>Reload</button>
      <Suspense fallback={<div>Fallback...</div>}>
        <Await resolve={promise}>
          <ChildComponent />
          <ChildComponent />
        </Await>
      </Suspense>
    </>
  );
};

function ChildComponent() {
  const data = useAsyncValue();
  return <div>{data?.value}</div>;
}

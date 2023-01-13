import type { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { If } from "../If";

import { Show } from "./Show";

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

  return (
    <Show when={promise} fallback={<div>Loading...</div>}>
      {(res) => {
        return <div>{res.value}</div>;
      }}
    </Show>
  );
};

export const WithError: StoryFn<typeof Show> = () => {
  const promise = new Promise<{ value: string }>((_, reject) => {
    return setTimeout(() => {
      reject(new Error("Promise was rejected"));
    }, 1000);
  });

  return (
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

  return (
    <Show when={promise} fallback={<div>Loading...</div>}>
      {(res) => (
        <If
          test={res}
          then={({ value }) => <div>{value}</div>}
          else={<div>No value</div>}
        />
      )}
    </Show>
  );
};

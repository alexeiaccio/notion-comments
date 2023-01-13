import type { Meta, StoryFn } from "@storybook/react";
import React from "react";

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
    <Show resolve={promise} fallback={<div>Loading...</div>}>
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
      resolve={promise}
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
    <Show resolve={data} fallback={<div>Loading...</div>}>
      <div>{data.value}</div>
    </Show>
  );
};

import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "../styles/globals.css";

const container = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
const app = <App />;
root.render(app);

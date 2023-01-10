import { For } from "./For";

export function App() {
  return (
    <main>
      <section>
        <h1>FOR</h1>
        <For of={["a", "b", "c"]}>{(item) => <li>{item}</li>}</For>
      </section>
    </main>
  );
}

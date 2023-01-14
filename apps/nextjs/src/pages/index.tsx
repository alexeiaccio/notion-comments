import { Await, Else, If, Show } from "@notion-comments/ui";
import { ElseIf, Then } from "@notion-comments/ui/src/If";
import type { NextPage } from "next";
import { signIn, signOut } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import { QueryBoundary, ShowQuery } from "../components/query";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-[hsl(280,100%,70%)]">T3</span> Turbo
          </h1>
          <AuthShowcase />
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: session } = trpc.auth.getSession.useQuery();
  const context = trpc.useContext();
  const [showMessage, setShowMessage] = useState(false);
  const messagePromise = showMessage
    ? context.auth.getSecretMessage.fetch()
    : new Promise<string>(() => {});

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <If test={session?.user}>
        <p className="text-center text-2xl text-white">
          {session && <span>Logged in as {session?.user?.name}</span>}
          <Show
            when={messagePromise}
            fallback={<span> – loading...</span>}
            errorElement={(e) => <span> - {e.message}</span>}
          >
            {(message) => <SecretMessage message={message} />}
          </Show>
          <If test={showMessage}>
            <QueryBoundary
              // when={messagePromise}
              fallback={<span> – loading...</span>}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <span>
                  {" - "}
                  {error.message}{" "}
                  <button onClick={resetErrorBoundary}>Retry</button>
                </span>
              )}
            >
              <SecretMessageSuspense />
            </QueryBoundary>
          </If>
        </p>
      </If>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() => {
          setShowMessage((x) => !x);
        }}
        disabled={!session?.user}
      >
        <If test={showMessage} then={"Hide message"} else={"Show message"} />
      </button>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={session ? () => signOut() : () => signIn()}
      >
        {session ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

function SecretMessage({ message }: { message?: string }) {
  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined,
    { initialData: message },
  );

  return (
    <If
      test={secretMessage}
      then={(message) => <span> - {message}</span>}
      else={"No message"}
    />
  );
}

function SecretMessageSuspense({ message }: { message?: string }) {
  const { data: secretMessage, error } = trpc.auth.getSecretMessage.useQuery(
    undefined,
    { initialData: message, suspense: true, useErrorBoundary: true },
  );

  return (
    <If test={secretMessage}>
      <Then test={secretMessage}>{(message) => <span> - {message}</span>}</Then>
      <ElseIf test={error}>
        <Then test={error}>{(e) => <span> - {e.message}</span>}</Then>
        <Else>{"No message"}</Else>
      </ElseIf>
    </If>
  );
}

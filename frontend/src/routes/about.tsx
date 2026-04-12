import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          スキルマップを育てるための土台です。
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          frontend は TanStack Start、backend は Hono と Drizzle を使い、 共通の
          zod contract で API の型を共有しています。いまは
          スキルマップ一覧、ユーザー進捗、完了トグルまで接続済みです。
        </p>
      </section>
    </main>
  )
}

import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react'
import { startTransition, useEffect, useState } from 'react'
import {
  completeSkillNode,
  getSkillMapValidation,
  getUserSkillMapBundle,
  listSkillMaps,
  listUsers,
  resetSkillNodeCompletion,
} from '../api/client'
import type {
  SkillMapSummary,
  SkillMapValidation,
  UserSkillMapBundle,
  UserSummary,
} from '../api/contracts'
import { mapApiSkillMapToClient } from './adapters'
import { getNodesInLayoutOrder, resolveSkillMap } from './model'
import type { ResolvedSkillNode } from './model'

export default function SkillMapDashboard() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [skillMaps, setSkillMaps] = useState<SkillMapSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedSkillMapId, setSelectedSkillMapId] = useState('')
  const [bundle, setBundle] = useState<UserSkillMapBundle | null>(null)
  const [validation, setValidation] = useState<SkillMapValidation | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsBootstrapping(true)
      setErrorMessage(null)

      try {
        const [nextUsers, nextSkillMaps] = await Promise.all([
          listUsers(),
          listSkillMaps(),
        ])

        if (cancelled) {
          return
        }

        startTransition(() => {
          setUsers(nextUsers)
          setSkillMaps(nextSkillMaps)
          setSelectedUserId(nextUsers[0]?.id ?? '')
          setSelectedSkillMapId(nextSkillMaps[0]?.id ?? '')
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedUserId || !selectedSkillMapId) {
      startTransition(() => {
        setBundle(null)
        setValidation(null)
      })
      return
    }

    let cancelled = false

    async function refreshSelection() {
      setIsRefreshing(true)
      setErrorMessage(null)

      try {
        const [nextBundle, nextValidation] = await Promise.all([
          getUserSkillMapBundle(selectedUserId, selectedSkillMapId),
          getSkillMapValidation(selectedSkillMapId),
        ])

        if (cancelled) {
          return
        }

        startTransition(() => {
          setBundle(nextBundle)
          setValidation(nextValidation)
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setBundle(null)
          setValidation(null)
        })
        setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) {
          setIsRefreshing(false)
        }
      }
    }

    void refreshSelection()

    return () => {
      cancelled = true
    }
  }, [selectedSkillMapId, selectedUserId])

  const clientSkillMap = bundle ? mapApiSkillMapToClient(bundle.skillMap) : null
  const resolvedNodesById =
    bundle && clientSkillMap
      ? resolveSkillMap(clientSkillMap, {
          completedNodeIds: bundle.progress.completedNodeIds,
        })
      : null
  const orderedNodes = clientSkillMap ? getNodesInLayoutOrder(clientSkillMap) : []
  const resolvedNodes = resolvedNodesById
    ? orderedNodes.map((node) => resolvedNodesById[node.id])
    : []
  const columns = groupNodesByColumn(resolvedNodes)
  const availableCount = resolvedNodes.filter(
    (node) => node.status === 'available',
  ).length
  const completedCount = bundle?.progress.totalCompleted ?? 0
  const issueCount = validation?.issues.length ?? 0

  async function handleNodeToggle(node: ResolvedSkillNode) {
    if (!bundle) {
      return
    }

    setActiveNodeId(node.id)
    setErrorMessage(null)

    try {
      if (node.status === 'completed') {
        await resetSkillNodeCompletion({
          skillNodeId: node.id,
          body: {
            userId: bundle.user.id,
            skillMapId: bundle.skillMap.id,
          },
        })
      } else {
        await completeSkillNode({
          skillNodeId: node.id,
          body: {
            userId: bundle.user.id,
            skillMapId: bundle.skillMap.id,
          },
        })
      }

      const nextBundle = await getUserSkillMapBundle(
        bundle.user.id,
        bundle.skillMap.id,
      )

      startTransition(() => {
        setBundle(nextBundle)
      })
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setActiveNodeId(null)
    }
  }

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <section className="island-shell relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.3),transparent_66%)]" />
        <div className="pointer-events-none absolute -right-12 top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="island-kicker mb-3">Frontend x Backend Integration</p>
            <h1 className="display-title mb-4 text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
              実データで進捗が動くスキルマップ
            </h1>
            <p className="max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
              backend のユーザー、スキルマップ、進捗 API をつないで、
              frontend から完了状態をそのまま更新できるところまで入れています。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sea-ink-soft)]">
                学習ユーザー
              </span>
              <select
                value={selectedUserId}
                onChange={(event) => {
                  setSelectedUserId(event.target.value)
                }}
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.45)]"
                disabled={isBootstrapping || users.length === 0}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sea-ink-soft)]">
                スキルマップ
              </span>
              <select
                value={selectedSkillMapId}
                onChange={(event) => {
                  setSelectedSkillMapId(event.target.value)
                }}
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.45)]"
                disabled={isBootstrapping || skillMaps.length === 0}
              >
                {skillMaps.map((skillMap) => (
                  <option key={skillMap.id} value={skillMap.id}>
                    {skillMap.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="island-shell mt-6 rounded-2xl border border-[rgba(191,87,68,0.28)] p-4 text-sm text-[var(--sea-ink)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-[var(--palm)]" />
            <div>
              <p className="m-0 font-semibold">接続エラー</p>
              <p className="mt-1 text-[var(--sea-ink-soft)]">{errorMessage}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: '完了済み',
            value: `${completedCount} / ${resolvedNodes.length || 0}`,
            hint: 'ユーザー進捗 API から集計',
          },
          {
            label: '着手可能',
            value: String(availableCount),
            hint: 'unlock 条件から自動判定',
          },
          {
            label: '整合性チェック',
            value: validation?.isValid ? 'OK' : `${issueCount} 件`,
            hint: validation?.isValid ? 'backend validate API' : '要確認',
          },
          {
            label: '現在の状態',
            value: isBootstrapping || isRefreshing ? '同期中' : '最新',
            hint: isBootstrapping || isRefreshing ? 'API を再読込中' : 'frontend と backend が接続済み',
          },
        ].map((item) => (
          <article
            key={item.label}
            className="island-shell rounded-2xl p-5"
          >
            <p className="m-0 text-sm font-semibold text-[var(--sea-ink-soft)]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--sea-ink)]">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="island-shell rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="island-kicker mb-2">Skill Graph</p>
              <h2 className="text-2xl font-bold text-[var(--sea-ink)]">
                {bundle?.skillMap.name ?? 'スキルマップを読み込み中'}
              </h2>
            </div>
            {isBootstrapping || isRefreshing ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                読み込み中
              </div>
            ) : null}
          </div>

          {isBootstrapping ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
            </div>
          ) : resolvedNodes.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] px-5 py-10 text-center text-[var(--sea-ink-soft)]">
              表示できるスキルノードがまだありません。
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {columns.map(([column, nodes]) => (
                <section
                  key={column}
                  className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.22)] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="m-0 text-sm font-semibold text-[var(--sea-ink-soft)]">
                      Column {column + 1}
                    </p>
                    <span className="rounded-full bg-[rgba(79,184,178,0.14)] px-2.5 py-1 text-xs font-semibold text-[var(--lagoon-deep)]">
                      {nodes.length} nodes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {nodes.map((node) => {
                      const isLocked = node.status === 'locked'
                      const isCompleted = node.status === 'completed'
                      const isMutating = activeNodeId === node.id

                      return (
                        <article
                          key={node.id}
                          className={getNodeCardClassName(node.status)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[rgba(50,143,151,0.2)] bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--lagoon-deep)]">
                                  {node.kind}
                                </span>
                                <span className={getStatusBadgeClassName(node.status)}>
                                  {statusLabelByNodeState[node.status]}
                                </span>
                              </div>
                              <h3 className="mt-3 text-lg font-bold text-[var(--sea-ink)]">
                                {node.title}
                              </h3>
                            </div>

                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-[var(--palm)]" />
                            ) : isLocked ? (
                              <LockKeyhole className="h-5 w-5 text-[var(--sea-ink-soft)]" />
                            ) : null}
                          </div>

                          <p className="mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
                            {node.description}
                          </p>

                          <p className="mt-4 text-xs leading-5 text-[var(--sea-ink-soft)]">
                            {getUnlockSummary(node, clientSkillMap?.nodes ?? {})}
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              void handleNodeToggle(node)
                            }}
                            disabled={isLocked || isMutating}
                            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-[rgba(50,143,151,0.22)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {isMutating ? (
                              <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                更新中
                              </>
                            ) : isCompleted ? (
                              '完了を戻す'
                            ) : (
                              '完了にする'
                            )}
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="island-shell rounded-[2rem] p-5">
            <p className="island-kicker mb-2">Current Selection</p>
            <h2 className="text-xl font-bold text-[var(--sea-ink)]">
              {bundle?.user.name ?? 'ユーザー未選択'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
              {bundle
                ? `${bundle.progress.totalCompleted} 個のノードを完了済みです。`
                : 'ユーザーとスキルマップを選ぶと進捗の詳細が表示されます。'}
            </p>
          </section>

          <section className="island-shell rounded-[2rem] p-5">
            <p className="island-kicker mb-2">Validation</p>
            <h2 className="text-xl font-bold text-[var(--sea-ink)]">
              {validation?.isValid ? '不整合なし' : '確認ポイントあり'}
            </h2>

            {validation?.issues.length ? (
              <ul className="mt-4 space-y-3 text-sm text-[var(--sea-ink-soft)]">
                {validation.issues.map((issue) => (
                  <li
                    key={`${issue.code}:${issue.nodeId ?? ''}:${issue.edgeId ?? ''}`}
                    className="rounded-2xl border border-[rgba(23,58,64,0.1)] bg-white/60 px-4 py-3"
                  >
                    <p className="m-0 font-semibold text-[var(--sea-ink)]">
                      {issue.code}
                    </p>
                    <p className="mt-1">{issue.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
                backend の validate API が現在のスキルマップを正常と判定しています。
              </p>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}

const statusLabelByNodeState = {
  locked: 'Locked',
  available: 'Ready',
  completed: 'Done',
} as const

function groupNodesByColumn(nodes: ResolvedSkillNode[]) {
  const grouped = new Map<number, ResolvedSkillNode[]>()

  for (const node of nodes) {
    const current = grouped.get(node.layout.column) ?? []
    current.push(node)
    grouped.set(node.layout.column, current)
  }

  return [...grouped.entries()].sort(([left], [right]) => left - right)
}

function getUnlockSummary(
  node: ResolvedSkillNode,
  nodesById: Partial<Record<string, { title: string }>>,
) {
  if (node.unlock.nodeIds.length === 0) {
    return '前提なし。すぐに始められるスタートノードです。'
  }

  const prerequisiteTitles = node.unlock.nodeIds.map(
    (nodeId) => nodesById[nodeId]?.title ?? nodeId,
  )

  return node.unlock.mode === 'all'
    ? `前提: ${prerequisiteTitles.join(' / ')} をすべて完了`
    : `前提: ${prerequisiteTitles.join(' / ')} のいずれかを完了`
}

function getNodeCardClassName(status: ResolvedSkillNode['status']) {
  if (status === 'completed') {
    return 'rounded-[1.4rem] border border-[rgba(47,106,74,0.24)] bg-[linear-gradient(180deg,rgba(110,200,154,0.22),rgba(255,255,255,0.82))] p-4 shadow-[0_14px_28px_rgba(30,90,72,0.08)]'
  }

  if (status === 'available') {
    return 'rounded-[1.4rem] border border-[rgba(50,143,151,0.28)] bg-[linear-gradient(180deg,rgba(79,184,178,0.18),rgba(255,255,255,0.84))] p-4 shadow-[0_14px_28px_rgba(30,90,72,0.08)]'
  }

  return 'rounded-[1.4rem] border border-[rgba(23,58,64,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.78))] p-4 shadow-[0_10px_22px_rgba(23,58,64,0.05)]'
}

function getStatusBadgeClassName(status: ResolvedSkillNode['status']) {
  if (status === 'completed') {
    return 'rounded-full bg-[rgba(47,106,74,0.12)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--palm)]'
  }

  if (status === 'available') {
    return 'rounded-full bg-[rgba(79,184,178,0.16)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--lagoon-deep)]'
  }

  return 'rounded-full bg-[rgba(23,58,64,0.08)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]'
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '予期しないエラーが発生しました。'
}

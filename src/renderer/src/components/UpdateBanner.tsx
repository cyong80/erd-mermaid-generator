import React, { useEffect, useState } from 'react'
import { ArrowUp, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UpdateState =
  | { type: 'available'; version: string }
  | { type: 'progress'; percent: number }
  | { type: 'downloaded' }
  | { type: 'error'; msg: string }
  | null

export default function UpdateBanner() {
  const [state, setState] = useState<UpdateState>(null)

  useEffect(() => {
    window.api.onUpdateEvent('update-available', (...args) => {
      const info = args[0] as { version?: string }
      setState({ type: 'available', version: info.version ?? '' })
    })
    window.api.onUpdateEvent('update-progress', (...args) => {
      const info = args[0] as { percent?: number }
      setState({ type: 'progress', percent: info.percent ?? 0 })
    })
    window.api.onUpdateEvent('update-downloaded', () => {
      setState({ type: 'downloaded' })
    })
    window.api.onUpdateEvent('update-error', (...args) => {
      setState({ type: 'error', msg: String(args[0]) })
      setTimeout(() => setState(null), 5000)
    })
    return () => {
      ;['update-available', 'update-progress', 'update-downloaded', 'update-error'].forEach(
        (ch) => window.api.offUpdateEvent(ch)
      )
    }
  }, [])

  if (!state) return null

  const baseStyles =
    'fixed bottom-0 left-0 right-0 py-2.5 px-5 flex items-center gap-2.5 text-sm z-[999] glass-panel rounded-none border-x-0 border-b-0'

  if (state.type === 'available')
    return (
      <div className={baseStyles}>
        <ArrowUp className="size-4 text-amber-500 shrink-0" />
        <span className="text-muted-foreground">
          새 버전 <strong className="text-foreground">v{state.version}</strong> 이 있습니다.
        </span>
        <Button
          size="sm"
          onClick={() => window.api.downloadUpdate()}
          className="ml-auto h-8 px-3.5 font-semibold"
        >
          다운로드
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setState(null)}
          className="text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>
    )

  if (state.type === 'progress')
    return (
      <div className={cn(baseStyles, 'flex-col gap-1')}>
        <div className="w-full flex justify-between text-xs text-muted-foreground">
          <span>업데이트 다운로드 중...</span>
          <span>{state.percent}%</span>
        </div>
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-300"
            style={{ width: `${state.percent}%` }}
          />
        </div>
      </div>
    )

  if (state.type === 'downloaded')
    return (
      <div className={baseStyles}>
        <Check className="size-4 text-emerald-500 shrink-0" />
        <span className="text-muted-foreground">업데이트 준비 완료. 재시작하면 적용됩니다.</span>
        <Button
          size="sm"
          onClick={() => window.api.installUpdate()}
          className="ml-auto h-8 px-3.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          지금 재시작
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setState(null)}
          className="text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>
    )

  if (state.type === 'error')
    return (
      <div className={baseStyles}>
        <AlertTriangle className="size-4 text-destructive shrink-0" />
        <span className="text-muted-foreground">업데이트 오류: {state.msg}</span>
      </div>
    )

  return null
}

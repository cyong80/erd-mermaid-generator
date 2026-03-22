import React, { useState, useEffect } from 'react'
import { CircleDot, Loader2, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DBConfig, RecentConnection } from '../../../shared/types'

const DEFAULTS: Record<'mysql' | 'postgres', { port: string; user: string }> = {
  mysql: { port: '3306', user: 'root' },
  postgres: { port: '5432', user: 'postgres' },
}

interface FormState extends DBConfig {}

interface FieldProps {
  label: string
  name: string
  type?: 'text' | 'password'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

const Field = ({ label, name, type = 'text', value, onChange, placeholder }: FieldProps) => (
  <div className="mb-4">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2.5 block">
      {label}
    </Label>
    <Input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className="h-10 py-2.5"
    />
  </div>
)

interface ConnectionFormProps {
  onScan: (config: DBConfig) => void
  loading: boolean
  error: string
  compact: boolean
  onReset: () => void
  onReconnect?: () => void
  showTitle?: boolean
}

export default function ConnectionForm({
  onScan,
  loading,
  error,
  compact,
  onReset,
  onReconnect,
  showTitle = true,
}: ConnectionFormProps) {
  const [form, setForm] = useState<FormState>({
    dbType: 'mysql',
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: '',
  })

  useEffect(() => {
    window.__fillForm = (conn: RecentConnection) => {
      setForm((f) => ({ ...f, ...conn, password: '' }))
    }
    return () => {
      delete window.__fillForm
    }
  }, [])

  const set = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => {
      const next = { ...f, [name]: value } as FormState
      if (name === 'dbType') {
        const dbType = value as 'mysql' | 'postgres'
        next.port = DEFAULTS[dbType].port
        next.user = DEFAULTS[dbType].user
      }
      return next
    })
  }

  const setDbType = (value: 'mysql' | 'postgres') => {
    setForm((f) => ({
      ...f,
      dbType: value,
      port: DEFAULTS[value].port,
      user: DEFAULTS[value].user,
    }))
  }

  if (compact)
    return (
      <div className="p-3.5 px-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <CircleDot className="size-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">
            {form.database || 'Connected'}
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={onReconnect ?? onReset}
            className="h-6 px-2 text-[11px]"
          >
            재연결
          </Button>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {form.dbType === 'postgres' ? 'PostgreSQL' : 'MySQL'} · {form.host}:{form.port}
        </div>
      </div>
    )

  return (
    <form onSubmit={(e) => { e.preventDefault(); onScan(form) }} className="px-5 pb-6">
      {showTitle && (
        <>
          <h2 className="text-xl font-semibold mb-2">DB 연결</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            연결 정보를 입력하면 스키마를 스캔해 ERD를 생성합니다.
          </p>
        </>
      )}

      <div className="mb-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2.5 block">
          DB 종류
        </Label>
        <Select value={form.dbType} onValueChange={setDbType}>
          <SelectTrigger className="h-10 py-2.5 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mysql">MySQL / MariaDB</SelectItem>
            <SelectItem value="postgres">PostgreSQL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-4">
        <Field label="Host" name="host" value={form.host} onChange={set} placeholder="localhost" />
        <Field label="Port" name="port" value={form.port} onChange={set} />
      </div>
      <Field label="User" name="user" value={form.user} onChange={set} />
      <Field label="Password" name="password" type="password" value={form.password} onChange={set} />
      <Field label="Database" name="database" value={form.database} onChange={set} placeholder="mydb" />

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl text-destructive p-2.5 text-[11px] font-mono mb-4 backdrop-blur-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !form.database}
        className={cn('w-full h-11 font-semibold text-sm mt-2 gap-2', !form.database && 'opacity-50')}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ScanLine className="size-4" />
        )}
        {loading ? '스캔 중...' : '스캔 → ERD 생성'}
      </Button>
    </form>
  )
}

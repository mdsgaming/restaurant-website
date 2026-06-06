// Firestore REST API helpers — Edge Runtime compatible (no gRPC/Node.js deps)

type FsVal = Record<string, unknown>

function base() {
  const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!id) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  return `https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents`
}

function docId(name: string): string {
  return name.split('/').pop()!
}

function hdrs(token?: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

function fromVal(v: FsVal): unknown {
  if ('nullValue' in v) return null
  if ('booleanValue' in v) return v.booleanValue as boolean
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue as number
  if ('timestampValue' in v) return v.timestampValue as string
  if ('stringValue' in v) return v.stringValue as string
  if ('bytesValue' in v) return v.bytesValue as string
  if ('referenceValue' in v) return v.referenceValue as string
  if ('arrayValue' in v) {
    const arr = v.arrayValue as { values?: FsVal[] }
    return (arr.values ?? []).map(fromVal)
  }
  if ('mapValue' in v) {
    const map = v.mapValue as { fields?: Record<string, FsVal> }
    return fromFields(map.fields ?? {})
  }
  return null
}

function fromFields(fields: Record<string, FsVal>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) out[k] = fromVal(v)
  return out
}

function toVal(v: unknown): FsVal {
  if (v === null || v === undefined) return { nullValue: 'NULL_VALUE' }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: String(v) }
    return { doubleValue: v }
  }
  if (typeof v === 'string') return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } }
  if (typeof v === 'object') {
    const fields: Record<string, FsVal> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      fields[k] = toVal(val)
    }
    return { mapValue: { fields } }
  }
  return { nullValue: 'NULL_VALUE' }
}

function toFields(obj: Record<string, unknown>): Record<string, FsVal> {
  const fields: Record<string, FsVal> = {}
  for (const [k, v] of Object.entries(obj)) fields[k] = toVal(v)
  return fields
}

export interface FsDoc {
  id: string
  exists: boolean
  data: () => Record<string, unknown>
}

export async function fsGet(path: string, token?: string): Promise<FsDoc> {
  const res = await fetch(`${base()}/${path}`, { headers: hdrs(token) })
  if (res.status === 404) {
    return { id: path.split('/').pop()!, exists: false, data: () => ({}) }
  }
  if (!res.ok) throw new Error(`fsGet ${path}: ${res.status} ${await res.text()}`)
  const doc = await res.json() as { name: string; fields?: Record<string, FsVal> }
  return {
    id: docId(doc.name),
    exists: true,
    data: () => fromFields(doc.fields ?? {}),
  }
}

export async function fsSet(path: string, data: Record<string, unknown>, token: string): Promise<void> {
  const res = await fetch(`${base()}/${path}`, {
    method: 'PATCH',
    headers: hdrs(token),
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`fsSet ${path}: ${res.status} ${await res.text()}`)
}

export async function fsUpdate(path: string, data: Record<string, unknown>, token: string): Promise<void> {
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const res = await fetch(`${base()}/${path}?${mask}`, {
    method: 'PATCH',
    headers: hdrs(token),
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`fsUpdate ${path}: ${res.status} ${await res.text()}`)
}

export async function fsAdd(collectionPath: string, data: Record<string, unknown>, token: string): Promise<{ id: string }> {
  const res = await fetch(`${base()}/${collectionPath}`, {
    method: 'POST',
    headers: hdrs(token),
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`fsAdd ${collectionPath}: ${res.status} ${await res.text()}`)
  const doc = await res.json() as { name: string }
  return { id: docId(doc.name) }
}

export async function fsDelete(path: string, token: string): Promise<void> {
  const res = await fetch(`${base()}/${path}`, {
    method: 'DELETE',
    headers: hdrs(token),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`fsDelete ${path}: ${res.status} ${await res.text()}`)
  }
}

export async function fsList(
  collectionPath: string,
  token?: string,
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  const res = await fetch(`${base()}/${collectionPath}`, { headers: hdrs(token) })
  if (!res.ok) throw new Error(`fsList ${collectionPath}: ${res.status} ${await res.text()}`)
  const body = await res.json() as {
    documents?: Array<{ name: string; fields?: Record<string, FsVal> }>
  }
  return (body.documents ?? []).map(doc => ({
    id: docId(doc.name),
    ...fromFields(doc.fields ?? {}),
  }))
}

type WhereOp =
  | 'EQUAL' | 'NOT_EQUAL'
  | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL'
  | 'ARRAY_CONTAINS'
type OrderDir = 'ASCENDING' | 'DESCENDING'

interface QueryOptions {
  where?: Array<[string, WhereOp, unknown]>
  orderBy?: Array<[string, OrderDir]>
  limit?: number
}

export async function fsQuery(
  collectionId: string,
  options: QueryOptions = {},
  token?: string,
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  }

  if (options.where?.length) {
    const filters = options.where.map(([field, op, value]) => ({
      fieldFilter: { field: { fieldPath: field }, op, value: toVal(value) },
    }))
    structuredQuery.where =
      filters.length === 1
        ? filters[0]
        : { compositeFilter: { op: 'AND', filters } }
  }

  if (options.orderBy?.length) {
    structuredQuery.orderBy = options.orderBy.map(([field, direction]) => ({
      field: { fieldPath: field },
      direction,
    }))
  }

  if (options.limit) structuredQuery.limit = options.limit

  const res = await fetch(`${base()}:runQuery`, {
    method: 'POST',
    headers: hdrs(token),
    body: JSON.stringify({ structuredQuery }),
  })
  if (!res.ok) throw new Error(`fsQuery ${collectionId}: ${res.status} ${await res.text()}`)

  const results = await res.json() as Array<{
    document?: { name: string; fields?: Record<string, FsVal> }
  }>
  return results
    .filter(r => r.document)
    .map(r => ({
      id: docId(r.document!.name),
      ...fromFields(r.document!.fields ?? {}),
    }))
}

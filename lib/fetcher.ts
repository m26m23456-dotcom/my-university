export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'تعذر تحميل البيانات')
  return data as T
}

export async function api<T = { ok: boolean }>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'حدث خطأ، حاول مرة أخرى')
  return data as T
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export async function uploadFile(file: File, onProgress: (ratio: number) => void): Promise<string> {
  const mime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '')
  const init = await api<{ id: string; chunkSize: number; chunkCount: number }>('/api/files', 'POST', {
    name: file.name,
    mime,
    size: file.size,
  })
  for (let idx = 0; idx < init.chunkCount; idx++) {
    const chunk = file.slice(idx * init.chunkSize, (idx + 1) * init.chunkSize)
    let attempt = 0
    while (true) {
      const res = await fetch(`/api/files/${init.id}?idx=${idx}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunk,
      })
      if (res.ok) break
      attempt++
      if (attempt >= 3) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `فشل رفع الملف ${file.name}`)
      }
    }
    onProgress((idx + 1) / init.chunkCount)
  }
  return init.id
}

export function fileUrl(id: string, download = false) {
  return `/api/files/${id}${download ? '?download=1' : ''}`
}

'use client'

import { useState, useEffect, useRef } from 'react'
import type { ProjectDoc } from '@/types'
import { useAppStore } from '@/store/appStore'

interface Props {
  projectId: string
}

export function DocsPanel({ projectId }: Props) {
  const { projects, createDoc, updateDoc, deleteDoc } = useAppStore()
  const project = projects.find((p) => p.id === projectId)
  const docs = project?.docs ?? []

  const [activeDocId, setActiveDocId] = useState<string | null>(docs[0]?.id ?? null)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  // Select first doc when docs change
  useEffect(() => {
    if (activeDocId && docs.find((d) => d.id === activeDocId)) return
    setActiveDocId(docs[0]?.id ?? null)
  }, [docs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? null

  async function handleNew() {
    const doc = await createDoc(projectId, '未命名文件')
    setActiveDocId(doc.id)
    setEditingTitle(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  function handleContentBlur(content: string) {
    if (!activeDoc) return
    updateDoc(projectId, { ...activeDoc, content })
  }

  function handleTitleBlur(title: string) {
    if (!activeDoc) return
    updateDoc(projectId, { ...activeDoc, title: title.trim() || '未命名文件' })
    setEditingTitle(false)
  }

  async function handleDelete(docId: string) {
    if (!confirm('刪除這份文件？')) return
    await deleteDoc(projectId, docId)
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <p className="text-xs text-zinc-600 font-mono">還沒有文件</p>
        <button
          onClick={handleNew}
          className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
        >
          + 新增第一份
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Doc list sidebar */}
        <div className="w-44 shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Docs</span>
            <button
              onClick={handleNew}
              className="text-zinc-600 hover:text-[#7c6dfa] text-xs transition-colors"
              title="新增文件"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors ${
                  doc.id === activeDocId
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
                onClick={() => setActiveDocId(doc.id)}
              >
                <span className="flex-1 text-xs font-mono truncate">{doc.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-all shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {activeDoc ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Title */}
            <div className="px-6 py-3 border-b border-zinc-800 shrink-0">
              {editingTitle ? (
                <input
                  ref={titleRef}
                  defaultValue={activeDoc.title}
                  className="w-full bg-transparent text-zinc-100 text-sm font-mono outline-none border-b border-[#7c6dfa] pb-0.5"
                  onBlur={(e) => handleTitleBlur(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleTitleBlur((e.target as HTMLInputElement).value)
                    }
                  }}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2
                    className="text-sm font-mono text-zinc-200 cursor-pointer hover:text-zinc-100 flex-1 truncate"
                    onClick={() => setEditingTitle(true)}
                  >
                    {activeDoc.title}
                  </h2>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="text-zinc-600 hover:text-zinc-400 text-xs"
                  >
                    ✎
                  </button>
                  <span className="text-[10px] font-mono text-zinc-700">
                    {new Date(activeDoc.updatedAt).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              )}
            </div>

            {/* Content textarea */}
            <textarea
              key={activeDoc.id}
              className="flex-1 min-h-0 w-full bg-transparent text-zinc-300 text-sm font-mono leading-relaxed px-6 py-4 outline-none resize-none placeholder:text-zinc-700"
              defaultValue={activeDoc.content}
              placeholder="開始輸入... (支援 Markdown 語法)"
              onBlur={(e) => handleContentBlur(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-zinc-600 font-mono">選擇左側文件</p>
          </div>
        )}
      </div>
    </div>
  )
}

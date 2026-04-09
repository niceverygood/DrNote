'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  BookOpen,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface MedicalTerm {
  id: string
  abbreviation: string
  full_name: string
  korean_name: string | null
  category: string
  description: string | null
  is_active: boolean
}

const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'disease', label: '질환' },
  { value: 'anatomy', label: '해부학' },
  { value: 'examination', label: '검사' },
  { value: 'procedure', label: '수술/시술' },
  { value: 'treatment', label: '치료' },
  { value: 'imaging', label: '영상검사' },
  { value: 'abbreviation', label: '약어' },
  { value: 'general', label: '일반' },
]

export default function DictionaryPage() {
  const [terms, setTerms] = useState<MedicalTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MedicalTerm>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTerm, setNewTerm] = useState<Partial<MedicalTerm>>({
    category: 'general'
  })

  const fetchTerms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (search) params.set('search', search)

      const response = await fetch(`/api/dictionary?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTerms(data.terms)
      } else {
        toast.error(data.error || '용어 조회 실패')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('서버 연결 실패')
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  const handleAdd = async () => {
    if (!newTerm.abbreviation || !newTerm.full_name) {
      toast.error('약어와 전체 명칭은 필수입니다.')
      return
    }

    try {
      const response = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTerm),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('용어가 추가되었습니다.')
        setShowAddForm(false)
        setNewTerm({ category: 'general' })
        fetchTerms()
      } else {
        toast.error(data.error || '추가 실패')
      }
    } catch (error) {
      console.error('Add error:', error)
      toast.error('서버 오류')
    }
  }

  const handleEdit = (term: MedicalTerm) => {
    setEditingId(term.id)
    setEditForm(term)
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      const response = await fetch(`/api/dictionary/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('수정되었습니다.')
        setEditingId(null)
        setEditForm({})
        fetchTerms()
      } else {
        toast.error(data.error || '수정 실패')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('서버 오류')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/dictionary/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('삭제되었습니다.')
        fetchTerms()
      } else {
        const data = await response.json()
        toast.error(data.error || '삭제 실패')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('서버 오류')
    }
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      disease: 'bg-red-100 text-red-700',
      anatomy: 'bg-blue-100 text-blue-700',
      examination: 'bg-green-100 text-green-700',
      procedure: 'bg-purple-100 text-purple-700',
      treatment: 'bg-amber-100 text-amber-700',
      imaging: 'bg-cyan-100 text-cyan-700',
      abbreviation: 'bg-gray-100 text-gray-700',
      general: 'bg-slate-100 text-slate-700',
    }
    return colors[cat] || colors.general
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h1 className="font-semibold text-gray-900">의학 용어 사전</h1>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            용어 추가
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="약어, 명칭, 한글명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 text-sm text-gray-500">
          총 <span className="font-semibold text-gray-900">{terms.length}</span>개의 용어
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card-elevated p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">새 용어 추가</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="약어 (예: HNP)"
                value={newTerm.abbreviation || ''}
                onChange={(e) => setNewTerm({ ...newTerm, abbreviation: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="전체 명칭 (영문)"
                value={newTerm.full_name || ''}
                onChange={(e) => setNewTerm({ ...newTerm, full_name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="한글명"
                value={newTerm.korean_name || ''}
                onChange={(e) => setNewTerm({ ...newTerm, korean_name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={newTerm.category || 'general'}
                onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="설명 (선택)"
                value={newTerm.description || ''}
                onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleAdd} className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>
        )}

        {/* Terms Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              로딩 중...
            </div>
          ) : terms.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              등록된 용어가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      약어
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      전체 명칭
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      한글명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      분류
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {terms.map((term) => (
                    <tr key={term.id} className="hover:bg-gray-50">
                      {editingId === term.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.abbreviation || ''}
                              onChange={(e) => setEditForm({ ...editForm, abbreviation: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.full_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.korean_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, korean_name: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editForm.category || 'general'}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            >
                              {CATEGORIES.slice(1).map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleSave}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditForm({})
                                }}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-teal-700">
                              {term.abbreviation}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {term.full_name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {term.korean_name || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(term.category)}`}>
                              {CATEGORIES.find(c => c.value === term.category)?.label || term.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                            {term.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(term)}
                                className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(term.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

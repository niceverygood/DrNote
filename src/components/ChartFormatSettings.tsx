'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChartFormatConfig, ChartFieldConfig } from '@/types/database'
import { DEFAULT_CHART_FORMAT } from '@/types/database'

const STORAGE_KEY = 'drnote-chart-format'

const BADGE_COLOR_OPTIONS = [
  { label: '파랑', value: 'bg-blue-100 text-blue-700' },
  { label: '초록', value: 'bg-green-100 text-green-700' },
  { label: '노랑', value: 'bg-amber-100 text-amber-700' },
  { label: '보라', value: 'bg-purple-100 text-purple-700' },
  { label: '빨강', value: 'bg-red-100 text-red-700' },
  { label: '분홍', value: 'bg-pink-100 text-pink-700' },
  { label: '하늘', value: 'bg-cyan-100 text-cyan-700' },
  { label: '회색', value: 'bg-gray-200 text-gray-600' },
]

export function loadChartFormat(): ChartFormatConfig {
  if (typeof window === 'undefined') return DEFAULT_CHART_FORMAT
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ChartFormatConfig
      // Merge with defaults to handle new fields added in updates
      return {
        ...DEFAULT_CHART_FORMAT,
        ...parsed,
        fields: parsed.fields || DEFAULT_CHART_FORMAT.fields,
      }
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_CHART_FORMAT
}

function saveChartFormat(config: ChartFormatConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

interface ChartFormatSettingsProps {
  onConfigChange: (config: ChartFormatConfig) => void
  currentConfig: ChartFormatConfig
}

export function ChartFormatSettings({ onConfigChange, currentConfig }: ChartFormatSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ChartFormatConfig>(currentConfig)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    setConfig(currentConfig)
  }, [currentConfig])

  const handleSave = useCallback(() => {
    saveChartFormat(config)
    onConfigChange(config)
    setIsOpen(false)
    toast.success('차트 포맷 설정이 저장되었습니다')
  }, [config, onConfigChange])

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CHART_FORMAT)
    saveChartFormat(DEFAULT_CHART_FORMAT)
    onConfigChange(DEFAULT_CHART_FORMAT)
    toast.success('기본 설정으로 복원되었습니다')
  }, [onConfigChange])

  const toggleField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, enabled: !f.enabled } : f
      ),
    }))
  }

  const updateField = (index: number, updates: Partial<ChartFieldConfig>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, ...updates } : f
      ),
    }))
  }

  const addCustomField = () => {
    const newField: ChartFieldConfig = {
      key: `custom_${Date.now()}`,
      label: '새 필드',
      badge: 'C',
      badgeColor: 'bg-cyan-100 text-cyan-700',
      enabled: true,
      promptHint: '',
      isCustom: true,
      type: 'text',
    }
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
  }

  const removeField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }))
  }

  // Drag and drop reorder
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const newDragIndex = index
    setConfig(prev => {
      const fields = [...prev.fields]
      const [removed] = fields.splice(dragIndex, 1)
      fields.splice(newDragIndex, 0, removed)
      return { ...prev, fields }
    })
    setDragIndex(newDragIndex)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const enabledCount = config.fields.filter(f => f.enabled).length

  return (
    <>
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="차트 포맷 설정"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">포맷 설정</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">차트 포맷 설정</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  표시할 필드, 순서, 라벨을 자유롭게 설정하세요
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Field List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    차트 필드 ({enabledCount}개 활성)
                  </h3>
                  <button
                    onClick={addCustomField}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    필드 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {config.fields.map((field, index) => (
                    <div
                      key={field.key}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group border rounded-xl p-4 transition-all ${
                        field.enabled
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                      } ${dragIndex === index ? 'ring-2 ring-teal-400 shadow-lg' : ''}`}
                    >
                      {/* Field Header */}
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${field.badgeColor}`}>
                          {field.badge}
                        </span>

                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-teal-500 focus:outline-none px-1 py-0.5 transition-colors"
                        />

                        <button
                          onClick={() => toggleField(index)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            field.enabled
                              ? 'text-teal-600 hover:bg-teal-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={field.enabled ? '숨기기' : '보이기'}
                        >
                          {field.enabled ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {field.isCustom && (
                          <button
                            onClick={() => removeField(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Field Details (expandable) */}
                      {field.enabled && (
                        <div className="mt-3 pl-7 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 w-16 shrink-0">뱃지</label>
                            <input
                              type="text"
                              value={field.badge}
                              onChange={(e) => updateField(index, { badge: e.target.value.slice(0, 4) })}
                              maxLength={4}
                              className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <select
                              value={field.badgeColor}
                              onChange={(e) => updateField(index, { badgeColor: e.target.value })}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              {BADGE_COLOR_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(index, { type: e.target.value as 'text' | 'list' })}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              <option value="text">텍스트</option>
                              <option value="list">리스트</option>
                            </select>
                          </div>

                          <div className="flex items-start gap-2">
                            <label className="text-xs text-gray-500 w-16 shrink-0 mt-1.5">AI 지시</label>
                            <textarea
                              value={field.promptHint}
                              onChange={(e) => updateField(index, { promptHint: e.target.value })}
                              placeholder="예: 영문 약어 위주로 작성, 한 줄로 요약..."
                              rows={2}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Prompt */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">전체 추가 지시사항</h3>
                <textarea
                  value={config.globalPrompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, globalPrompt: e.target.value }))}
                  placeholder="예: 모든 진단에 r/o를 붙여주세요, 치료 계획은 영문으로 작성..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">미리보기</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  {config.fields
                    .filter(f => f.enabled)
                    .map((field) => (
                      <div key={field.key} className="px-4 py-3 border-b border-gray-100 last:border-b-0 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${field.badgeColor}`}>
                          {field.badge}
                        </span>
                        <span className="text-sm text-gray-700">{field.label}</span>
                        {field.promptHint && (
                          <span className="text-xs text-gray-400 ml-auto italic truncate max-w-[200px]">
                            {field.promptHint}
                          </span>
                        )}
                      </div>
                    ))}
                  {config.fields.filter(f => f.enabled).length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      활성화된 필드가 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                기본값 복원
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

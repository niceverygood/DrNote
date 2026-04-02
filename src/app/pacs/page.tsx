'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  Loader2,
  Settings,
  Monitor,
  Scan,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Download,
  Copy,
  Check,
  FileImage,
  Server,
  FolderOpen,
  X,
  Sun,
  Moon,
  Move,
  Maximize2,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { parseDicom, renderDicomToCanvas, canvasToBlob, formatDicomDate } from '@/lib/dicom/viewer'
import type { DicomImage } from '@/lib/dicom/viewer'

interface PacsConfig {
  url: string
  name: string
}

interface ViewerState {
  zoom: number
  windowCenter: number
  windowWidth: number
  rotation: number
  inverted: boolean
}

// PACS 서버 프리셋 (공개 테스트 서버)
const DEMO_PACS: PacsConfig[] = [
  { url: 'https://demo.orthanc-server.com/dicom-web', name: 'Orthanc Demo' },
]

export default function PacsPage() {
  const [dicomImage, setDicomImage] = useState<DicomImage | null>(null)
  const [viewerState, setViewerState] = useState<ViewerState>({
    zoom: 1,
    windowCenter: 127,
    windowWidth: 256,
    rotation: 0,
    inverted: false,
  })
  const [loading, setLoading] = useState(false)
  const [showPacsConfig, setShowPacsConfig] = useState(false)
  const [pacsUrl, setPacsUrl] = useState('')
  const [pacsName, setPacsName] = useState('')
  const [pacsServers, setPacsServers] = useState<PacsConfig[]>(DEMO_PACS)
  const [, setStudies] = useState<Record<string, string>[]>([])
  const [loadingStudies, setLoadingStudies] = useState(false)
  const [fileName, setFileName] = useState('')
  const [copiedAction, setCopiedAction] = useState<string | null>(null)

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [isWLDragging, setIsWLDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DICOM 렌더링
  useEffect(() => {
    if (dicomImage && canvasRef.current) {
      renderDicomToCanvas(
        canvasRef.current,
        dicomImage,
        viewerState.windowCenter,
        viewerState.windowWidth,
      )
    }
  }, [dicomImage, viewerState.windowCenter, viewerState.windowWidth])

  // DICOM 파일 로드
  const loadDicomFile = useCallback(async (file: File) => {
    setLoading(true)
    setFileName(file.name)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const image = parseDicom(arrayBuffer)

      setDicomImage(image)
      setViewerState({
        zoom: 1,
        windowCenter: image.metadata.windowCenter || (image.minPixel + image.maxPixel) / 2,
        windowWidth: image.metadata.windowWidth || (image.maxPixel - image.minPixel),
        rotation: 0,
        inverted: false,
      })

      toast.success(`DICOM 로드 완료: ${image.metadata.columns}x${image.metadata.rows}`)
    } catch (error) {
      console.error('DICOM parse error:', error)
      toast.error('DICOM 파일을 읽을 수 없습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  // 드래그 앤 드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadDicomFile(file)
  }, [loadDicomFile])

  // PACS 서버에서 Study 목록 조회
  const fetchStudies = useCallback(async (serverUrl: string) => {
    setLoadingStudies(true)
    try {
      const response = await fetch(`/api/pacs?action=studies&pacsUrl=${encodeURIComponent(serverUrl)}&limit=20`)
      const data = await response.json()

      if (data.success && data.data) {
        setStudies(data.data)
        toast.success(`${data.data.length}개의 Study를 불러왔습니다`)
      } else {
        toast.error(data.error || 'Study 목록 조회 실패')
      }
    } catch {
      toast.error('PACS 서버에 연결할 수 없습니다')
    } finally {
      setLoadingStudies(false)
    }
  }, [])

  // PACS 서버 추가
  const addPacsServer = () => {
    if (!pacsUrl) return
    const newServer: PacsConfig = { url: pacsUrl, name: pacsName || pacsUrl }
    setPacsServers([...pacsServers, newServer])
    setPacsUrl('')
    setPacsName('')
    toast.success('PACS 서버가 추가되었습니다')
  }

  // 캡처 → AI 분석으로 전송
  const captureForAnalysis = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      const blob = await canvasToBlob(canvasRef.current)
      // Blob을 sessionStorage에 임시 저장 후 /imaging으로 이동
      const reader = new FileReader()
      reader.onload = () => {
        sessionStorage.setItem('pacs_capture', reader.result as string)
        sessionStorage.setItem('pacs_metadata', JSON.stringify(dicomImage?.metadata))
        window.location.href = '/imaging'
      }
      reader.readAsDataURL(blob)
    } catch {
      toast.error('캡처 실패')
    }
  }, [dicomImage])

  // 캡처 → 클립보드 복사
  const captureToClipboard = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      const blob = await canvasToBlob(canvasRef.current)
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopiedAction('clipboard')
      setTimeout(() => setCopiedAction(null), 2000)
      toast.success('영상이 클립보드에 복사되었습니다')
    } catch {
      toast.error('클립보드 복사 실패')
    }
  }, [])

  // 캡처 → PNG 다운로드
  const captureDownload = useCallback(() => {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.download = `${fileName.replace('.dcm', '')}_capture.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    toast.success('PNG 다운로드 완료')
  }, [fileName])

  // W/L 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || e.ctrlKey) {
      // 우클릭 또는 Ctrl+클릭: Window/Level 조정
      e.preventDefault()
      setIsWLDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isWLDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setViewerState(prev => ({
        ...prev,
        windowWidth: Math.max(1, prev.windowWidth + dx * 2),
        windowCenter: prev.windowCenter + dy * 2,
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isWLDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsWLDragging(false)
  }, [])

  // Window 프리셋
  const applyWindowPreset = (center: number, width: number) => {
    setViewerState(prev => ({ ...prev, windowCenter: center, windowWidth: width }))
  }

  const metadata = dicomImage?.metadata

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
        <div className="max-w-full mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/demo" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Monitor className="w-5 h-5 text-teal-400" />
            <h1 className="text-sm font-semibold">PACS Viewer</h1>
            {fileName && (
              <span className="text-xs text-gray-400 ml-2">{fileName}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPacsConfig(!showPacsConfig)}
              className={`p-2 rounded transition-colors ${showPacsConfig ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
              title="PACS 설정"
            >
              <Server className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="DICOM 파일 열기"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".dcm,.dicom,application/dicom"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) loadDicomFile(file)
              }}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-48px)]">
        {/* PACS Config Sidebar */}
        {showPacsConfig && (
          <div className="w-72 border-r border-gray-700 bg-gray-850 overflow-y-auto flex-shrink-0" style={{ backgroundColor: '#1a1d23' }}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                PACS 서버 설정
              </h3>

              {/* 서버 추가 */}
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="서버 이름"
                  value={pacsName}
                  onChange={(e) => setPacsName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="DICOMweb URL (예: https://pacs.hospital.com/dicom-web)"
                  value={pacsUrl}
                  onChange={(e) => setPacsUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  onClick={addPacsServer}
                  className="w-full px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                >
                  서버 추가
                </button>
              </div>

              {/* 서버 목록 */}
              <div className="space-y-2">
                {pacsServers.map((server, i) => (
                  <div key={i} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-teal-400">{server.name}</span>
                      <button
                        onClick={() => setPacsServers(pacsServers.filter((_, idx) => idx !== i))}
                        className="p-0.5 hover:bg-gray-700 rounded"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mb-2">{server.url}</p>
                    <button
                      onClick={() => fetchStudies(server.url)}
                      disabled={loadingStudies}
                      className="w-full px-2 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      {loadingStudies ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                      Study 목록 조회
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-500">
                  병원 PACS의 DICOMweb (WADO-RS) URL을 입력하세요. 또는 로컬 DICOM 파일을 직접 열 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          {dicomImage && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-700 bg-gray-800">
              {/* Zoom */}
              <ToolButton
                icon={<ZoomOut className="w-3.5 h-3.5" />}
                onClick={() => setViewerState(v => ({ ...v, zoom: Math.max(0.1, v.zoom - 0.25) }))}
                title="축소"
              />
              <span className="text-[10px] text-gray-400 min-w-[40px] text-center">
                {Math.round(viewerState.zoom * 100)}%
              </span>
              <ToolButton
                icon={<ZoomIn className="w-3.5 h-3.5" />}
                onClick={() => setViewerState(v => ({ ...v, zoom: v.zoom + 0.25 }))}
                title="확대"
              />
              <ToolButton
                icon={<Maximize2 className="w-3.5 h-3.5" />}
                onClick={() => setViewerState(v => ({ ...v, zoom: 1 }))}
                title="맞춤"
              />

              <div className="w-px h-5 bg-gray-600 mx-1" />

              {/* Rotation */}
              <ToolButton
                icon={<RotateCw className="w-3.5 h-3.5" />}
                onClick={() => setViewerState(v => ({ ...v, rotation: (v.rotation + 90) % 360 }))}
                title="90도 회전"
              />

              {/* Invert */}
              <ToolButton
                icon={viewerState.inverted ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setViewerState(v => ({ ...v, inverted: !v.inverted }))
                  if (dicomImage && canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                      ctx.filter = viewerState.inverted ? 'invert(0)' : 'invert(1)'
                      ctx.drawImage(canvasRef.current, 0, 0)
                    }
                  }
                }}
                title="반전"
                active={viewerState.inverted}
              />

              <div className="w-px h-5 bg-gray-600 mx-1" />

              {/* Window Presets */}
              <span className="text-[10px] text-gray-500 mr-1">W/L:</span>
              <ToolButton
                icon={<Contrast className="w-3.5 h-3.5" />}
                onClick={() => applyWindowPreset(40, 400)}
                title="Bone"
                label="Bone"
              />
              <ToolButton
                icon={<Contrast className="w-3.5 h-3.5" />}
                onClick={() => applyWindowPreset(40, 80)}
                title="Soft Tissue"
                label="Soft"
              />
              <ToolButton
                icon={<Move className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (dicomImage) {
                    applyWindowPreset(
                      dicomImage.metadata.windowCenter || (dicomImage.minPixel + dicomImage.maxPixel) / 2,
                      dicomImage.metadata.windowWidth || (dicomImage.maxPixel - dicomImage.minPixel),
                    )
                  }
                }}
                title="기본값"
                label="Default"
              />

              <div className="flex-1" />

              {/* Capture Actions */}
              <button
                onClick={captureForAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 rounded transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                AI 분석
              </button>
              <ToolButton
                icon={copiedAction === 'clipboard' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={captureToClipboard}
                title="클립보드 복사"
              />
              <ToolButton
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={captureDownload}
                title="PNG 다운로드"
              />
            </div>
          )}

          {/* Canvas Area */}
          <div
            className="flex-1 overflow-hidden flex items-center justify-center bg-black relative"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-teal-500/20 border-2 border-dashed border-teal-400 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-teal-400 mx-auto mb-2" />
                  <p className="text-teal-300 font-medium">DICOM 파일을 여기에 놓으세요</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">DICOM 파일 로딩 중...</p>
              </div>
            )}

            {!dicomImage && !loading && (
              <div
                className="text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-medium mb-1">DICOM 파일을 열거나 드래그하세요</p>
                <p className="text-xs text-gray-600">
                  .dcm 파일 지원 | 우클릭 드래그로 Window/Level 조절
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="mt-4 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  파일 선택
                </button>
              </div>
            )}

            {dicomImage && (
              <div
                style={{
                  transform: `scale(${viewerState.zoom}) rotate(${viewerState.rotation}deg)`,
                  filter: viewerState.inverted ? 'invert(1)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[calc(100vh-120px)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            )}

            {/* Overlay Info */}
            {dicomImage && metadata && (
              <>
                {/* Top-left */}
                <div className="absolute top-3 left-3 text-[10px] text-gray-400 leading-relaxed">
                  <p>{metadata.patientName || 'Unknown'}</p>
                  <p>{metadata.patientId} | {metadata.patientAge} | {metadata.patientSex}</p>
                  <p>{formatDicomDate(metadata.studyDate)}</p>
                </div>

                {/* Top-right */}
                <div className="absolute top-3 right-3 text-[10px] text-gray-400 leading-relaxed text-right">
                  <p>{metadata.institutionName}</p>
                  <p>{metadata.modality} | {metadata.bodyPart}</p>
                  <p>{metadata.columns} x {metadata.rows}</p>
                </div>

                {/* Bottom-left */}
                <div className="absolute bottom-3 left-3 text-[10px] text-gray-400">
                  <p>WC: {Math.round(viewerState.windowCenter)} | WW: {Math.round(viewerState.windowWidth)}</p>
                  <p>Zoom: {Math.round(viewerState.zoom * 100)}%</p>
                </div>

                {/* Bottom-right */}
                <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 text-right">
                  <p>{metadata.studyDescription}</p>
                  <p>{metadata.seriesDescription}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Metadata */}
        {dicomImage && metadata && (
          <div className="w-64 border-l border-gray-700 overflow-y-auto flex-shrink-0" style={{ backgroundColor: '#1a1d23' }}>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Patient Info</h3>
              <MetaField label="이름" value={metadata.patientName} />
              <MetaField label="ID" value={metadata.patientId} />
              <MetaField label="나이" value={metadata.patientAge} />
              <MetaField label="성별" value={metadata.patientSex} />

              <h3 className="text-xs font-semibold text-gray-400 mb-3 mt-5 uppercase tracking-wider">Study Info</h3>
              <MetaField label="날짜" value={formatDicomDate(metadata.studyDate)} />
              <MetaField label="설명" value={metadata.studyDescription} />
              <MetaField label="시리즈" value={metadata.seriesDescription} />
              <MetaField label="모달리티" value={metadata.modality} />
              <MetaField label="부위" value={metadata.bodyPart} />
              <MetaField label="기관" value={metadata.institutionName} />

              <h3 className="text-xs font-semibold text-gray-400 mb-3 mt-5 uppercase tracking-wider">Image Info</h3>
              <MetaField label="크기" value={`${metadata.columns} x ${metadata.rows}`} />
              <MetaField label="Bits" value={`${metadata.bitsAllocated} / ${metadata.bitsStored}`} />
              <MetaField label="WC / WW" value={`${Math.round(viewerState.windowCenter)} / ${Math.round(viewerState.windowWidth)}`} />
              <MetaField label="Photometric" value={metadata.photometricInterpretation} />

              {/* Quick Actions */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={captureForAnalysis}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  <Scan className="w-4 h-4" />
                  AI 영상 분석으로 보내기
                </button>
                <button
                  onClick={captureToClipboard}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  영상 캡처 복사
                </button>
                <button
                  onClick={captureDownload}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PNG 다운로드
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolButton({
  icon,
  onClick,
  title,
  label,
  active,
}: {
  icon: React.ReactNode
  onClick: () => void
  title: string
  label?: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
        active
          ? 'bg-teal-600/30 text-teal-300'
          : 'hover:bg-gray-700 text-gray-300'
      }`}
    >
      {icon}
      {label && <span className="text-[10px]">{label}</span>}
    </button>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="mb-2">
      <span className="text-[10px] text-gray-500">{label}</span>
      <p className="text-xs text-gray-300 truncate">{value}</p>
    </div>
  )
}

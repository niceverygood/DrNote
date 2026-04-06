'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { Mic, Square, Pause, Play, RotateCcw, Upload, Sparkles } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete: (transcript: string) => void  // 음성인식된 텍스트 전달
  onAudioReady?: (blob: Blob) => void                // 레거시 호환 (파일 업로드용)
  disabled?: boolean
  autoSubmit?: boolean
}

const RECORDING_BAR_HEIGHTS = [22, 28, 18, 30, 24]

export function AudioRecorder({ onRecordingComplete, onAudioReady, disabled, autoSubmit = true }: AudioRecorderProps) {
  const {
    state,
    duration,
    audioUrl,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  } = useAudioRecorder()

  // 녹음 종료 시 자동으로 분석 시작
  const prevStateRef = useRef(state)
  useEffect(() => {
    const wasRecordingOrPaused = prevStateRef.current === 'recording' || prevStateRef.current === 'paused'
    if (autoSubmit && wasRecordingOrPaused && state === 'stopped' && transcript) {
      onRecordingComplete(transcript)
    }
    prevStateRef.current = state
  }, [state, transcript, autoSubmit, onRecordingComplete])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = useCallback(() => {
    if (transcript) {
      onRecordingComplete(transcript)
    }
  }, [transcript, onRecordingComplete])

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && onAudioReady) {
        onAudioReady(file)
      }
    },
    [onAudioReady]
  )

  return (
    <div className="card-elevated p-10">
      <div className="flex flex-col items-center gap-8">
        {/* Recorder Visual */}
        <div className="relative">
          {state === 'recording' && (
            <div className="absolute -inset-4 rounded-full bg-red-100 animate-pulse-recording" />
          )}
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all ${
            state === 'recording'
              ? 'bg-red-500'
              : state === 'paused'
                ? 'bg-amber-500'
                : state === 'stopped'
                  ? 'gradient-primary'
                  : 'bg-gray-100'
          }`}>
            {state === 'idle' && <Mic className="w-10 h-10 text-gray-400" />}
            {state === 'recording' && (
              <div className="flex items-center gap-1">
                {RECORDING_BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i + 1) * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {state === 'paused' && <Pause className="w-10 h-10 text-white" />}
            {state === 'stopped' && <Sparkles className="w-10 h-10 text-white" />}
          </div>
        </div>

        {/* Duration */}
        <div className={`text-5xl font-semibold tabular-nums tracking-tight ${
          state === 'recording' ? 'text-red-500' : 'text-gray-900'
        }`}>
          {formatDuration(duration)}
        </div>

        {/* 실시간 자막 */}
        {(state === 'recording' || state === 'paused') && (transcript || interimTranscript) && (
          <div className="w-full max-w-lg px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-1">실시간 음성인식</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400">{transcript ? ' ' : ''}{interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {/* Status Text */}
        {state === 'recording' && (
          <div className="flex items-center gap-2 text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">녹음 중</span>
          </div>
        )}
        {state === 'paused' && (
          <p className="text-sm font-medium text-amber-600">일시 정지됨</p>
        )}
        {state === 'stopped' && (
          <p className="text-sm font-medium text-teal-600">
            {autoSubmit ? '녹음 완료 — AI 분석 시작 중...' : '녹음 완료 — AI 분석을 시작하세요'}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {state === 'idle' && (
            <>
              <button
                onClick={startRecording}
                disabled={disabled}
                className="btn-primary px-8 py-4 text-base disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
                녹음 시작
              </button>
              {onAudioReady && (
                <>
                  <span className="text-gray-300">또는</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="btn-secondary px-6 py-4 disabled:opacity-50"
                  >
                    <Upload className="w-5 h-5" />
                    파일 업로드
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </>
          )}

          {state === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Pause className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={stopRecording}
                className="px-8 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 transition-colors"
              >
                <Square className="w-5 h-5" />
                녹음 완료
              </button>
            </>
          )}

          {state === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Play className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={stopRecording}
                className="px-8 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 transition-colors"
              >
                <Square className="w-5 h-5" />
                녹음 완료
              </button>
            </>
          )}

          {state === 'stopped' && audioUrl && (
            <>
              {!autoSubmit && (
                <button
                  onClick={resetRecording}
                  className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-6 h-6 text-gray-700" />
                </button>
              )}
              {!autoSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={disabled || !transcript}
                  className="btn-primary px-8 py-4 text-base disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  AI 분석 시작
                </button>
              )}
            </>
          )}
        </div>

        {/* Audio Preview */}
        {audioUrl && state === 'stopped' && (
          <div className="w-full max-w-md">
            <p className="text-xs text-gray-400 mb-2 text-center">녹음 미리듣기</p>
            <audio src={audioUrl} controls className="w-full h-10" />
          </div>
        )}
      </div>
    </div>
  )
}

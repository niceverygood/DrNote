'use client'

import { useState, useRef, useCallback } from 'react'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

// Web Speech API 타입
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface UseAudioRecorderReturn {
  state: RecordingState
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  transcript: string        // 실시간 음성인식 텍스트
  interimTranscript: string // 중간 인식 결과
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  error: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): (new () => any) | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setInterimTranscript('')
  }, [])

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition()
    if (!SpeechRecognitionClass) {
      console.warn('Web Speech API not supported')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + final
        setTranscript(transcriptRef.current)
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: Event & { error?: string }) => {
      // no-speech 에러는 무시 (말을 안 했을 때)
      if (event.error === 'no-speech') return
      console.error('Speech recognition error:', event.error)
    }

    // 자동 종료 시 재시작 (continuous 모드에서도 끊길 수 있음)
    recognition.onend = () => {
      if (recognitionRef.current) {
        try {
          recognition.start()
        } catch {
          // 이미 시작된 경우 무시
        }
      }
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      chunksRef.current = []
      transcriptRef.current = ''
      setTranscript('')
      setInterimTranscript('')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState('stopped')

        streamRef.current?.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)
      setState('recording')
      setDuration(0)
      startTimer()

      // Web Speech API 음성인식 시작
      startSpeechRecognition()
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다.')
      console.error('Recording error:', err)
    }
  }, [startTimer, startSpeechRecognition])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
      mediaRecorderRef.current.stop()
      stopTimer()
      stopSpeechRecognition()
    }
  }, [state, stopTimer, stopSpeechRecognition])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      stopTimer()
      stopSpeechRecognition()
    }
  }, [state, stopTimer, stopSpeechRecognition])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      startTimer()
      startSpeechRecognition()
    }
  }, [state, startTimer, startSpeechRecognition])

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    stopSpeechRecognition()
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setState('idle')
    setTranscript('')
    setInterimTranscript('')
    transcriptRef.current = ''
    chunksRef.current = []
    setError(null)
  }, [audioUrl, stopSpeechRecognition])

  return {
    state,
    duration,
    audioBlob,
    audioUrl,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  }
}

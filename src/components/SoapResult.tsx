'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SoapNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SoapResultProps {
  soap: SoapNote
  keywords: string[]
  transcript?: string
  rawResponse?: string
}

export function SoapResult({
  soap,
  keywords,
  transcript,
  rawResponse,
}: SoapResultProps) {
  return (
    <div className="space-y-6">
      {/* 키워드 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge key={index} variant="secondary">
              {keyword}
            </Badge>
          ))}
        </div>
      )}

      {/* SOAP 탭 */}
      <Tabs defaultValue="soap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soap">SOAP 차트</TabsTrigger>
          <TabsTrigger value="raw">전체 요약</TabsTrigger>
          {transcript && <TabsTrigger value="transcript">원문</TabsTrigger>}
        </TabsList>

        <TabsContent value="soap" className="space-y-4 mt-4">
          <SoapSection
            label="S"
            title="Subjective"
            content={soap.subjective}
            color="blue"
          />
          <SoapSection
            label="O"
            title="Objective"
            content={soap.objective}
            color="green"
          />
          <SoapSection
            label="A"
            title="Assessment"
            content={soap.assessment}
            color="amber"
          />
          <SoapSection
            label="P"
            title="Plan"
            content={soap.plan}
            color="purple"
          />
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {rawResponse || '요약 내용이 없습니다.'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {transcript && (
          <TabsContent value="transcript" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-500">
                  STT 원문
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{transcript}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function SoapSection({
  label,
  title,
  content,
  color,
}: {
  label: string
  title: string
  content: string
  color: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    purple:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colorClasses[color]}`}
          >
            {label}
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {content || '내용 없음'}
        </div>
      </CardContent>
    </Card>
  )
}

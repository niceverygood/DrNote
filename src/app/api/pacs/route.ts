import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// DICOMweb 프록시 API - CORS 문제를 우회하기 위해 서버에서 PACS에 접근
// GET /api/pacs?action=studies&pacsUrl=https://...
// GET /api/pacs?action=series&pacsUrl=https://...&studyUid=...
// GET /api/pacs?action=instances&pacsUrl=https://...&studyUid=...&seriesUid=...

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const pacsUrl = searchParams.get('pacsUrl')

  if (!pacsUrl) {
    return NextResponse.json({ error: 'PACS URL이 필요합니다.' }, { status: 400 })
  }

  try {
    let url: string

    switch (action) {
      case 'studies': {
        // QIDO-RS: Study 목록 조회
        const limit = searchParams.get('limit') || '20'
        const patientName = searchParams.get('patientName')
        const studyDate = searchParams.get('studyDate')

        url = `${pacsUrl}/studies?limit=${limit}&includefield=all`
        if (patientName) url += `&PatientName=${encodeURIComponent(patientName)}`
        if (studyDate) url += `&StudyDate=${studyDate}`
        break
      }
      case 'series': {
        // QIDO-RS: Series 목록 조회
        const studyUid = searchParams.get('studyUid')
        if (!studyUid) {
          return NextResponse.json({ error: 'studyUid가 필요합니다.' }, { status: 400 })
        }
        url = `${pacsUrl}/studies/${studyUid}/series?includefield=all`
        break
      }
      case 'instances': {
        // QIDO-RS: Instance 목록 조회
        const studyUidI = searchParams.get('studyUid')
        const seriesUid = searchParams.get('seriesUid')
        if (!studyUidI || !seriesUid) {
          return NextResponse.json({ error: 'studyUid와 seriesUid가 필요합니다.' }, { status: 400 })
        }
        url = `${pacsUrl}/studies/${studyUidI}/series/${seriesUid}/instances?includefield=all`
        break
      }
      default:
        return NextResponse.json({ error: '유효하지 않은 action입니다.' }, { status: 400 })
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `PACS 서버 오류: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PACS Proxy Error:', error)
    return NextResponse.json(
      { error: `PACS 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
      { status: 500 }
    )
  }
}

// WADO-RS: 이미지 바이너리 가져오기
export async function POST(request: NextRequest) {
  try {
    const { pacsUrl, studyUid, seriesUid, instanceUid } = await request.json()

    if (!pacsUrl || !studyUid || !seriesUid || !instanceUid) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
    }

    // WADO-RS로 이미지 가져오기
    const url = `${pacsUrl}/studies/${studyUid}/series/${seriesUid}/instances/${instanceUid}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `이미지 로드 실패: ${response.status}` },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return NextResponse.json({
      success: true,
      data: base64,
    })
  } catch (error) {
    console.error('WADO-RS Error:', error)
    return NextResponse.json(
      { error: '이미지 로드 중 오류 발생' },
      { status: 500 }
    )
  }
}

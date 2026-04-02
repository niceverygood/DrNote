import dicomParser from 'dicom-parser'

export interface DicomMetadata {
  patientName: string
  patientId: string
  patientAge: string
  patientSex: string
  studyDate: string
  studyDescription: string
  seriesDescription: string
  modality: string
  bodyPart: string
  institutionName: string
  rows: number
  columns: number
  bitsAllocated: number
  bitsStored: number
  pixelRepresentation: number
  windowCenter: number
  windowWidth: number
  rescaleIntercept: number
  rescaleSlope: number
  photometricInterpretation: string
}

export interface DicomImage {
  metadata: DicomMetadata
  pixelData: Int16Array | Uint16Array | Uint8Array
  minPixel: number
  maxPixel: number
}

function getString(dataSet: dicomParser.DataSet, tag: string): string {
  try {
    return dataSet.string(tag)?.trim() || ''
  } catch {
    return ''
  }
}

function getNumber(dataSet: dicomParser.DataSet, tag: string, defaultValue = 0): number {
  try {
    const val = dataSet.string(tag)
    return val ? parseFloat(val) : defaultValue
  } catch {
    return defaultValue
  }
}

function getUint16(dataSet: dicomParser.DataSet, tag: string, defaultValue = 0): number {
  try {
    return dataSet.uint16(tag) ?? defaultValue
  } catch {
    return defaultValue
  }
}

export function parseDicom(arrayBuffer: ArrayBuffer): DicomImage {
  const byteArray = new Uint8Array(arrayBuffer)
  const dataSet = dicomParser.parseDicom(byteArray)

  const metadata: DicomMetadata = {
    patientName: getString(dataSet, 'x00100010'),
    patientId: getString(dataSet, 'x00100020'),
    patientAge: getString(dataSet, 'x00101010'),
    patientSex: getString(dataSet, 'x00100040'),
    studyDate: getString(dataSet, 'x00080020'),
    studyDescription: getString(dataSet, 'x00081030'),
    seriesDescription: getString(dataSet, 'x0008103e'),
    modality: getString(dataSet, 'x00080060'),
    bodyPart: getString(dataSet, 'x00180015'),
    institutionName: getString(dataSet, 'x00080080'),
    rows: getUint16(dataSet, 'x00280010'),
    columns: getUint16(dataSet, 'x00280011'),
    bitsAllocated: getUint16(dataSet, 'x00280100', 16),
    bitsStored: getUint16(dataSet, 'x00280101', 16),
    pixelRepresentation: getUint16(dataSet, 'x00280103'),
    windowCenter: getNumber(dataSet, 'x00281050', 127),
    windowWidth: getNumber(dataSet, 'x00281051', 256),
    rescaleIntercept: getNumber(dataSet, 'x00281052', 0),
    rescaleSlope: getNumber(dataSet, 'x00281053', 1),
    photometricInterpretation: getString(dataSet, 'x00280004') || 'MONOCHROME2',
  }

  // 픽셀 데이터 추출
  const pixelDataElement = dataSet.elements.x7fe00010
  let pixelData: Int16Array | Uint16Array | Uint8Array

  if (pixelDataElement) {
    const offset = pixelDataElement.dataOffset
    const length = pixelDataElement.length

    if (metadata.bitsAllocated === 16) {
      if (metadata.pixelRepresentation === 1) {
        pixelData = new Int16Array(arrayBuffer, offset, length / 2)
      } else {
        pixelData = new Uint16Array(arrayBuffer, offset, length / 2)
      }
    } else {
      pixelData = new Uint8Array(arrayBuffer, offset, length)
    }
  } else {
    pixelData = new Uint8Array(metadata.rows * metadata.columns)
  }

  // min/max 계산
  let minPixel = Infinity
  let maxPixel = -Infinity
  for (let i = 0; i < pixelData.length; i++) {
    const val = pixelData[i] * metadata.rescaleSlope + metadata.rescaleIntercept
    if (val < minPixel) minPixel = val
    if (val > maxPixel) maxPixel = val
  }

  return { metadata, pixelData, minPixel, maxPixel }
}

export function renderDicomToCanvas(
  canvas: HTMLCanvasElement,
  image: DicomImage,
  windowCenter?: number,
  windowWidth?: number,
): void {
  const { metadata, pixelData } = image
  const { rows, columns, rescaleSlope, rescaleIntercept, photometricInterpretation } = metadata

  canvas.width = columns
  canvas.height = rows

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const wc = windowCenter ?? metadata.windowCenter
  const ww = windowWidth ?? metadata.windowWidth
  const isInverted = photometricInterpretation === 'MONOCHROME1'

  const imageData = ctx.createImageData(columns, rows)
  const data = imageData.data

  const lower = wc - ww / 2
  const upper = wc + ww / 2

  for (let i = 0; i < pixelData.length && i < rows * columns; i++) {
    const rawValue = pixelData[i] * rescaleSlope + rescaleIntercept

    // Window/Level 적용
    let mapped: number
    if (rawValue <= lower) {
      mapped = 0
    } else if (rawValue >= upper) {
      mapped = 255
    } else {
      mapped = ((rawValue - lower) / (upper - lower)) * 255
    }

    if (isInverted) {
      mapped = 255 - mapped
    }

    const idx = i * 4
    data[idx] = mapped     // R
    data[idx + 1] = mapped // G
    data[idx + 2] = mapped // B
    data[idx + 3] = 255    // A
  }

  ctx.putImageData(imageData, 0, 0)
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas to Blob 변환 실패'))
      },
      'image/png',
    )
  })
}

export function formatDicomDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return dateStr
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

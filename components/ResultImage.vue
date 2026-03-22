<template>
  <div class="flex flex-col gap-6 w-full items-center">
    
    <!-- Image & Canvas Container -->
    <div 
      class="relative flex items-center justify-center w-full min-h-[300px] md:min-h-[400px] bg-gray-50 dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden"
      ref="containerRef"
    >
      <div v-if="loading" class="absolute inset-0 z-30 flex items-center justify-center">
        <!-- Gray animated skeleton placeholder -->
        <div class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-zinc-800"></div>
        <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin z-10" />
      </div>

      <!-- We wrap img & canvas in a relative inline-block div so it perfectly encompasses the image size -->
      <div class="relative inline-block max-w-full">
        <img
          v-show="imageUrl"
          ref="imageRef"
          :src="imageUrl"
          class="block max-w-full h-auto max-h-[75vh] object-contain transition-opacity duration-300"
          :class="{ 'opacity-0': loading }"
          alt="Detection output"
          @load="onImageLoad"
          crossorigin="anonymous"
        />
        
        <canvas
          v-show="imageUrl && !loading"
          ref="canvasRef"
          class="absolute top-0 left-0 w-full h-full z-20 pointer-events-auto cursor-crosshair"
          @mousemove="onMouseMove"
          @mouseleave="onMouseLeave"
        ></canvas>
      </div>
      
      <!-- Empty state placeholder if no image and not loading -->
      <div v-if="!imageUrl && !loading" class="flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 gap-3">
        <ImageIcon class="w-12 h-12 opacity-50" />
        <span class="text-sm font-medium">No result image available</span>
      </div>
    </div>

    <!-- Download button -->
    <button
      v-if="imageUrl && !loading"
      @click="downloadImage"
      class="self-center sm:self-end flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 active:scale-95"
    >
      <DownloadIcon class="w-4 h-4" />
      Download Image
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Download as DownloadIcon, Image as ImageIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'

export interface BBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Detection {
  label: string
  confidence: number
  bbox: BBox
}

const props = defineProps<{
  imageUrl?: string
  detections?: Detection[]
  loading?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const hoveredIndex = ref<number | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)

let resizeObserver: ResizeObserver | null = null

// Consistent map for common labels, fallback for custom
const COLOR_MAP: Record<string, string> = {
  'shirt': '#3b82f6', // blue-500
  'pants': '#10b981', // emerald-500
  'dress': '#f43f5e', // rose-500
  'shoe': '#8b5cf6', // violet-500
  'hat': '#f59e0b', // amber-500
  'jacket': '#06b6d4', // cyan-500
  'skirt': '#ec4899', // pink-500
  'bag': '#64748b' // slate-500
}

const getColor = (label: string): string => {
  const normLabel = label.toLowerCase()
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (normLabel.includes(key)) return color
  }
  // Pseudo-random consistent color
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

const hexToRgba = (hex: string, alpha: number) => {
  if (hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex // fallback
}

const setupCanvas = () => {
  const img = imageRef.value
  const canvas = canvasRef.value
  if (!img || !canvas || props.loading) return

  const rect = img.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0 || img.naturalWidth === 0) return

  // Set logical pixels equivalent to physical pixels for crisp edges
  canvas.width = rect.width
  canvas.height = rect.height
  
  drawDetections()
}

const onImageLoad = () => {
  nextTick(() => {
    setupCanvas()
  })
}

// Single function handling all canvas draw instructions
const drawDetections = () => {
  const canvas = canvasRef.value
  const img = imageRef.value
  if (!canvas || !img || !props.detections || img.naturalWidth === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const scaleX = canvas.width / img.naturalWidth
  const scaleY = canvas.height / img.naturalHeight

  // Draw bounding boxes
  props.detections.forEach((det, index) => {
    const x = det.bbox.x1 * scaleX
    const y = det.bbox.y1 * scaleY
    const w = (det.bbox.x2 - det.bbox.x1) * scaleX
    const h = (det.bbox.y2 - det.bbox.y1) * scaleY

    const baseColor = getColor(det.label)
    const isHovered = hoveredIndex.value === index

    ctx.beginPath()
    ctx.rect(x, y, w, h)

    // Semi-transparent inside box
    ctx.fillStyle = isHovered ? hexToRgba(baseColor, 0.45) : hexToRgba(baseColor, 0.15)
    ctx.fill()

    // Stroke outline
    ctx.lineWidth = isHovered ? 3 : 2
    ctx.strokeStyle = baseColor
    ctx.stroke()

    // Label on top left
    const textStr = `${det.label}`
    ctx.font = '600 12px Inter, sans-serif'
    const textWidth = ctx.measureText(textStr).width
    const textHeight = 16 

    // Text box background
    ctx.fillStyle = baseColor
    ctx.fillRect(x, Math.max(0, y - textHeight), textWidth + 8, textHeight)

    // Text itself
    ctx.fillStyle = '#ffffff'
    ctx.fillText(textStr, x + 4, Math.max(textHeight - 4, y - 4))
  })

  // Draw hover tooltip
  if (hoveredIndex.value !== null && props.detections[hoveredIndex.value] && mousePos.value) {
    const det = props.detections[hoveredIndex.value]
    const textStr = `${det.label.toUpperCase()} · ${(det.confidence * 100).toFixed(1)}%`
    
    ctx.font = '500 13px Inter, sans-serif'
    const padding = 10
    const textWidth = ctx.measureText(textStr).width
    
    // Position tooltip safely so it won't clip off canvas
    let tipX = mousePos.value.x + 12
    let tipY = mousePos.value.y + 12
    
    if (tipX + textWidth + padding * 2 > canvas.width) {
      tipX = mousePos.value.x - textWidth - padding * 2 - 12
    }
    if (tipY + 28 > canvas.height) {
      tipY = mousePos.value.y - 28 - 12
    }

    // Tooltip shell
    ctx.fillStyle = 'rgba(17, 24, 39, 0.95)' // gray-900 transparent
    ctx.shadowColor = 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = 4
    
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(tipX, tipY, textWidth + padding * 2, 28, 6)
    } else {
      ctx.rect(tipX, tipY, textWidth + padding * 2, 28)
    }
    ctx.fill()
    ctx.shadowBlur = 0 // Reset
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Tooltip text
    ctx.fillStyle = '#ffffff'
    ctx.fillText(textStr, tipX + padding, tipY + 19)
  }
}

const onMouseMove = (e: MouseEvent) => {
  const canvas = canvasRef.value
  const img = imageRef.value
  if (!canvas || !img || !props.detections || img.naturalWidth === 0) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  mousePos.value = { x: mouseX, y: mouseY }

  const scaleX = canvas.width / img.naturalWidth
  const scaleY = canvas.height / img.naturalHeight

  let foundMatch = null

  // Process in reverse to intersect with topmost drawings first
  for (let i = props.detections.length - 1; i >= 0; i--) {
    const det = props.detections[i]
    const x1 = det.bbox.x1 * scaleX
    const y1 = det.bbox.y1 * scaleY
    const x2 = det.bbox.x2 * scaleX
    const y2 = det.bbox.y2 * scaleY

    if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
      foundMatch = i
      break
    }
  }

  // Update hover state and redraw
  if (hoveredIndex.value !== foundMatch) {
    hoveredIndex.value = foundMatch
    drawDetections()
  } else if (foundMatch !== null) {
    // Force tooltip to follow cursor smoothly
    drawDetections()
  }
}

const onMouseLeave = () => {
  hoveredIndex.value = null
  mousePos.value = null
  drawDetections()
}

const downloadImage = async () => {
  if (!props.imageUrl) return
  
  try {
    // Required to prevent CORS tainted canvas issue on direct blob URL downloads
    const response = await fetch(props.imageUrl)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `clothing_detection_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Failed to download image:', error)
    // Fallback directly to href
    const link = document.createElement('a')
    link.href = props.imageUrl
    link.download = `clothing_detection_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

watch(() => props.detections, () => {
  drawDetections()
}, { deep: true })

watch(() => props.imageUrl, () => {
  hoveredIndex.value = null
})

// Ensures canvas updates if dimensions adjust or responsive thresholds are hit
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    // Decouple to prevent Loop Limit Exceeded warnings
    requestAnimationFrame(() => {
      setupCanvas()
    })
  })
  
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
})
</script>

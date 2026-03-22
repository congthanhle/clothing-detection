import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

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

export interface DetectionResult {
  annotated_image_url: string
  detections: Detection[]
  record_id: string
}

export default function useDetection() {
  const file = ref<File | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const result = ref<DetectionResult | null>(null)

  const config = useRuntimeConfig()

  /**
   * Sets the selected file for detection and clears previous results and errors.
   * @param {File | null} f - The image file to analyze or null to clear.
   */
  const setFile = (f: File | null): void => {
    file.value = f
    result.value = null
    error.value = null
  }

  /**
   * Submits the selected image file to the Django backend for detection.
   * Handles object validation, FormData construction, API submission, and maps HTTP error codes.
   */
  const submitDetection = async (): Promise<void> => {
    if (!file.value || loading.value) return

    loading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('image', file.value)

    try {
      const apiBase = config.public.apiBase
      const response = await $fetch<DetectionResult>(`${apiBase}/api/detect/`, {
        method: 'POST',
        body: formData
      })
      
      result.value = response
    } catch (e: any) {
      const status = e.status || e.response?.status
      if (status === 400) {
        error.value = "Invalid image. Please try another file."
      } else if (status === 500) {
        error.value = "Detection failed on the server."
      } else {
        error.value = "Network error. Is the backend running?"
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Resets the detection flow entirely (clears file, result, and any errors).
   */
  const reset = (): void => {
    file.value = null
    result.value = null
    error.value = null
    loading.value = false
  }

  return {
    file,
    loading,
    error,
    result,
    setFile,
    submitDetection,
    reset
  }
}

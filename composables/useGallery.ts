import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

export interface GalleryImage {
  id: number
  original_image: string
  annotated_image_url: string
  created_at: string
}

export default function useGallery() {
  const images = ref<GalleryImage[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()

  const fetchImages = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const apiBase = config.public.apiBase
      const response = await $fetch<GalleryImage[]>(`${apiBase}/api/images/`)
      images.value = response
    } catch (e: any) {
      error.value = "Failed to load gallery images."
    } finally {
      loading.value = false
    }
  }

  const deleteImage = async (id: number): Promise<void> => {
    try {
      const apiBase = config.public.apiBase
      await $fetch(`${apiBase}/api/images/${id}/`, {
        method: 'DELETE'
      })
      // Remove from list
      images.value = images.value.filter(img => img.id !== id)
    } catch (e: any) {
      error.value = "Failed to delete image."
    }
  }

  return {
    images,
    loading,
    error,
    fetchImages,
    deleteImage
  }
}

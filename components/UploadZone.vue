<template>
  <div 
    class="relative w-full rounded-2xl border-2 border-dashed transition-colors duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    :class="[
      isDragOver ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400 bg-gray-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:bg-zinc-800/50',
      loading ? 'pointer-events-none' : 'cursor-pointer'
    ]"
    role="button"
    aria-label="File upload zone"
    tabindex="0"
    ref="dropZoneRef"
    @click="openFileDialog"
    @keydown.enter.prevent="openFileDialog"
    @keydown.space.prevent="openFileDialog"
  >
    <!-- Loading Overlay -->
    <div 
      v-if="loading" 
      class="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[2px]"
      aria-hidden="true"
    >
      <Loader2Icon class="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
    </div>

    <!-- Preview State -->
    <div v-if="modelValue" class="relative w-full h-full p-4 flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-100">
      <div class="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-gray-200 dark:border-zinc-800">
        <img 
          v-if="previewUrl" 
          :src="previewUrl" 
          alt="Image preview" 
          class="w-full h-full object-contain" 
        />
      </div>
      <div class="text-center truncate w-full max-w-sm px-4">
        <p class="text-sm font-medium truncate" :title="modelValue.name">{{ modelValue.name }}</p>
        <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">{{ formatFileSize(modelValue.size) }}</p>
      </div>
      
      <!-- Clear button (only stop propagation so it doesn't open file dialog) -->
      <button 
        v-if="!loading"
        @click.stop="clearFile"
        class="absolute top-4 right-4 p-1.5 bg-gray-900/50 hover:bg-gray-900/70 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        aria-label="Remove and re-upload"
        title="Remove and re-upload"
      >
        <XIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-12 px-6 text-center text-zinc-900 dark:text-zinc-100">
      <div class="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-sm flex items-center justify-center mb-4 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-700">
        <UploadCloudIcon class="w-6 h-6" />
      </div>
      <h3 class="text-base font-semibold">Drag a photo here or click to browse</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-zinc-400">Supports JPG, PNG, WEBP &middot; Max 10MB</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useDropZone, useFileDialog } from '@vueuse/core'
import { Loader2 as Loader2Icon, X as XIcon, UploadCloud as UploadCloudIcon } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: File | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', file: File | null): void
  (e: 'error', message: string): void
}>()

const dropZoneRef = ref<HTMLElement | null>(null)
const previewUrl = ref<string | null>(null)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Clean up object URL to prevent memory leaks
const cleanupPreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

// Generate new preview URL when modelValue changes
watch(() => props.modelValue, (newFile) => {
  cleanupPreview()
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  cleanupPreview()
})

const processFile = (file: File) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    emit('error', 'Invalid file format. Only JPG, PNG, and WEBP are supported.')
    return
  }
  
  if (file.size > MAX_FILE_SIZE) {
    emit('error', 'File size exceeds the 10MB limit.')
    return
  }
  
  emit('update:modelValue', file)
}

const onDrop = (files: File[] | null) => {
  if (files && files.length > 0 && !props.loading) {
    processFile(files[0])
  }
}

const { isOverDropZone: isDragOver } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ALLOWED_TYPES
})

const { open, onChange, reset } = useFileDialog({
  accept: ALLOWED_TYPES.join(','),
  multiple: false
})

onChange((files) => {
  if (files && files.length > 0 && !props.loading) {
    processFile(files[0])
    reset()
  }
})

const openFileDialog = () => {
  if (!props.loading && !props.modelValue) {
    open()
  }
}

const clearFile = () => {
  if (!props.loading) {
    emit('update:modelValue', null)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

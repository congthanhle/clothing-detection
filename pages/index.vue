<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
    
    <!-- Full Screen Loading Overlay -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <LoadingOverlay class="!absolute !inset-0 !bg-transparent !rounded-none" />
      </div>
    </Transition>

    <!-- Header -->
    <header class="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            <ApertureIcon class="w-5 h-5 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 class="font-bold text-lg md:text-xl leading-tight">Clothing Detector Demo</h1>
            <p class="text-xs text-gray-500 dark:text-zinc-400 hidden sm:block">Upload a photo to detect and annotate clothing items</p>
          </div>
        </div>
        
        <!-- Dark mode toggle -->
        <button 
          @click="toggleColorMode" 
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle dark mode"
        >
          <SunIcon v-if="isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start" ref="mainContainerRef">
        
        <!-- LEFT COLUMN: Upload & Actions -->
        <div class="lg:col-span-4 xl:col-span-5 flex flex-col gap-6 sticky top-24" id="upload-section">
          
          <div class="bg-white dark:bg-zinc-900 p-1 md:p-2 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800">
            <UploadZone 
              :modelValue="file"
              @update:modelValue="setFile"
              :loading="loading" 
              @error="onUploadError"
            />
          </div>

          <!-- Error Alert -->
          <Transition name="fade">
            <div 
              v-if="error" 
              class="w-full p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl rounded-l-sm flex items-start gap-3 shadow-sm border border-red-100 dark:border-red-900/30"
              role="alert"
            >
              <AlertTriangleIcon class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p class="text-sm font-medium text-red-800 dark:text-red-400">{{ error }}</p>
            </div>
          </Transition>

          <!-- Detect Button -->
          <button 
            @click="onDetectClick"
            :disabled="!file || loading"
            class="w-full relative py-4 px-4 font-semibold text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 overflow-hidden"
            :class="(!file || loading) ? 'bg-gray-300 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border border-gray-200 dark:border-zinc-700/50' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:ring-blue-500 dark:focus:ring-offset-zinc-950 active:scale-[0.98]'"
          >
            <!-- Highlight effect on active -->
            <div v-if="file && !loading" class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            
            <span v-if="!loading" class="flex items-center gap-2">
              <ScanIcon class="w-5 h-5" />
              Detect Clothing
            </span>
            <span v-else class="flex items-center gap-2">
              <Loader2Icon class="w-5 h-5 animate-spin" />
              Analyzing Image...
            </span>
          </button>
        </div>

        <!-- RIGHT COLUMN: Results -->
        <div class="lg:col-span-8 xl:col-span-7 flex flex-col gap-8 w-full min-w-0" id="results-section">
          
          <Transition name="fade-slide" mode="out-in">
            <!-- Empty state illustration when no result -->
            <div v-if="!result" class="hidden lg:flex flex-col items-center justify-center h-full min-h-[500px] xl:min-h-[600px] text-gray-400 dark:text-zinc-600 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl bg-gray-50/50 dark:bg-zinc-900/20 px-8 text-center transition-colors">
              <ImagePlusIcon class="w-16 h-16 mb-4 opacity-40 text-gray-400 dark:text-zinc-600" />
              <h2 class="text-lg font-semibold text-gray-600 dark:text-zinc-400">Ready to analyze</h2>
              <p class="text-sm mt-2 max-w-sm">Upload a photo displaying clothing to automatically detect, classify, and generate responsive bounding boxes.</p>
            </div>
            
            <!-- Result Cards -->
            <div v-else class="flex flex-col gap-8 w-full">
              <!-- Result Image -->
              <div class="w-full">
                <ResultImage 
                  :imageUrl="result.annotated_image_url" 
                  :detections="result.detections" 
                />
              </div>

              <!-- Detection Table -->
              <div class="w-full">
                <DetectionTable 
                  :detections="result.detections" 
                />
              </div>

              <!-- Try another image button -->
              <div class="w-full flex justify-center pt-4 pb-8 border-t border-gray-200 dark:border-zinc-800/80">
                <button 
                  @click="handleReset"
                  class="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-900"
                >
                  <RotateCcwIcon class="w-4 h-4" />
                  Try another image
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Add the new Image Gallery at the bottom of main -->
      <ImageGallery />
    </main>


    <!-- Footer -->
    <footer class="w-full py-6 mt-auto border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div class="max-w-7xl mx-auto px-4 flex items-center justify-center">
        <p class="text-sm text-gray-500 dark:text-zinc-500 font-medium tracking-wide">
          Built with Django + Nuxt + Supabase &middot; Course Demo
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { useColorMode } from '#imports'
import { 
  Aperture as ApertureIcon, 
  Sun as SunIcon, 
  Moon as MoonIcon,
  AlertTriangle as AlertTriangleIcon,
  Scan as ScanIcon,
  Loader2 as Loader2Icon,
  ImagePlus as ImagePlusIcon,
  RotateCcw as RotateCcwIcon
} from 'lucide-vue-next'

import useDetection from '~/composables/useDetection'
import UploadZone from '~/components/UploadZone.vue'
import ResultImage from '~/components/ResultImage.vue'
import DetectionTable from '~/components/DetectionTable.vue'
import LoadingOverlay from '~/components/LoadingOverlay.vue'

// Initialize state from properly defined composable
const { file, loading, error, result, setFile, submitDetection, reset } = useDetection()

// Color mode setup (if `@nuxtjs/color-mode` is provided)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

// Upload zone strict error handler
const onUploadError = (msg: string) => {
  error.value = msg
  setTimeout(() => {
    if (error.value === msg) error.value = null
  }, 5000)
}

// Watch incoming file changes properly to reset the guard states
watch(file, (newFile) => {
  if (newFile) {
    error.value = null
  }
})

// Bound submission trigger handling scrolling heuristics
const onDetectClick = async () => {
  if (!file.value || loading.value) return
  
  await submitDetection()
  
  // Smooth scroll down to generated outcomes on successful analysis
  if (result.value) {
    nextTick(() => {
      const resultsEl = document.getElementById('results-section')
      if (resultsEl) {
        // Evaluate constraint for Mobile/Tablet layout exclusively
        if (window.innerWidth < 1024) {
          const yOffset = -80 // Offset to bypass sticky header overlay
          const y = resultsEl.getBoundingClientRect().top + window.scrollY + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
    })
  }
}

const handleReset = () => {
  reset()
  
  // Return cursor/viewport to standard start positions smoothly 
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}
</script>

<style>
/* Nuxt/Vue Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-leave-active {
  transition: all 0.2s ease-in;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

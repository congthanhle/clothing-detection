<template>
  <div class="mt-12 mb-8" id="gallery-section">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">Detection Gallery</h2>
      <button 
        @click="fetchImages" 
        :disabled="loading"
        class="text-sm px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
      >
        <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="p-4 bg-red-50 text-red-600 rounded-lg mb-6">
      {{ error }}
    </div>

    <!-- Empty state -->
    <div v-if="!loading && images.length === 0" class="text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
      <ImageIcon class="w-12 h-12 mx-auto text-gray-400 mb-3" />
      <p class="text-gray-500">No detection results yet.</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="img in images" 
        :key="img.id"
        class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-transform hover:scale-[1.02]"
      >
        <div class="aspect-video bg-gray-100 dark:bg-zinc-800 relative">
          <img 
            :src="img.annotated_image_url || img.original_image" 
            alt="Detection result"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="p-4 flex items-center justify-between">
          <div class="text-xs text-gray-500">
            {{ new Date(img.created_at).toLocaleDateString() }}
          </div>
          <button 
            @click="deleteImage(img.id)"
            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete this result"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RefreshCw as RefreshCwIcon, Image as ImageIcon, Trash as TrashIcon } from 'lucide-vue-next'
import useGallery from '~/composables/useGallery'

const { images, loading, error, fetchImages, deleteImage } = useGallery()

onMounted(() => {
  fetchImages()
})
</script>

<template>
  <div class="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden flex flex-col">
    <!-- Header with Copy Button -->
    <div class="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-wrap items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 gap-4">
      <h3 class="font-semibold text-zinc-800 dark:text-zinc-100 text-lg flex items-center gap-2">
        <ListIcon class="w-5 h-5 text-indigo-500" />
        Detections Payload
      </h3>
      <button 
        @click="copyJson"
        :disabled="detections.length === 0"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-offset-zinc-900 focus:ring-offset-2"
        :class="hasCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'"
      >
        <CheckIcon v-if="hasCopied" class="w-4 h-4" />
        <CopyIcon v-else class="w-4 h-4" />
        {{ hasCopied ? 'Copied!' : 'Copy JSON' }}
      </button>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar relative">
      <table v-if="detections.length > 0" class="min-w-full text-sm text-left whitespace-nowrap">
        <thead class="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800/80 sticky top-0 z-10 shadow-sm">
          <tr>
            <th 
              v-for="col in columns" 
              :key="col.key"
              scope="col" 
              @click="sortBy(col.key)"
              class="px-5 py-4 font-semibold cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group border-b border-zinc-200 dark:border-zinc-700/50"
            >
              <div class="flex items-center gap-1.5" :class="{ 'justify-end': col.alignRight }">
                {{ col.label }}
                <!-- Sort indicators -->
                <span class="text-[10px] text-zinc-300 dark:text-zinc-600 relative flex flex-col items-center ml-0.5 mt-0.5">
                  <span 
                    :class="{ 'text-indigo-600 dark:text-indigo-400': sortKey === col.key && sortOrder === 'asc' }"
                    class="leading-[5px] transition-colors"
                  >▲</span>
                  <span 
                    :class="{ 'text-indigo-600 dark:text-indigo-400': sortKey === col.key && sortOrder === 'desc' }"
                    class="leading-[5px] transition-colors"
                  >▼</span>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <tr 
            v-for="(item, idx) in sortedDetections" 
            :key="idx"
            class="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors odd:bg-white odd:dark:bg-zinc-900 even:bg-zinc-50/30 even:dark:bg-zinc-800/30"
          >
            <!-- # -->
            <td class="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{{ item.originalIndex + 1 }}</td>
            
            <!-- Label -->
            <td class="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100 capitalize">{{ item.label }}</td>
            
            <!-- Confidence -->
            <td class="px-5 py-3">
              <div class="flex flex-col gap-1.5 w-24">
                <span 
                  class="text-xs font-semibold px-2 py-0.5 rounded-full w-max border"
                  :class="getConfidenceBadgeColor(item.confidence)"
                >
                  {{ (item.confidence * 100).toFixed(1) }}%
                </span>
                <div class="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :class="getConfidenceBarColor(item.confidence)"
                    :style="{ width: `${item.confidence * 100}%` }"
                  ></div>
                </div>
              </div>
            </td>
            
            <!-- Coordinates -->
            <td class="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-right font-mono text-xs">{{ Math.round(item.bbox.x1) }}</td>
            <td class="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-right font-mono text-xs">{{ Math.round(item.bbox.y1) }}</td>
            <td class="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-right font-mono text-xs">{{ Math.round(item.bbox.x2) }}</td>
            <td class="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-right font-mono text-xs">{{ Math.round(item.bbox.y2) }}</td>
            
            <!-- Computed Width/Height -->
            <td class="px-5 py-3 text-zinc-700 dark:text-zinc-300 font-medium text-right font-mono text-xs border-l border-zinc-100 dark:border-zinc-800/50">{{ Math.round(item.width) }}</td>
            <td class="px-5 py-3 text-zinc-700 dark:text-zinc-300 font-medium text-right font-mono text-xs">{{ Math.round(item.height) }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center p-16 text-center text-zinc-400 dark:text-zinc-500 w-full min-h-[300px]">
        <ScanLineIcon class="w-12 h-12 mb-4 opacity-50" />
        <p class="text-base font-medium text-zinc-600 dark:text-zinc-300">No clothing items detected in this image.</p>
        <p class="text-sm mt-1 max-w-sm">Try uploading a different photo with clearer subjects to see the JSON breakdown.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy as CopyIcon, Check as CheckIcon, List as ListIcon, ScanLine as ScanLineIcon } from 'lucide-vue-next'

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
  detections: Detection[]
}>()

const hasCopied = ref(false)
const sortKey = ref<string>('confidence')
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
  { key: 'index', label: '#', alignRight: false },
  { key: 'label', label: 'Label', alignRight: false },
  { key: 'confidence', label: 'Confidence', alignRight: false },
  { key: 'x1', label: 'X1', alignRight: true },
  { key: 'y1', label: 'Y1', alignRight: true },
  { key: 'x2', label: 'X2', alignRight: true },
  { key: 'y2', label: 'Y2', alignRight: true },
  { key: 'width', label: 'Width', alignRight: true },
  { key: 'height', label: 'Height', alignRight: true }
]

const getConfidenceBarColor = (conf: number) => {
  if (conf > 0.8) return 'bg-emerald-500' // strict > 80%
  if (conf >= 0.5) return 'bg-amber-500' // 50-80%
  return 'bg-red-500' // < 50%
}

const getConfidenceBadgeColor = (conf: number) => {
  if (conf > 0.8) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20'
  if (conf >= 0.5) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20'
  return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/20'
}

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    // Default to desc for measurements and confidence
    sortOrder.value = ['confidence', 'width', 'height', 'x1', 'y1', 'x2', 'y2'].includes(key) ? 'desc' : 'asc'
  }
}

const sortedDetections = computed(() => {
  if (!props.detections || props.detections.length === 0) return []
  
  const itemsWithIndex = props.detections.map((d, index) => ({
    ...d,
    originalIndex: index,
    width: d.bbox.x2 - d.bbox.x1,
    height: d.bbox.y2 - d.bbox.y1
  }))
  
  return itemsWithIndex.sort((a, b) => {
    let valA, valB;
    
    switch (sortKey.value) {
      case 'index':
        valA = a.originalIndex; valB = b.originalIndex; break;
      case 'label':
        valA = a.label; valB = b.label; break;
      case 'confidence':
        valA = a.confidence; valB = b.confidence; break;
      case 'x1':
        valA = a.bbox.x1; valB = b.bbox.x1; break;
      case 'y1':
        valA = a.bbox.y1; valB = b.bbox.y1; break;
      case 'x2':
        valA = a.bbox.x2; valB = b.bbox.x2; break;
      case 'y2':
        valA = a.bbox.y2; valB = b.bbox.y2; break;
      case 'width':
        valA = a.width; valB = b.width; break;
      case 'height':
        valA = a.height; valB = b.height; break;
      default:
        valA = a.confidence; valB = b.confidence;
    }
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const copyJson = async () => {
  if (!props.detections || props.detections.length === 0) return
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.detections, null, 2))
    hasCopied.value = true
    setTimeout(() => {
      hasCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy JSON: ', err)
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(161, 161, 170, 0.5);
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(82, 82, 91, 0.5);
}
</style>

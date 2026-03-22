<template>
  <div class="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-3xl transition-all duration-300">
    <div class="flex flex-col items-center gap-4">
      <div class="relative w-16 h-16 flex items-center justify-center">
        <!-- Ping effect -->
        <div class="absolute inset-0 rounded-full border-2 border-indigo-400 opacity-20 animate-ping"></div>
        <!-- Spinner -->
        <div class="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
        <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-[spin_1s_cubic-bezier(0.5,0.1,0.4,0.9)_infinite]"></div>
        <ScanIcon class="w-5 h-5 text-indigo-500 z-10" />
      </div>
      <p class="font-display font-medium text-zinc-600 dark:text-zinc-300 animate-pulse tracking-wide">
        Analyzing Image...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Scan as ScanIcon } from 'lucide-vue-next'
</script>

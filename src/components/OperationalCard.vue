<script setup lang="ts">
import { computed, useSlots } from 'vue'

type LineSpacing = 'none' | 'sm' | 'md'

interface CardLine {
  text: string
  muted?: boolean
  spacing?: LineSpacing
}

interface Props {
  title: string
  icon: string
  variant?: 'default' | 'next' | 'attention'
  iconSize?: number | string
  highlight?: string
  lines?: CardLine[]
  isEmpty?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  iconSize: 32,
  highlight: '',
  lines: () => [],
  isEmpty: false,
  emptyText: 'No data available.',
})

const slots = useSlots()

const hasDefaultSlot = computed(() => {
  return Boolean(slots.default)
})

const cardClasses = computed(() => {
  return {
    'op-card--next': props.variant === 'next',
    'op-card--attention': props.variant === 'attention',
  }
})

const lineClasses = (line: CardLine, index: number) => {
  const classes: string[] = ['text-body-2']

  if (line.muted) {
    classes.push('text-medium-emphasis')
  }

  const spacing = line.spacing ?? (index === 0 && props.highlight ? 'sm' : 'none')

  if (spacing === 'sm') {
    classes.push('mt-1')
  }
  if (spacing === 'md') {
    classes.push('mt-2')
  }

  return classes
}
</script>

<template>
  <v-card class="op-card" :class="cardClasses" rounded="xl">
    <v-card-title class="op-card-title">
      <div class="card-title-lockup">
        <v-icon class="card-title-icon" color="white" :icon="icon" :size="iconSize" />
        <span>{{ title }}</span>
      </div>
    </v-card-title>
    <v-card-text class="op-card-content">
      <template v-if="hasDefaultSlot">
        <slot />
      </template>
      <template v-else>
        <div v-if="isEmpty" class="text-medium-emphasis">{{ emptyText }}</div>
        <template v-else>
          <div v-if="highlight" class="card-highlight">{{ highlight }}</div>
          <div v-for="(line, index) in lines" :key="`${line.text}-${index}`" :class="lineClasses(line, index)">
            {{ line.text }}
          </div>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.op-card {
  height: 100%;
  background: rgba(16, 27, 48, 0.82);
  border: 1px solid rgba(231, 231, 231, 0.12);
  backdrop-filter: blur(6px);
}

.op-card--next {
  background:
    linear-gradient(135deg, rgba(72, 86, 150, 0.34), rgba(16, 27, 48, 0.9) 58%),
    rgba(16, 27, 48, 0.82);
  border-color: rgba(72, 86, 150, 0.52);
  box-shadow: 0 12px 26px rgba(4, 9, 22, 0.28);
}

.op-card--attention {
  background:
    linear-gradient(135deg, rgba(72, 86, 150, 0.34), rgba(16, 27, 48, 0.9) 58%),
    rgba(16, 27, 48, 0.82);
  border-color: rgba(72, 86, 150, 0.52);
  box-shadow: 0 12px 26px rgba(4, 9, 22, 0.28);
}

.op-card-title {
  display: flex;
  align-items: center;
  color: #FC7A1E;
  font-size: 1.42rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding-bottom: 8px;
}

.card-title-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-title-icon {
  font-size: 2rem;
  color: #E7E7E7;
  opacity: 0.84;
}

.op-card-content {
  padding-left: 64px;
  padding-top: 0;
}

.op-card-content .v-list {
  margin-left: -4px;
}

.op-card-content .v-list-item {
  padding-left: 0;
}

.op-card-content :deep(.text-body-2),
.op-card-content :deep(.text-medium-emphasis) {
  padding-left: 0;
}

.card-highlight {
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.35;
}
</style>

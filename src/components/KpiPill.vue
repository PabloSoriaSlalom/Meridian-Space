<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  value2?: string | number
  separator?: string
}

withDefaults(defineProps<Props>(), {
  value2: '',
  separator: '•',
})
</script>

<template>
  <v-chip class="kpi-pill" color="surface-variant" label>
    <span class="kpi-pill-label">{{ label }}</span>
    <span class="kpi-pill-value">{{ value }}</span>
    <template v-if="value2 !== ''">
      <span class="kpi-pill-dot">{{ separator }}</span>
      <span class="kpi-pill-value">{{ value2 }}</span>
    </template>
  </v-chip>
</template>

<style scoped>
.kpi-pill {
  background: rgba(24, 33, 58, 0.76) !important;
  border: 1px solid rgba(231, 231, 231, 0.12);
  color: #E7E7E7 !important;
  min-height: 36px;
  padding-inline: 0.75rem;
}

.kpi-pill :deep(.v-chip__content) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.kpi-pill-label {
  font-size: 0.78rem;
  color: rgba(231, 231, 231, 0.78);
  letter-spacing: 0.02em;
}

.kpi-pill-value {
  font-size: 1rem;
  font-weight: 700;
  color: #F9C784;
  margin-left: 0.15rem;
}

.kpi-pill-dot {
  color: rgba(231, 231, 231, 0.72);
}
</style>

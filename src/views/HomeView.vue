<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import KpiPill from '@/components/KpiPill.vue'
import OperationalCard from '@/components/OperationalCard.vue'
import rawMissionData from '@/data/missions.json'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

type Severity = 'Low' | 'Medium' | 'High'
type MissionStatus = 'Completed' | 'Scheduled' | 'Watch' | 'Delayed'

interface OperationalAlert {
  severity: Severity
  category: string
  message: string
  status: string
}

interface MissionRecord {
  missionId: string
  spacecraftName: string
  missionType: 'Tourism' | 'Research' | 'Cargo' | 'Crew Rotation' | 'Station Resupply' | 'Maintenance'
  origin: string
  destination: string
  launchDate: string
  launchTime: string
  missionStatus: MissionStatus
  launchReadinessScore: number
  spacecraftHealth: number
  crewReadiness: number
  crewCount: number
  passengerCheckInPercentage: number | null
  passengerCount: number
  fuelStatus: number
  weatherRisk: 'Low' | 'Moderate' | 'High'
  communicationsStatus: 'Nominal' | 'Warning'
  lifeSupportStatus: 'Nominal' | 'Warning'
  missionDuration: string
  delayMinutes: number
  operationalAlerts: OperationalAlert[]
}

interface MissionDataset {
  lastUpdated: string
  year: number
  missions: MissionRecord[]
}

const dataset = rawMissionData as MissionDataset
const missionTypeFilter = ref<string>('all')
const heroBackgroundImage = new URL('../images/bg_hero.jpg', import.meta.url).href
const brandLogoImage = new URL('../images/MS_logo.png', import.meta.url).href

const allMissions = computed(() => {
  return [...dataset.missions].sort((a, b) => {
    return new Date(`${a.launchDate}T${a.launchTime}:00`).getTime() -
      new Date(`${b.launchDate}T${b.launchTime}:00`).getTime()
  })
})

const scopedMissions = computed(() => {
  if (missionTypeFilter.value === 'all') {
    return allMissions.value
  }
  return allMissions.value.filter((mission) => mission.missionType === missionTypeFilter.value)
})

const now = new Date('2026-07-14T00:00:00Z')

const upcomingMissions = computed(() => {
  return scopedMissions.value.filter((mission) => {
    const launch = new Date(`${mission.launchDate}T${mission.launchTime}:00`)
    return launch >= now && mission.missionStatus !== 'Completed'
  })
})

const missionsNeedingAttention = computed(() => {
  return scopedMissions.value
    .filter((mission) => {
      return (
        mission.missionStatus === 'Delayed' ||
        mission.missionStatus === 'Watch' ||
        mission.delayMinutes > 0 ||
        mission.communicationsStatus === 'Warning' ||
        mission.launchReadinessScore < 90 ||
        mission.operationalAlerts.some((alert) => alert.status !== 'Resolved')
      )
    })
    .sort((a, b) => b.delayMinutes - a.delayMinutes)
})

const flattenedAlerts = computed(() => {
  return scopedMissions.value.flatMap((mission) => {
    return mission.operationalAlerts.map((alert) => ({
      missionId: mission.missionId,
      launchDate: mission.launchDate,
      ...alert,
    }))
  })
})

const priorityAlerts = computed(() => {
  return flattenedAlerts.value
    .filter((alert) => {
      return alert.status !== 'Resolved' && (alert.severity === 'High' || alert.status === 'Active')
    })
    .sort((a, b) => (a.severity === 'High' ? -1 : 1))
})

const networkHealthScore = computed(() => {
  if (scopedMissions.value.length === 0) {
    return 0
  }
  const total = scopedMissions.value.reduce((acc, mission) => {
    return acc + mission.launchReadinessScore + mission.spacecraftHealth + mission.crewReadiness
  }, 0)
  return Math.round(total / (scopedMissions.value.length * 3))
})

const delayedLaunchCount = computed(() => {
  return scopedMissions.value.filter((mission) => mission.delayMinutes > 0 || mission.missionStatus === 'Delayed').length
})

const openAlertCount = computed(() => {
  return flattenedAlerts.value.filter((alert) => alert.status !== 'Resolved').length
})

const activeMissionCount = computed(() => {
  return allMissions.value.length
})

const allScopeAttentionCount = computed(() => {
  return allMissions.value.filter((mission) => {
    return (
      mission.missionStatus === 'Delayed' ||
      mission.missionStatus === 'Watch' ||
      mission.delayMinutes > 0 ||
      mission.communicationsStatus === 'Warning' ||
      mission.launchReadinessScore < 90 ||
      mission.operationalAlerts.some((alert) => alert.status !== 'Resolved')
    )
  }).length
})

const nextLaunch = computed(() => {
  return upcomingMissions.value[0] ?? null
})

const allScopeNextLaunch = computed(() => {
  return allMissions.value.find((mission) => {
    const launch = new Date(`${mission.launchDate}T${mission.launchTime}:00`)
    return launch >= now && mission.missionStatus !== 'Completed'
  }) ?? null
})

const nextLaunchDay = computed(() => {
  if (!allScopeNextLaunch.value) {
    return 'N/A'
  }

  return new Date(`${allScopeNextLaunch.value.launchDate}T${allScopeNextLaunch.value.launchTime}:00`).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  })
})

const nextLaunchClock = computed(() => {
  if (!allScopeNextLaunch.value) {
    return '--:--'
  }

  return new Date(`${allScopeNextLaunch.value.launchDate}T${allScopeNextLaunch.value.launchTime}:00`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
})

const todayKey = now.toISOString().slice(0, 10)

const todaysSchedule = computed(() => {
  return scopedMissions.value.filter((mission) => mission.launchDate === todayKey)
})

const weatherSummary = computed(() => {
  const relevant = upcomingMissions.value.length > 0 ? upcomingMissions.value : scopedMissions.value
  const high = relevant.filter((mission) => mission.weatherRisk === 'High').length
  const moderate = relevant.filter((mission) => mission.weatherRisk === 'Moderate').length

  return {
    high,
    moderate,
    clear: Math.max(relevant.length - high - moderate, 0),
  }
})

const fleetHealthAverage = computed(() => {
  if (scopedMissions.value.length === 0) {
    return 0
  }
  const total = scopedMissions.value.reduce((acc, mission) => acc + mission.spacecraftHealth, 0)
  return Math.round(total / scopedMissions.value.length)
})

const fleetWatchCount = computed(() => {
  return fleetSummary.value.filter((fleet) => fleet.communications === 'Watch' || fleet.health < 92 || fleet.readiness < 90).length
})

const recentAlerts = computed(() => {
  const severityRank: Record<Severity, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  }

  return [...flattenedAlerts.value]
    .sort((a, b) => {
      if (a.status === 'Resolved' && b.status !== 'Resolved') {
        return 1
      }
      if (a.status !== 'Resolved' && b.status === 'Resolved') {
        return -1
      }
      const severityDiff = severityRank[b.severity] - severityRank[a.severity]
      if (severityDiff !== 0) {
        return severityDiff
      }
      return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
    })
    .slice(0, 4)
})

const statusHeadline = computed(() => {
  if (missionTypeFilter.value === 'all') {
    return 'All Missions'
  }

  return `${missionTypeFilter.value} Operations`
})

const statusSummary = computed(() => {
  if (missionsNeedingAttention.value.length > 0) {
    return `${missionsNeedingAttention.value.length} Missions Need Attention`
  }
  if (missionTypeFilter.value === 'all') {
    return 'All Active Missions Running as Planned'
  }

  return `All ${missionTypeFilter.value} Missions Running as Planned`
})

const scopeSubLabel = computed(() => {
  if (missionTypeFilter.value === 'all') {
    return 'Fleet-wide operational view'
  }

  return `${missionTypeFilter.value} operations only`
})

const statusTag = computed(() => {
  if (priorityAlerts.value.length > 0 || delayedLaunchCount.value > 0) {
    return 'Critical'
  }
  if (missionsNeedingAttention.value.length > 0 || networkHealthScore.value < 92) {
    return 'Watch'
  }
  return 'Nominal'
})

const statusColor = computed(() => {
  if (statusTag.value === 'Critical') {
    return 'error'
  }
  if (statusTag.value === 'Watch') {
    return 'warning'
  }
  return 'success'
})

const fleetSummary = computed(() => {
  const grouped = new Map<string, MissionRecord[]>()
  for (const mission of scopedMissions.value) {
    if (!grouped.has(mission.spacecraftName)) {
      grouped.set(mission.spacecraftName, [])
    }
    grouped.get(mission.spacecraftName)?.push(mission)
  }

  return [...grouped.entries()].map(([spacecraftName, missions]) => {
    const avg = (key: 'spacecraftHealth' | 'crewReadiness' | 'launchReadinessScore') => {
      const total = missions.reduce((acc, mission) => acc + mission[key], 0)
      return Math.round(total / missions.length)
    }
    const hasWarning = missions.some((mission) => {
      return mission.communicationsStatus === 'Warning' || mission.missionStatus === 'Delayed'
    })

    return {
      spacecraftName,
      health: avg('spacecraftHealth'),
      crew: avg('crewReadiness'),
      readiness: avg('launchReadinessScore'),
      communications: hasWarning ? 'Watch' : 'Nominal',
      missionCount: missions.length,
    }
  })
})

const trendLabels = computed(() => {
  return scopedMissions.value.map((mission) => {
    const month = new Date(`${mission.launchDate}T00:00:00`).toLocaleString('en-US', { month: 'short' })
    return `${month} ${mission.missionId}`
  })
})

const readinessTrendData = computed(() => {
  return {
    labels: trendLabels.value,
    datasets: [
      {
        label: 'Launch Readiness',
        data: scopedMissions.value.map((mission) => mission.launchReadinessScore),
        borderColor: '#485696',
        backgroundColor: 'rgba(72, 86, 150, 0.16)',
        fill: true,
        tension: 0.32,
      },
      {
        label: 'Spacecraft Health',
        data: scopedMissions.value.map((mission) => mission.spacecraftHealth),
        borderColor: '#FC7A1E',
        backgroundColor: 'rgba(252, 122, 30, 0.1)',
        fill: false,
        tension: 0.25,
      },
    ],
  }
})

const readinessTrendOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#c4d2f2',
      },
    },
  },
  scales: {
    y: {
      min: 70,
      max: 100,
      ticks: { color: '#9bb0df' },
      grid: { color: 'rgba(140, 161, 206, 0.18)' },
    },
    x: {
      ticks: { color: '#9bb0df', maxRotation: 0, autoSkip: true },
      grid: { color: 'rgba(140, 161, 206, 0.08)' },
    },
  },
}

const statusDistributionData = computed(() => {
  const counts = {
    Completed: 0,
    Scheduled: 0,
    Watch: 0,
    Delayed: 0,
  }

  for (const mission of scopedMissions.value) {
    counts[mission.missionStatus] += 1
  }

  return {
    labels: ['Completed', 'Scheduled', 'Watch', 'Delayed'],
    datasets: [
      {
        data: [counts.Completed, counts.Scheduled, counts.Watch, counts.Delayed],
        backgroundColor: ['#485696', '#E7E7E7', '#F9C784', '#FC7A1E'],
        borderColor: 'rgba(24, 33, 58, 0.9)',
        borderWidth: 2,
      },
    ],
  }
})

const statusDistributionOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#c4d2f2',
      },
      position: 'bottom',
    },
  },
}

const delayByMissionData = computed(() => {
  const subset = scopedMissions.value.filter((mission) => mission.delayMinutes > 0)
  const source = subset.length > 0 ? subset : scopedMissions.value.slice(0, 5)

  return {
    labels: source.map((mission) => mission.missionId),
    datasets: [
      {
        label: 'Delay Minutes',
        data: source.map((mission) => mission.delayMinutes),
        backgroundColor: source.map((mission) => (mission.delayMinutes > 0 ? '#F24C00' : '#485696')),
        borderRadius: 8,
      },
    ],
  }
})

const delayByMissionOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#c4d2f2',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#9bb0df' },
      grid: { color: 'rgba(140, 161, 206, 0.18)' },
    },
    x: {
      ticks: { color: '#9bb0df' },
      grid: { display: false },
    },
  },
}

const missionTypeOptions = computed(() => {
  return [
    { title: 'All Missions', value: 'all' },
    { title: 'Tourism', value: 'Tourism' },
    { title: 'Research', value: 'Research' },
    { title: 'Cargo', value: 'Cargo' },
    { title: 'Crew Rotation', value: 'Crew Rotation' },
    { title: 'Station Resupply', value: 'Station Resupply' },
    { title: 'Maintenance', value: 'Maintenance' },
  ]
})

const formatDateTime = (mission: MissionRecord) => {
  const dt = new Date(`${mission.launchDate}T${mission.launchTime}:00`)
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatStatusColor = (status: MissionStatus) => {
  if (status === 'Delayed') {
    return 'error'
  }
  if (status === 'Watch') {
    return 'warning'
  }
  if (status === 'Scheduled') {
    return 'info'
  }
  return 'success'
}
</script>

<template>
  <v-container fluid class="dashboard-wrap pa-4 pa-md-8">
    <v-row class="mb-5">
      <v-col cols="12">
        <v-sheet class="brand-bar pa-4 pa-md-5" rounded="xl">
          <div class="brand-lockup">
            <v-img class="brand-logo" :src="brandLogoImage" alt="Meridian Space logo" contain />
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="network-hero pa-5 pa-md-8" rounded="xl" :style="{ '--hero-bg-image': `url(${heroBackgroundImage})` }">
          <div class="d-flex justify-space-between align-start ga-4 flex-wrap mb-5">
            <div>
              <div class="hero-eyebrow">
                <span class="hero-eyebrow-label">Operations Status</span>
              </div>
              <h1 class="dashboard-title">{{ statusHeadline }}</h1>
              <p class="hero-summary text-medium-emphasis">{{ statusSummary }}</p>
            </div>
            <div class="hero-controls">
              <v-select
                v-model="missionTypeFilter"
                :items="missionTypeOptions"
                label="Mission Type"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(9, 17, 30, 0.9)"
                hide-details
              />
            </div>
          </div>

          <div class="hero-readiness d-flex align-center ga-3 flex-wrap">
            <div class="readiness-value">{{ networkHealthScore }}%</div>
            <div class="readiness-label">Operational Readiness</div>
            <KpiPill label="Active Missions" :value="activeMissionCount" />
            <KpiPill label="Need Attention" :value="allScopeAttentionCount" />
            <KpiPill label="Next Launch" :value="nextLaunchDay" :value2="nextLaunchClock" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6" dense>
      <v-col cols="12" md="6">
        <OperationalCard
          v-if="nextLaunch"
          title="Next Launch"
          icon="mdi-rocket-launch-outline"
          variant="next"
          :highlight="`${nextLaunch.missionId} to ${nextLaunch.destination}`"
          :lines="[
            { text: formatDateTime(nextLaunch), muted: true, spacing: 'none' },
            { text: `${nextLaunch.spacecraftName} · Crew ${nextLaunch.crewCount}`, spacing: 'md' },
          ]"
        />
        <OperationalCard
          v-else
          title="Next Launch"
          icon="mdi-rocket-launch-outline"
          variant="next"
          is-empty
          empty-text="No upcoming launches in this view."
        />
      </v-col>

      <v-col cols="12" md="6">
        <OperationalCard
          title="Needs Attention"
          icon="mdi-alert-circle-outline"
          variant="attention"
          :highlight="`${missionsNeedingAttention.length} mission${missionsNeedingAttention.length === 1 ? '' : 's'}`"
          :lines="[
            {
              text:
                missionsNeedingAttention.length > 0
                  ? missionsNeedingAttention.slice(0, 2).map((m) => m.missionId).join(' · ')
                  : 'Everything is on track right now.',
              muted: true,
              spacing: 'sm',
            },
            {
              text: `${openAlertCount} open alert${openAlertCount === 1 ? '' : 's'}`,
              spacing: 'md',
            },
          ]"
        />
      </v-col>

      <v-col cols="12" md="6">
        <OperationalCard
          title="Fleet Health"
          icon="mdi-shield-check-outline"
          :highlight="`${fleetHealthAverage}% fleet health`"
          :lines="[
            { text: `${fleetSummary.length} spacecraft in operation scope`, muted: true, spacing: 'sm' },
            { text: `${fleetWatchCount} fleet item${fleetWatchCount === 1 ? '' : 's'} on watch`, spacing: 'md' },
          ]"
        />
      </v-col>

      <v-col cols="12" md="6">
        <OperationalCard
          title="Today's Schedule"
          icon="mdi-calendar-clock-outline"
          :highlight="`${todaysSchedule.length} scheduled today`"
          :lines="[
            {
              text:
                todaysSchedule.length > 0
                  ? todaysSchedule.map((mission) => `${mission.missionId} ${mission.launchTime}`).join(' · ')
                  : 'No launches scheduled today.',
              muted: true,
              spacing: 'sm',
            },
            {
              text: `${upcomingMissions.length} upcoming mission${upcomingMissions.length === 1 ? '' : 's'}`,
              spacing: 'md',
            },
          ]"
        />
      </v-col>

      <v-col cols="12" md="6">
        <OperationalCard
          title="Weather"
          icon="mdi-weather-partly-cloudy"
          :highlight="`${weatherSummary.high} high-risk window${weatherSummary.high === 1 ? '' : 's'}`"
          :lines="[
            {
              text: `${weatherSummary.moderate} moderate-risk launch condition${weatherSummary.moderate === 1 ? '' : 's'}`,
              muted: true,
              spacing: 'sm',
            },
            {
              text: `${weatherSummary.clear} launch${weatherSummary.clear === 1 ? '' : 'es'} currently in clear weather`,
              spacing: 'md',
            },
          ]"
        />
      </v-col>

      <v-col cols="12" md="6">
        <OperationalCard title="Recent Alerts" icon="mdi-bell-outline">
          <div v-if="recentAlerts.length === 0" class="text-medium-emphasis">No recent alerts in this view.</div>
          <v-list v-else class="bg-transparent pa-0" density="compact">
            <v-list-item v-for="(alert, index) in recentAlerts" :key="`${alert.missionId}-${index}`" class="px-0">
              <v-list-item-title class="text-body-2">{{ alert.message }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ alert.missionId }} · {{ alert.status }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </OperationalCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="trend-section" rounded="xl">
          <v-card-title class="section-title">
            <div class="section-title-lockup">
              <v-icon class="section-title-icon" color="white" icon="mdi-chart-line" size="32" />
              <span>Trends and Context</span>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" lg="7">
                <v-sheet class="trend-tile graph-tile pa-3" rounded="lg">
                  <Line :data="readinessTrendData" :options="readinessTrendOptions" />
                </v-sheet>
              </v-col>
              <v-col cols="12" sm="6" lg="3">
                <v-sheet class="trend-tile graph-tile pa-3" rounded="lg">
                  <Doughnut :data="statusDistributionData" :options="statusDistributionOptions" />
                </v-sheet>
              </v-col>
              <v-col cols="12" sm="6" lg="2">
                <v-sheet class="trend-tile graph-tile pa-3" rounded="lg">
                  <Bar :data="delayByMissionData" :options="delayByMissionOptions" />
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard-wrap {
  --panel: rgba(16, 27, 48, 0.82);
  background:
    radial-gradient(circle at 10% 0%, rgba(72, 86, 150, 0.34), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(252, 122, 30, 0.16), transparent 24%),
    linear-gradient(165deg, #0d1430 0%, #10182c 44%, #18213a 100%);
  min-height: 100vh;
}

.brand-bar {
  background: rgba(24, 33, 58, 0.9);
  border: 1px solid rgba(231, 231, 231, 0.12);
}

.brand-lockup {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  width: clamp(180px, 24vw, 260px);
  max-height: 56px;
}

.dashboard-title {
  font-family: 'Space Grotesk', 'Avenir Next', sans-serif;
  letter-spacing: 0;
  font-size: clamp(2rem, 3vw, 3rem);
  margin-bottom: 0.35rem;
}

.network-hero {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: rgba(17, 24, 44, 0.45);
  border: 1px solid rgba(231, 231, 231, 0.12);
  box-shadow: 0 18px 42px rgba(3, 8, 19, 0.4);
}

.network-hero > * {
  position: relative;
  z-index: 2;
}

.network-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--hero-bg-image);
  background-size: cover;
  background-position: center 42%;
  opacity: 0.66;
  z-index: 0;
}

.network-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, rgba(24, 33, 58, 0.52), rgba(17, 24, 44, 0.46)),
    radial-gradient(circle at 100% 0%, rgba(72, 86, 150, 0.2), transparent 56%),
    linear-gradient(180deg, rgba(16, 24, 44, 0.1), rgba(16, 24, 44, 0.32));
  z-index: 1;
}

.hero-controls {
  min-width: 240px;
  max-width: 320px;
  width: 100%;
}

.hero-summary {
  font-size: 1.05rem;
  color: #E7E7E7;
}

.hero-eyebrow {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-size: 0.72rem;
  font-weight: 700;
}

.hero-eyebrow-label {
  color: #FC7A1E;
}

.hero-readiness {
  border-top: 1px solid rgba(231, 231, 231, 0.14);
  padding-top: 18px;
}

.readiness-value {
  font-family: 'Space Grotesk', 'Avenir Next', sans-serif;
  font-size: clamp(2rem, 4.3vw, 3.5rem);
  font-weight: 700;
  line-height: 1;
}

.readiness-label {
  font-size: 0.95rem;
  color: #E7E7E7;
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  color: #FC7A1E;
  font-size: 1.42rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding-bottom: 8px;
}

.section-title-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-title-icon {
  font-size: 2rem;
  color: #E7E7E7;
  opacity: 0.84;
}

.trend-section {
  background: rgba(24, 33, 58, 0.74);
  border: 1px solid rgba(231, 231, 231, 0.12);
}

.trend-tile {
  background: rgba(17, 24, 44, 0.72);
  border: 1px solid rgba(231, 231, 231, 0.1);
}

.graph-tile {
  height: 240px;
}

@media (max-width: 960px) {
  .dashboard-wrap {
    padding-top: 1.25rem;
  }
}
</style>

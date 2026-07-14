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
const missionSelector = ref<string>('all')

const allMissions = computed(() => {
  return [...dataset.missions].sort((a, b) => {
    return new Date(`${a.launchDate}T${a.launchTime}:00`).getTime() -
      new Date(`${b.launchDate}T${b.launchTime}:00`).getTime()
  })
})

const selectedMission = computed(() => {
  if (missionSelector.value === 'all') {
    return null
  }
  return allMissions.value.find((mission) => mission.missionId === missionSelector.value) ?? null
})

const scopedMissions = computed(() => {
  if (selectedMission.value) {
    return [selectedMission.value]
  }
  return allMissions.value
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

const watchMissionCount = computed(() => {
  return scopedMissions.value.filter((mission) => mission.missionStatus === 'Watch' || mission.missionStatus === 'Delayed').length
})

const launchesNextSevenDays = computed(() => {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000
  return upcomingMissions.value.filter((mission) => {
    const launch = new Date(`${mission.launchDate}T${mission.launchTime}:00`)
    return launch.getTime() - now.getTime() <= oneWeekMs
  }).length
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
        borderColor: '#67a7ff',
        backgroundColor: 'rgba(103, 167, 255, 0.16)',
        fill: true,
        tension: 0.32,
      },
      {
        label: 'Spacecraft Health',
        data: scopedMissions.value.map((mission) => mission.spacecraftHealth),
        borderColor: '#36c48a',
        backgroundColor: 'rgba(54, 196, 138, 0.08)',
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
        backgroundColor: ['#3778ff', '#3db58f', '#f0b35f', '#d96571'],
        borderColor: 'rgba(6, 12, 26, 0.5)',
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
        backgroundColor: source.map((mission) => (mission.delayMinutes > 0 ? '#e67767' : '#4d6bb3')),
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

const missionOptions = computed(() => {
  return [
    { title: 'All Missions', value: 'all' },
    ...allMissions.value.map((mission) => ({
      title: `${mission.missionId} - ${mission.destination}`,
      value: mission.missionId,
    })),
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
    <v-row class="mb-5" align="stretch">
      <v-col cols="12" lg="8">
        <v-card class="hero-card pa-4 pa-md-6" rounded="xl">
          <div class="d-flex flex-wrap align-center ga-3 mb-3">
            <div class="text-overline text-info">Meridian Space Mission Operations</div>
            <v-chip :color="statusColor" size="small" label>{{ statusTag }} Network</v-chip>
            <v-chip color="secondary" size="small" label>
              Updated {{ new Date(dataset.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
            </v-chip>
          </div>
          <h1 class="dashboard-title">Operations Command Center</h1>
          <p class="hero-subtitle text-medium-emphasis mb-5">
            Immediate transportation network awareness for {{ dataset.year }} missions. Focused on active risks,
            launch execution, and fleet readiness.
          </p>

          <v-row dense>
            <v-col cols="12" md="4">
              <v-sheet class="hero-stat pa-4" rounded="lg">
                <div class="text-caption text-medium-emphasis">Requires Action Now</div>
                <div class="text-h3 font-weight-bold mt-1">{{ missionsNeedingAttention.length }}</div>
                <div class="text-caption mt-1">Mission operations queue</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="4">
              <v-sheet class="hero-stat pa-4" rounded="lg">
                <div class="text-caption text-medium-emphasis">Open Operational Alerts</div>
                <div class="text-h3 font-weight-bold mt-1">{{ openAlertCount }}</div>
                <div class="text-caption mt-1">Across selected network scope</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="4">
              <v-sheet class="hero-stat pa-4" rounded="lg">
                <div class="text-caption text-medium-emphasis">Launches Next 7 Days</div>
                <div class="text-h3 font-weight-bold mt-1">{{ launchesNextSevenDays }}</div>
                <div class="text-caption mt-1">Schedule pressure indicator</div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="section-card h-100" rounded="xl">
          <v-card-text class="pa-4 pa-md-5 d-flex flex-column ga-4">
            <v-select
              v-model="missionSelector"
              :items="missionOptions"
              label="Mission Selector"
              variant="outlined"
              density="comfortable"
              bg-color="rgba(11, 20, 37, 0.9)"
              hide-details
            />

            <div class="scan-grid">
              <div class="scan-item">
                <div class="scan-label">Network Health</div>
                <div class="scan-value">{{ networkHealthScore }}%</div>
              </div>
              <div class="scan-item">
                <div class="scan-label">Active Missions</div>
                <div class="scan-value">{{ upcomingMissions.length }}</div>
              </div>
              <div class="scan-item">
                <div class="scan-label">Delayed Launches</div>
                <div class="scan-value">{{ delayedLaunchCount }}</div>
              </div>
              <div class="scan-item">
                <div class="scan-label">Watch Missions</div>
                <div class="scan-value">{{ watchMissionCount }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-5">
      <v-col cols="12">
        <v-alert
          v-if="priorityAlerts.length > 0"
          type="error"
          variant="tonal"
          border="start"
          class="command-alert"
        >
          <div class="d-flex align-center justify-space-between ga-4 flex-wrap">
            <div>
              <strong>{{ priorityAlerts.length }} critical operational alerts require immediate attention.</strong>
              <div class="text-body-2 mt-1">{{ priorityAlerts[0]?.missionId }}: {{ priorityAlerts[0]?.message }}</div>
            </div>
            <v-chip color="error" label>Priority 1</v-chip>
          </div>
        </v-alert>
        <v-alert v-else type="success" variant="tonal" border="start" class="command-alert">
          No critical operational alerts. Network is stable.
        </v-alert>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" xl="8">
        <v-card class="section-card" rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>What Needs Attention Right Now</span>
            <v-chip color="warning" size="small" label>{{ missionsNeedingAttention.length }} in Queue</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="missionsNeedingAttention.length === 0" class="text-medium-emphasis">
              No missions currently require intervention.
            </div>
            <v-list v-else class="bg-transparent pa-0" lines="three">
              <v-list-item v-for="mission in missionsNeedingAttention" :key="`attention-${mission.missionId}`" class="px-0 queue-item">
                <template #prepend>
                  <v-chip :color="formatStatusColor(mission.missionStatus)" label size="small">
                    {{ mission.missionStatus }}
                  </v-chip>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ mission.missionId }} - {{ mission.spacecraftName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ mission.origin }} to {{ mission.destination }} | {{ formatDateTime(mission) }}
                </v-list-item-subtitle>
                <v-list-item-subtitle>
                  Readiness {{ mission.launchReadinessScore }}% | Delay {{ mission.delayMinutes }} min | Alerts {{ mission.operationalAlerts.length }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <v-card class="section-card mb-4" rounded="xl">
          <v-card-title>Launch Board</v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="upcomingMissions.length === 0" class="text-medium-emphasis">
              No upcoming launches in the selected scope.
            </div>
            <v-timeline v-else density="compact" side="end" align="start">
              <v-timeline-item
                v-for="mission in upcomingMissions.slice(0, 5)"
                :key="`upcoming-${mission.missionId}`"
                :dot-color="formatStatusColor(mission.missionStatus)"
                size="small"
              >
                <div class="font-weight-medium">{{ mission.missionId }} - {{ mission.destination }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatDateTime(mission) }}</div>
                <div class="text-caption">Crew {{ mission.crewCount }} | Fuel {{ mission.fuelStatus }}%</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <v-card class="section-card" rounded="xl">
          <v-card-title>Operational Alerts Feed</v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="flattenedAlerts.length === 0" class="text-medium-emphasis">No alerts in the selected mission scope.</div>
            <v-list v-else class="bg-transparent pa-0" lines="two">
              <v-list-item v-for="(alert, index) in flattenedAlerts.slice(0, 6)" :key="`${alert.missionId}-${index}`" class="px-0">
                <template #prepend>
                  <v-icon :color="alert.severity === 'High' ? 'error' : alert.severity === 'Medium' ? 'warning' : 'info'" icon="mdi-alert-circle-outline" />
                </template>
                <v-list-item-title>{{ alert.message }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ alert.missionId }} | {{ alert.category }} | {{ alert.severity }} | {{ alert.status }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="section-card" rounded="xl">
          <v-card-title>Fleet Readiness and Supporting Systems</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col v-for="spacecraft in fleetSummary" :key="spacecraft.spacecraftName" cols="12" sm="6" lg="4" xl="3">
                <v-sheet class="fleet-tile pa-4" rounded="lg">
                  <div class="d-flex justify-space-between align-center">
                    <div class="font-weight-bold">{{ spacecraft.spacecraftName }}</div>
                    <v-chip :color="spacecraft.communications === 'Watch' ? 'warning' : 'success'" size="x-small" label>
                      {{ spacecraft.communications }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">{{ spacecraft.missionCount }} mission records in scope</div>
                  <v-progress-linear :model-value="spacecraft.health" color="info" height="8" rounded class="mb-2" />
                  <div class="text-caption mb-1">Spacecraft health {{ spacecraft.health }}%</div>
                  <v-progress-linear :model-value="spacecraft.crew" color="success" height="8" rounded class="mb-2" />
                  <div class="text-caption mb-1">Crew readiness {{ spacecraft.crew }}%</div>
                  <v-progress-linear :model-value="spacecraft.readiness" color="primary" height="8" rounded class="mb-2" />
                  <div class="text-caption">Launch readiness {{ spacecraft.readiness }}%</div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="section-card subdued" rounded="xl">
          <v-card-title>Operational Trends (Supporting Context)</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" lg="7">
                <v-sheet class="trend-tile pa-3" rounded="lg" min-height="230">
                  <Line :data="readinessTrendData" :options="readinessTrendOptions" />
                </v-sheet>
              </v-col>
              <v-col cols="12" sm="6" lg="3">
                <v-sheet class="trend-tile pa-3" rounded="lg" min-height="230">
                  <Doughnut :data="statusDistributionData" :options="statusDistributionOptions" />
                </v-sheet>
              </v-col>
              <v-col cols="12" sm="6" lg="2">
                <v-sheet class="trend-tile pa-3" rounded="lg" min-height="230">
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
  --panel: rgba(17, 28, 49, 0.82);
  --panel-soft: rgba(23, 36, 62, 0.66);
  background:
    radial-gradient(circle at 12% 18%, rgba(71, 113, 220, 0.24), transparent 42%),
    radial-gradient(circle at 84% 0%, rgba(48, 88, 170, 0.2), transparent 32%),
    linear-gradient(160deg, #060d1b 0%, #081328 35%, #0b1831 100%);
  min-height: 100vh;
}

.dashboard-title {
  font-family: 'Space Grotesk', 'Avenir Next', sans-serif;
  letter-spacing: 0.01em;
  font-size: clamp(1.8rem, 2.6vw, 2.8rem);
  margin-bottom: 0.6rem;
}

.section-card {
  background: var(--panel);
  border: 1px solid rgba(137, 162, 214, 0.16);
  backdrop-filter: blur(6px);
}

.hero-card {
  background:
    linear-gradient(120deg, rgba(18, 34, 64, 0.92), rgba(13, 25, 47, 0.9)),
    radial-gradient(circle at 100% 0%, rgba(91, 132, 243, 0.24), transparent 48%);
  border: 1px solid rgba(133, 164, 230, 0.22);
}

.hero-subtitle {
  max-width: 64ch;
}

.hero-stat {
  background: rgba(15, 26, 46, 0.7);
  border: 1px solid rgba(124, 153, 214, 0.2);
}

.scan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.scan-item {
  background: rgba(13, 24, 44, 0.7);
  border: 1px solid rgba(130, 156, 210, 0.16);
  border-radius: 10px;
  padding: 12px;
}

.scan-label {
  font-size: 0.75rem;
  color: #9ab0dd;
  margin-bottom: 6px;
}

.scan-value {
  font-family: 'Space Grotesk', 'Avenir Next', sans-serif;
  font-size: 1.45rem;
  font-weight: 700;
}

.command-alert {
  border: 1px solid rgba(214, 111, 121, 0.32);
}

.queue-item {
  border-bottom: 1px solid rgba(141, 164, 208, 0.12);
}

.subdued {
  background: rgba(13, 21, 38, 0.76);
}

.fleet-tile {
  background: var(--panel-soft);
  border: 1px solid rgba(137, 162, 214, 0.14);
}

.trend-tile {
  background: rgba(10, 18, 33, 0.72);
  border: 1px solid rgba(121, 146, 198, 0.14);
}

@media (max-width: 960px) {
  .dashboard-wrap {
    padding-top: 1.25rem;
  }

  .scan-grid {
    grid-template-columns: 1fr;
  }
}
</style>

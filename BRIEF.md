# Meridian Space — Mission Operations Dashboard

## What is this?

This is a single-page operational dashboard for Meridian Space, a fictional commercial space transportation company whose mission is to make travel beyond Earth as routine, reliable, and accessible as commercial air travel.

The dashboard is used by the Mission Operations Director to monitor the health of the Meridian Space transportation network. It should provide immediate operational awareness, allowing leadership to quickly identify issues, understand network readiness, and make informed decisions without navigating multiple systems.

Think airline operations center, not NASA mission control.

---

## User

**Primary User**

Mission Operations Director

This user oversees daily commercial spaceflight operations including launch readiness, fleet health, passenger readiness, weather conditions, and operational alerts.

The dashboard should answer questions such as:

- Is the transportation network healthy?
- Which missions require attention?
- Are today's launches on schedule?
- Are crews and passengers ready?
- Is weather creating operational risk?
- Are any spacecraft experiencing issues?

---

## Experience Principles

The dashboard should prioritize operational awareness over historical analytics.

The user should understand the overall health of the transportation network within five seconds of opening the application.

The experience should prioritize clarity and simplicity over technical complexity. Information should be easy to understand, even for users without an aerospace background.

Information should be presented in order of operational importance.

Historical charts should support decision making rather than dominate the experience.

The experience should feel calm, trustworthy, and operational rather than exciting or futuristic.

---

## Visual Hierarchy

The interface should guide attention from highest priority to lowest priority.

**Priority 1**
Critical operational alerts requiring immediate attention.

**Priority 2**
Overall transportation network health.

**Priority 3**
Missions requiring attention and upcoming launches.

**Priority 4**
Fleet readiness and supporting operational systems.

**Priority 5**
Historical operational trends and analytics.

Supporting information should become progressively less prominent throughout the experience.

---

## Data

Generate a realistic fake dataset as a local JSON file at `src/data/missions.json`.

The dataset should represent a mature commercial space transportation network operated by Meridian Space.

The dashboard should present aggregated operational information rather than focusing on individual missions.

Requirements:

- Approximately 48 missions across the year 2026 (roughly 4 launches per month).
- Launches should be distributed naturally throughout the year.
- Reuse the same spacecraft across multiple missions to simulate an active fleet:
  - Meridian Atlas
  - Meridian Aurora
  - Meridian Odyssey
  - Meridian Horizon
  - Meridian Zenith
- Include a mix of mission types:
  - Tourism
  - Research
  - Cargo
  - Crew Rotation
  - Station Resupply
  - Maintenance
- Most missions should operate normally, with occasional watch conditions, delays, and operational alerts to create meaningful operational scenarios.
- Preserve a consistent JSON structure so the dashboard can aggregate and filter the data.
- The data should feel believable and communicate that commercial space travel has become routine, similar to a modern airline network.

---

## Interactions

The dashboard should allow users to quickly understand the health of the Meridian Space transportation network and identify areas requiring attention.

The dashboard should emphasize the overall health of the network before exposing detailed operational information.

The experience should support filtering and exploration of the operational data while preserving meaningful context across the dashboard.

Status indicators should clearly communicate Nominal, Watch, and Critical states.

Trend indicators should communicate improving or declining operational health.

Handle empty states gracefully.

Interactions should feel fast, intuitive, and require minimal effort to understand.

---

## Responsive Behavior

The experience should work equally well on desktop and mobile devices.

Desktop should prioritize situational awareness with multiple operational panels visible simultaneously.

Mobile should prioritize quick status checks using a vertically stacked layout while preserving the same information hierarchy.

The most important operational information should remain visible without excessive scrolling on both screen sizes.

Charts should resize appropriately and remain readable on smaller screens.

---

## Visual Style

- Dark theme by default
- Premium enterprise operations software
- Calm and information-focused
- Deep navy and charcoal backgrounds
- White typography
- Restrained blue accent colors
- Limited use of warning and critical colors
- Consistent spacing and visual hierarchy
- Charts should use a cohesive color palette
- Avoid science-fiction UI, neon effects, glowing elements, or video game aesthetics

The interface should communicate confidence, precision, and operational excellence while making commercial space transportation feel routine and dependable.
---

## Technical Requirements

- Vue 3
- TypeScript
- Vue Router
- Vuetify 3
- Chart.js via vue-chartjs
- Local JSON data only
- No API calls
- Responsive layout
- Single-page application
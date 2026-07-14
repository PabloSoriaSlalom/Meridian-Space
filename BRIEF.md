# Meridian Space — Mission Operations Dashboard

## What is this?

This is a single-page operational dashboard for Meridian Space, a fictional commercial space transportation company whose mission is to make travel beyond Earth as routine, reliable, and accessible as commercial air travel.

The dashboard is used by the Mission Operations Director to monitor the health of the Meridian Space transportation network. It should provide immediate operational awareness, allowing leadership to quickly identify issues, monitor mission readiness, and make informed decisions without navigating multiple systems.

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

Supporting information should become progressively less prominent as the user scrolls.

---

## Data

Generate a realistic fictional dataset as a local JSON file:

`src/data/missions.json`

Create twelve scheduled missions across 2026.

The dataset should represent a mature commercial space transportation company where launches occur routinely throughout the year. Most missions should appear healthy while a small number contain operational issues requiring attention.

Mission IDs should follow a consistent naming convention such as:

- MS-101
- MS-102
- MS-103

Spacecraft should have unique names representing the Meridian Space fleet (for example, Meridian Atlas, Meridian Aurora, Meridian Odyssey, and Meridian Horizon).

Meridian Space operates from a primary launch facility called **Meridian Spaceport** and serves destinations such as:

- Low Earth Orbit
- Meridian Orbital Station
- Lunar Gateway
- Research Platform Alpha
- Tranquility Base

Each mission should contain:

- Mission ID
- Spacecraft Name
- Mission Type (Tourism, Research, Cargo, Crew Rotation, Station Resupply, Maintenance)
- Origin
- Destination
- Launch Date
- Launch Time
- Mission Status
- Launch Readiness Score
- Spacecraft Health
- Crew Readiness
- Passenger Check-in Percentage
- Passenger Count
- Fuel Status
- Weather Risk
- Communications Status
- Life Support Status
- Mission Duration
- Delay Minutes
- Operational Alerts

The dataset should include realistic operational variation.

Examples include:

- Most missions should have a Nominal status.
- One mission should be delayed due to weather.
- One mission should have reduced passenger check-in.
- One mission should have a communications warning.
- One mission should have a lower launch readiness score due to maintenance.

Operational issues should feel realistic and manageable rather than catastrophic.

---

## Layout

The dashboard should be organized into clear operational sections rather than a traditional analytics dashboard.

### Network Status

Provide an immediate summary of the transportation network including overall operational health, active missions, delayed launches, and critical alerts.

### Mission Operations

Display missions requiring attention first, followed by upcoming launches.

### Fleet Status

Display spacecraft health, crew readiness, communications status, and supporting operational systems.

### Operational Trends

Display historical trends that help explain performance over time without becoming the primary focus of the experience.

Use Vuetify components throughout the application.

---

## Interactions

- Mission selector filters the entire dashboard.
- "All Missions" displays network-wide metrics.
- Selecting a mission updates all operational panels and charts.
- Status indicators should clearly communicate Nominal, Watch, and Critical states.
- Trend indicators should communicate improving or declining operational health.
- Handle empty states gracefully.

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

The interface should communicate confidence, precision, and operational excellence.

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
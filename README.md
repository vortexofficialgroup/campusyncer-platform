<div align="center">
  <!-- Animated Wave Header -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:08110f,50:153e2e,100:53dfa8&height=210&section=header&text=CampuSync&fontSize=56&fontColor=ffffff&fontAlignY=38&desc=By%20Vortex%20Group%20%E2%80%A2%20Dubai,%20UAE&descSize=16&descAlignY=58&animation=fadeIn" width="100%" alt="CampuSync Banner" />

  <!-- Animated Typing Tagline -->
  <a href="https://github.com/astrax-gif">
    <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&duration=2800&pause=1000&color=53DFA8&center=true&vCenter=true&multiline=false&width=680&lines=Real-Time+Campus+Room+Visibility.+Deployed+in+Minutes.;Interactive+Floor+Plans+%26+Live+Schedule+Sync.;Multi-Tenant+University+Portals+(%3Cuni%3E.campusync.net);Built+in+Dubai+for+Modern+Campuses+Worldwide." alt="Typing SVG" />
  </a>

  <br /><br />

  <!-- Tech Stack & Status Badges -->
  <p>
    <img src="https://img.shields.io/badge/Vortex_Group-Flagship_Product-53dfa8?style=for-the-badge&labelColor=08110f" alt="Vortex Group" />
    <img src="https://img.shields.io/badge/React_18-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=08110f" alt="React TypeScript" />
    <img src="https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=08110f" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=08110f" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vercel-Multi--Tenant_Edge-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=08110f" alt="Vercel" />
  </p>
</div>

---

## Overview

**CampuSync** transforms static university timetables and scattered room spreadsheets into a **live spatial operating layer** for students, faculty, and facilities teams.

Starting with **University of Europe for Applied Sciences (UE Dubai)** and built to scale across campuses globally, CampuSync combines a **self-serve university onboarding & checkout hub** (`campusyncer.com`) with **isolated, real-time tenant portals** (`<university>.campusyncer.com`).

---

## Core Capabilities

| Module | What It Does |
| :--- | :--- |
| **Live Spatial Floor Plans** | Real-time room status (`Available`, `In session`, `Booked`), seat capacity, and next-slot countdowns across wings and floors. |
| **Multi-Tenant Subdomain Engine** | Automatic tenant resolution from custom subdomains (`uedubai.campusync.net`, `mdx.campusync.net`), Vercel aliases, or query routes. |
| **4-Step Self-Serve Onboarding** | Live subdomain slug availability checker, campus scale estimator, AED/USD pricing toggle, and instant tenant provisioning. |
| **Dual Institutional Billing** | Supports both **Instant Card Activation** (Stripe Checkout) and **Pro-Forma Invoice / PO Requests** with a 14-day sandbox preview. |
| **Vortex Group Command Center** | Internal admin dashboard to review incoming university applications, approve PO/invoice requests, and toggle live room statuses. |

---

## Architecture

```text
campuSync/
├── public/
│   └── campusync-logo.svg        # Brand vector mark
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Supabase PostgreSQL client + multi-tenant subdomain resolver
│   ├── App.tsx                   # Main hub, interactive preview, onboarding wizard, tenant portal & admin
│   ├── index.css                 # Dark/Light theme system & responsive glassmorphic styling
│   └── main.tsx                  # Application entry point
├── supabase/
│   └── schema.sql                # PostgreSQL tables, RLS policies, and UE Dubai seed data
├── vercel.json                   # SPA & wildcard subdomain rewrite rules
└── .env.example                  # Required environment variables

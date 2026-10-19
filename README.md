# FALE — Healthcare Careers & Hospital Workforce Platform

A modern, high-performance healthcare workforce and clinical recruitment web application built with **React 19**, **Vite**, **TypeScript (TSX)**, and **Tailwind CSS v4**.

FALE connects verified healthcare professionals (doctors, nurses, allied health specialists, and pharmacists) with premier hospital networks, diagnostic centers, and certified clinics across India.

---

## 🚀 Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/) with fast Hot Module Replacement (HMR)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Routing**: [TanStack Router](https://tanstack.com/router) with automatic file-based code splitting
- **Data & State**: [TanStack Query](https://tanstack.com/query) + reactive client store
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives + custom FALE design system
- **Icons & Motion**: [Heroicons v2](https://heroicons.com/), [Remix Icons](https://remixicon.com/), and [Lottie](https://airbnb.io/lottie/)
- **Theme**: Instant Light / Dark mode with automatic OS preference detection and seamless `/onboarding` light isolation

---

## 🏥 Platform Features

1. **AI & Clinical Credential Matching**:
   - Executive match briefing and fast-track 5-day placement program.
   - Filter jobs by department/specialty, qualification, salary, hospital network, and shift timing.

2. **Locum & Urgent Shifts Feed**:
   - Instant shift claiming for ICU, Emergency, Inpatient Ward, and Diagnostics.
   - Live availability toggle (*Open to Work*).

3. **Digital Credentials & DigiLocker Verification**:
   - Step-by-step document verification modal connecting NMC / State Medical Council registrations, NABH certifications, and DigiLocker badges.

4. **FALE Clinical Academy**:
   - Free certified clinical training modules in ACLS, ICU Safety, and Infection Control.

5. **Multi-Role Support**:
   - **Candidate Portal**: Profile strength meter, application tracking pipeline, and clinical CV export.
   - **Facility / Employer Portal**: Post hospital requirements, review qualified applicant credentials, and fast-track candidate screening.

6. **Responsive & Accessible**:
   - Mobile-first layouts with bottom-sheet filter panels and sticky action docks.
   - Notification drawer with LinkedIn/Naukri/Apple-style segmented feeds (All, Matches, Shifts, System).

---

## 📂 Project Structure

```
FALE-healthcare-ui/
├── index.html               # Main HTML entry with anti-FOUC theme script
├── vite.config.ts           # Vite configuration with React, TanStack Router & Tailwind CSS
├── tsconfig.json            # TypeScript strict configuration
├── components.json          # UI design system schema configuration
├── package.json             # Project dependencies and npm scripts
│
├── public/                  # Static assets and favicons
│
└── src/
    ├── main.tsx             # Application bootstrap & DOM root mount
    ├── router.tsx           # TanStack Router instance & context provider
    ├── routeTree.gen.ts     # Auto-generated type-safe route tree
    ├── styles.css           # Tailwind CSS v4 design tokens and theme variables
    │
    ├── assets/              # Healthcare photography, banners & Lottie JSON
    │   ├── home-banner.jpg
    │   ├── auth-candidate.jpeg
    │   ├── auth-facility.jpg
    │   └── lottie-error.json
    │
    ├── components/
    │   ├── fale/            # FALE domain components (AppShell, AuthLayout, JobCard, ThemeToggle, DigiLockerModal, Logo)
    │   └── ui/              # Radix UI foundational components (button, dialog, sheet, tabs, sonner)
    │
    ├── hooks/               # Custom React hooks (useMobile, useTheme)
    │
    ├── lib/                 # Core utilities and data
    │   ├── data.ts          # Mock healthcare jobs, shifts, courses and employers
    │   ├── store.ts         # Global client-side application state store
    │   ├── theme.ts         # Theme manager (light, dark, system)
    │   └── utils.ts         # Tailwind class merging utility (`cn`)
    │
    └── routes/              # File-based routes
        ├── __root.tsx       # Root layout, theme listener & error boundary
        ├── index.tsx        # Landing page
        ├── home.tsx         # Candidate dashboard & executive matches
        ├── jobs.index.tsx   # Healthcare job search & filter directory
        ├── jobs.$id.tsx     # Job detail & instant application
        ├── shifts.tsx       # Locum & emergency hospital shifts
        ├── learning.index.tsx # FALE Clinical Academy course catalog
        ├── learning.$id.tsx # Interactive course viewer & video player
        ├── applications.tsx # Applied positions tracking pipeline
        ├── profile.tsx      # Clinical credentials, NABH/NMC verification & profile strength
        ├── notifications.tsx # Real-time notification feed
        ├── onboarding.tsx   # Step-by-step candidate/facility registration
        ├── login.tsx        # Authentication & social sign-in
        ├── verify.tsx       # OTP verification
        ├── employer.index.tsx # Facility recruitment dashboard
        ├── employer.post.tsx  # Post new healthcare openings
        └── employer.applicants.tsx # Review candidate credential submissions
```

---

## 🛠️ Development & Build

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5173/`.

### Run Production Build
```bash
npm run build
```
Creates an optimized production bundle in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Run Tests
```bash
npm run test
```

---

## 📄 License

Private & Proprietary — FALE Healthcare Platform.

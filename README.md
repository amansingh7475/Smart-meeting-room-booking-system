# 🏢 Smart Meeting Room Booking System (Co-Working Space)

A modern, full-stack **MERN (MongoDB, Express, React, Node.js)** prototype built in **TypeScript** for a co-working space featuring three fixed meeting rooms with a **strict double-booking prevention engine**.

---

## 📌 Problem Statement & Requirements

1. **Co-working Prototype**: Prototype designed specifically for co-working spaces with dynamic shared usage.
2. **Three Fixed Meeting Rooms**:
   - 🔵 **Blue Room** (Capacity: 10, 2nd Floor Tech Hub, Cisco Webex, Dual 4K Displays, Glass Whiteboards)
   - 🔴 **Red Room** (Capacity: 16, 3rd Floor Executive Boardroom, Polycom Audio, 85" Screen, Sound Isolation)
   - 🟡 **Yellow Room** (Capacity: 6, 1st Floor Creative Lounge, Idea Wall, Podcast Mics, Lounge Seating)
3. **Critical Requirement**: **The system MUST prevent double bookings** under all circumstances, including high-concurrency race conditions (simultaneous multi-user requests arriving at the exact same millisecond).
4. **Tech Stack**: Full TypeScript MERN stack (Express + Node + Mongoose + React 18 + Vite + Tailwind CSS).

---

## 🛡️ Critical Requirement: Double-Booking Prevention Architecture

Double booking is the primary failure mode in shared meeting systems. This project implements a **multi-layered concurrency protection strategy**:

### 1. Mathematical Interval Overlap Definition
Two bookings $[S_1, E_1]$ and $[S_2, E_2]$ for the same room collide if and only if:
$$\max(S_1, S_2) < \min(E_1, E_2) \iff S_2 < E_1 \text{ and } E_2 > S_1$$

- **Boundary Touching Allowed**: If Meeting A ends at 11:00 AM ($E_1 = 11:00$) and Meeting B starts at 11:00 AM ($S_2 = 11:00$), $S_2 < E_1$ is **false**, allowing back-to-back meetings without gaps.
- **Cancelled Bookings Excluded**: Cancelled reservations immediately liberate the time slot.

### 2. Process-Level Mutual Exclusion (Mutex Locks)
In asynchronous Node.js runtimes, if two requests query the database at the exact same instant, both will see "slot available" and proceed to insert, causing a double-booking race condition.
- **Solution**: We implement an in-memory key-based mutex (`async-mutex`) partitioned **per room**.
- When a booking arrives for the Blue Room, the mutex for `room:blue` is acquired before checking overlap and held until the insert completes.
- Requests for **different rooms** execute fully in parallel without bottlenecking each other.
- Competing requests for the **same room** are strictly serialized at the nanosecond boundary: the first request inserts, and the second request immediately encounters the newly committed booking and receives an `HTTP 409 Conflict`.

### 3. Database Indexing & Atomic Verification
- High-performance compound indexes on MongoDB:
  ```typescript
  BookingSchema.index({ roomId: 1, status: 1, startTime: 1, endTime: 1 });
  BookingSchema.index({ roomCode: 1, status: 1, startTime: 1, endTime: 1 });
  ```
- Instant sub-millisecond overlap queries even with tens of thousands of historical records.
- Zero-configuration local execution: connects automatically to your local MongoDB (`mongodb://127.0.0.1:27017`) or automatically spins up an in-memory MongoDB replica for seamless portability.

---

## ⚡ Concurrency Verification & Live Testing Lab

We provide **two distinct ways** to verify that race-condition double bookings are 100% prevented:

### 1. Interactive UI Stress-Test Lab (One-Click in Browser)
1. Open the web application and click **"⚡ Stress Test: Concurrency Lab"** in the top navigation bar.
2. Select target room (Blue, Red, or Yellow) and choose the number of simultaneous attempts (e.g., 5 or 10 parallel requests).
3. Click **"Fire Simultaneous Race-Condition Requests"**.
4. The system fires all requests at the exact same millisecond via `Promise.all()`.
5. The UI displays an animated waterfall audit showing **exactly 1 request succeeded (`201 CREATED`)** and **all other requests were blocked (`409 CONFLICT`)** with timestamps.

### 2. Automated CLI Concurrency Test
Run the stress test directly in the terminal:
```bash
npm run test:concurrency
```
**Sample Output:**
```
========================================================
🧪 RUNNING CRITICAL DOUBLE-BOOKING CONCURRENCY STRESS TEST
========================================================
Target Room: Blue Room
Time Slot: 2026-11-07T10:00:00.000Z to 2026-11-07T11:00:00.000Z
Simulating 10 parallel requests competing for the exact same slot at the exact same instant...

--- TEST RESULTS ---
Execution Time: 175ms
Total Concurrent Requests: 10
Successful Bookings: 1
Blocked Double-Bookings (409 Conflict): 9

Details:
  [Req #1] 🛡️ BLOCKED: Double-booking prevented! Blue Room is already booked for "Race Condition Competitor #2" (10:00 AM - 11:00 AM) by User_2.
  [Req #2] ✅ SUCCESS: Booking created successfully by User_2
  [Req #3] 🛡️ BLOCKED: Double-booking prevented! Blue Room is already booked for "Race Condition Competitor #2" (10:00 AM - 11:00 AM) by User_2.
  ...
🏆 TEST PASSED: DOUBLE-BOOKING WAS 100% PREVENTED UNDER HIGH CONCURRENCY!
========================================================
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- npm v9+

### Step 1: Install Dependencies
From the repository root:
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### Step 2: Seed Sample Data (Optional)
Pre-populates the 3 fixed rooms and realistic sample bookings:
```bash
npm run seed --prefix backend
```

### Step 3: Run the Application
You can run both backend and frontend concurrently with a single command from root:
```bash
npm run dev
```

Or run each service individually:
- **Backend API**: `cd backend && npm run dev` (Runs on `http://127.0.0.1:4000`)
- **Frontend App**: `cd frontend && npm run dev` (Runs on `http://localhost:5173`)

Open [http://localhost:5173](http://localhost:5173) in your web browser!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms` | Lists all 3 fixed rooms with live current occupancy status |
| `GET` | `/api/rooms/:identifier` | Get single room details by code (`blue`, `red`, `yellow`) or ID |
| `GET` | `/api/bookings` | List bookings with query filters (`roomCode`, `date`, `status`) |
| `POST` | `/api/bookings` | Create a booking with strict concurrency lock (Returns 201 or 409) |
| `GET` | `/api/bookings/check-availability` | Pre-flight availability check for slot before booking |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking and immediately release the room slot |
| `POST` | `/api/bookings/simulate-concurrency` | Stress-test endpoint firing N simultaneous race-condition requests |
| `GET` | `/api/bookings/stats` | Analytics summary: utilization rates and booking distribution |
| `GET` | `/api/health` | Health check probe |

### Sample Create Booking Request
```bash
POST http://127.0.0.1:4000/api/bookings
Content-Type: application/json

{
  "roomId": "blue",
  "title": "Quarterly Strategy Review",
  "organizerName": "Aman Singh",
  "organizerEmail": "aman@coworking.space",
  "attendeesCount": 6,
  "startTime": "2026-11-06T14:00:00.000Z",
  "endTime": "2026-11-06T15:30:00.000Z"
}
```

### Double-Booking Conflict Response (`409 Conflict`)
```json
{
  "success": false,
  "error": "Double-Booking Conflict",
  "message": "Double-booking prevented! Blue Room is already booked for \"Quarterly Strategy Review\" (02:00 PM - 03:30 PM) by Aman Singh.",
  "conflict": {
    "conflictingBookingId": "6aed9bc65c4aa7da8574c3c5",
    "title": "Quarterly Strategy Review",
    "organizerName": "Aman Singh",
    "startTime": "2026-11-06T14:00:00.000Z",
    "endTime": "2026-11-06T15:30:00.000Z"
  }
}
```

---

## 📂 Project Architecture

```
Aman_Singh-MERN/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # Auto-connecting MongoDB / In-memory fallback & room seeder
│   │   │   └── rooms.config.ts     # Definitions for Blue, Red, and Yellow rooms
│   │   ├── controllers/
│   │   │   ├── booking.controller.ts # Handlers with Zod validation and 409 conflict catches
│   │   │   └── room.controller.ts    # Room listing with live occupancy enrichment
│   │   ├── models/
│   │   │   ├── Booking.ts          # Mongoose schema with compound interval indexes
│   │   │   └── Room.ts             # Fixed meeting room schema
│   │   ├── routes/
│   │   │   ├── booking.routes.ts   # Express booking routes
│   │   │   └── room.routes.ts      # Express room routes
│   │   ├── scripts/
│   │   │   ├── concurrency-test.ts # CLI stress-testing script (10 concurrent requests)
│   │   │   └── seed.ts             # Seed realistic meetings across all 3 rooms
│   │   ├── services/
│   │   │   └── booking.service.ts  # Critical Section Mutex locking & interval overlap engine
│   │   ├── validators/
│   │   │   └── booking.validator.ts# Zod schemas (duration >= 15m, end > start, valid dates)
│   │   └── server.ts               # Express application entrypoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Axios client for rooms, bookings, and simulation
│   │   ├── components/
│   │   │   ├── BookingModal.tsx    # Modal with real-time live availability check
│   │   │   ├── BookingsList.tsx    # Reservations table with search, filter, and cancellation
│   │   │   ├── ConcurrencySimulatorModal.tsx # Interactive UI race-condition testing suite
│   │   │   ├── Header.tsx          # Navigation, actions, and system health status
│   │   │   ├── RoomCards.tsx       # Cards for Blue, Red, Yellow rooms with live status
│   │   │   ├── StatsModal.tsx      # Utilization metrics and room distribution charts
│   │   │   └── TimelineGrid.tsx    # Visual timetable grid (8 AM - 8 PM)
│   │   ├── types/                  # TypeScript interfaces for Room, Booking, Simulation
│   │   ├── utils/                  # Date helpers (date-fns)
│   │   ├── App.tsx                 # Master dashboard orchestrator
│   │   ├── main.tsx
│   │   └── index.css               # Tailwind CSS styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json                    # Root monorepo orchestrator
└── README.md                       # Comprehensive system documentation
```

---

## 🎨 User Interface Highlights

- **Live Occupancy Tracking**: Each room card dynamically displays whether the room is "Available" or "In Use" with the current meeting's title and remaining time.
- **Visual Timetable Grid**: Side-by-side hourly schedule from 8 AM to 8 PM displaying bookings for Blue, Red, and Yellow rooms. Clicking an empty slot pre-fills the booking modal.
- **Pre-Flight Conflict Detector**: As the user selects a time range in the booking form, the system automatically runs an instant pre-flight check and alerts if an overlapping meeting exists before submitting.
- **One-Click Concurrency Demonstrator**: Directly in the browser, an evaluator can trigger simultaneous competing bookings and observe the mutual exclusion mechanism at work.

---

## 👨‍💻 Author
**Aman Singh** — Full Stack MERN & TypeScript Developer

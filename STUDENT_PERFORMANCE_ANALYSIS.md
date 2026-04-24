# Student Performance Hub - Feature Analysis

## 📌 Overview

Your student performance features are built as a modular hub with five interconnected features. All frontend data is stored in **localStorage** while backend provides optional server-side persistence through MongoDB.

---

## 🏗️ Architecture

### Storage Strategy
- **Frontend (Primary)**: localStorage with user-key prefixes (user_id or email)
- **Backend (Secondary)**: MongoDB for server persistence (optional integration)
- **Real-time**: Event-based notifications via window.dispatchEvent

### Frontend Storage Keys
```javascript
// User keys format:
// For ID: u_<userId>
// For Email: e_<email>
// Fallback: guest

// Storage prefixes:
"slms_student_calendar_v1_<userKey>"
"slms_student_goals_bundle_v1_<userKey>"
"slms_student_notifications_v1_<userKey>"
"slms_performance_manual_gpa_v1_<userKey>"
"slms_study_planner_hours_v1_<userKey>"
```

---

## 1️⃣ PERFORMANCE DASHBOARD

### 📊 Purpose
Track academic performance with overall stats, semester-wise breakdown, subject-wise performance, and skill radar charts.

### Frontend Components
- **File**: [StudentPerformanceDashboard.jsx](../frontend/src/studentPerformance/StudentPerformanceDashboard.jsx)
- **Storage**: localStorage for manual GPA override
- **Charts**: Recharts library for visualization

### Data Structure
```javascript
{
  overall: { avgPercentage: 78.4, attemptCount: 12 },
  bySemester: [
    { semester: "Semester 1", avgPercentage: 74.2, attemptCount: 4 },
    // ... more semesters
  ],
  skillRadar: [
    { name: "DSA", value: 84 },
    // ... more skills
  ],
  subjectPerformance: [
    { subject: "Data Structures & Algorithms", avgPercentage: 84.1, attemptCount: 3 },
    // ... more subjects
  ],
}
```

### Backend Models
**Model**: [StudentsPerformanceModel.js](../backend/src/models/StudentsPerformanceModel.js)
```javascript
{
  studentId: String (required)
  subject: String (required)
  mark: Number (0-100, required)
  semester: String (required)
  academicYear: String (required)
  gpa: Number (optional)
  average: Number (optional)
  timestamps: true
}
```

### Backend API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/assessment/performance` | Create performance record |
| PUT | `/api/assessment/performance/:id` | Update performance |
| GET | `/api/assessment/performance/student/:studentId` | Get all performance records |
| GET | `/api/assessment/performance/dashboard/:studentId` | Get dashboard aggregated data |

### Backend Controllers
**File**: [StudentsPerformanceController.js](../backend/src/controllers/StudentsPerformanceController.js)
**Service**: [StudentsPerformanceServices.js](../backend/src/services/StudentsPerformanceServices.js)

#### Key Features:
- Automatic performance-to-goal sync
- Notification creation on record save
- Semester and year filtering
- Dashboard data aggregation

### Frontend Features
✅ **Implemented:**
- KPI cards (Overall GPA, Study Hours, etc.)
- Semester-wise breakdown
- Subject-wise performance tracking
- Skill radar chart (Recharts)
- Manual GPA override (stored in localStorage)
- Demo data fallback
- Loading and error states

### Data Flow
```
API Fetch (getDashboardData) 
  → Backend aggregates scores by subject/semester
  → Frontend stores in state
  → Render KPI cards + Charts
  → Option to manually set GPA (saves to localStorage)
```

### Potential Issues
⚠️ **Issues:**
1. No pagination on subject performance list
2. Demo data hardcoded (5 subjects max)
3. Manual GPA stored only in localStorage (not persisted to server)
4. No error toast notification on API failures
5. Missing semester/year filter UI for dashboard

---

## 2️⃣ ACADEMIC CALENDAR

### 📅 Purpose
Manage academic events (exams, deadlines, lectures, holidays) with reminders, recurring events, and countdown timers.

### Frontend Components
- **File**: [StudentCalendarPage.jsx](../frontend/src/studentPerformance/StudentCalendarPage.jsx)
- **Utilities**: [studentCalendarUtils.js](../frontend/src/studentPerformance/studentCalendarUtils.js)
- **Storage**: [calendarStorage.js](../frontend/src/studentPerformance/calendarStorage.js)
- **Reminders Hook**: [useCalendarReminders.js](../frontend/src/studentPerformance/useCalendarReminders.js)

### Event Structure
```javascript
{
  id: string (uuid),
  title: string,
  category: "exam" | "assignment" | "deadline" | "other",
  startISO: string (ISO 8601),
  endISO: string (ISO 8601),
  isAllDay: boolean,
  recurMode: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY",
  reminders: [
    { id, minutesBefore: number, offsetLabel: string }
  ],
  description: string,
  createdAt: string
}
```

### Backend Model
**File**: [CalendarEventModel.js](../backend/src/models/CalendarEventModel.js)
```javascript
{
  studentId: String (nullable for global events),
  title: String (required),
  type: enum["EXAM", "DEADLINE", "EVENT", "LECTURE", "HOLIDAY", "OTHER"],
  date: Date (required),
  startTime: String (HH:MM),
  endTime: String (HH:MM),
  isAllDay: Boolean,
  description: String,
  createdByRole: enum["ADMIN", "STUDENT"],
  timestamps: true
}
```

### Backend API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/calendar-events` | Create event |
| GET | `/api/calendar-events/student/:studentId` | Get events for date range |
| PUT | `/api/calendar-events/:id` | Update event |
| DELETE | `/api/calendar-events/:id` | Delete event |

### Frontend Features
✅ **Implemented:**
- Month view calendar grid with day highlighting
- Event creation/editing modal with recurrence options
- Event list by selected day
- Countdown timers to upcoming events
- Custom reminder presets (7 days, 3 days, 1 day, etc.)
- All-day event support
- Recurring events (ONCE, DAILY, WEEKLY, MONTHLY)
- Browser notification support (useCalendarReminders hook)
- Real-time tick updates (1-second intervals)
- Event categorization with color coding

### Data Flow
```
User selects date 
  → Shows events for that day
  → Opens modal to create/edit
  → Saves to localStorage (calendarStorage.js)
  → useCalendarReminders hook tracks time
  → Browser notification fired when reminder time reached
  → Countdown timer displays "X days Y hours away"
```

### Reminder System
- Fires browser notifications based on `minutesBefore`
- Stores notified event IDs to prevent duplicates
- Real-time countdown on page
- Can set custom reminder times

### Potential Issues
⚠️ **Issues:**
1. Browser notifications require user permission
2. Only works when page is open (no background service workers)
3. No sync between localStorage and backend
4. No validation for past dates
5. Recurring events not fully persisted (only frontend logic)
6. Max 6 visible events per day (hardcoded limit)

---

## 3️⃣ NOTIFICATIONS

### 🔔 Purpose
Centralized notification hub for achievements, reminders, warnings, and system messages with filtering and marking as read.

### Frontend Components
- **Files**: 
  - [StudentNotificationsPage.jsx](../frontend/src/studentPerformance/StudentNotificationsPage.jsx)
  - [StudentNotificationsPage_new.jsx](../frontend/src/studentPerformance/StudentNotificationsPage_new.jsx)
- **Storage**: [notificationsStorage.js](../frontend/src/studentPerformance/notificationsStorage.js)

### Notification Categories
```javascript
achievement: { label: "ACHIEVEMENT", icon: Award, color: amber }
reminder: { label: "REMINDER", icon: Clock, color: cyan }
warning: { label: "WARNING", icon: AlertTriangle, color: rose }
system: { label: "SYSTEM", icon: Megaphone, color: slate }
```

### Notification Structure
```javascript
{
  id: string,
  title: string,
  body: string,
  category: "achievement" | "reminder" | "warning" | "system",
  read: boolean,
  createdAt: ISO 8601 string
}
```

### Backend Model
**File**: [NotificationModel.js](../backend/src/models/NotificationModel.js)
```javascript
{
  studentId: String (required),
  title: String (required),
  message: String (required),
  type: enum["REMINDER", "WARNING", "ACHIEVEMENT", "INFO"],
  isRead: Boolean (default: false),
  meta: Mixed (custom metadata),
  timestamps: true
}
```

### Backend API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notifications/student/:studentId` | Get all notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/student/:studentId/read-all` | Mark all as read |

### Frontend Features
✅ **Implemented:**
- Category-based filtering (Achievement, Reminder, Warning, System)
- Mark single notification as read
- Mark all as read
- Delete notifications
- Search/filter by text
- Unread count badge
- Timestamp display
- Category color coding
- Demo notifications with seed flag
- Real-time notification dispatch event

### Notification Sources
1. **Goal Achievements**: When goal progress reaches 100%
2. **Milestone Badges**: Every 10-85 goals completed
3. **Calendar Reminders**: From calendar events
4. **Study Planner**: When plan is generated
5. **System Messages**: Admin notifications

### Data Flow
```
Event triggers notification creation 
  → appendNotification(userKey, notificationObj)
  → loadNotifications() + unshift new item
  → saveNotifications() to localStorage
  → window.dispatchEvent("slms-student-notifications-changed")
  → Display in list with newest first
  → Click to mark as read (toggles boolean)
  → Delete removes from list
```

### Potential Issues
⚠️ **Issues:**
1. No pagination (all notifications loaded at once)
2. No archiving system (only delete)
3. No server sync for notifications
4. Demo data overwrites existing on first load
5. No expiration/auto-cleanup for old notifications
6. Two notification page versions exist (confusing)

---

## 4️⃣ STUDY PLANNER

### 📚 Purpose
Generate personalized study plans combining calendar events, performance data, and goals to optimize study schedules with priority scoring.

### Frontend Components
- **File**: [StudentStudyPlannerPage.jsx](../frontend/src/studentPerformance/StudentStudyPlannerPage.jsx)
- **Utilities**: [studyPlannerUtils.js](../frontend/src/studentPerformance/studyPlannerUtils.js)
- **Storage**: localStorage for hours/day preference

### Task Types
```javascript
TASK_TYPES = {
  exam_prep: "exam_prep",
  assignment: "assignment",
  deadline: "deadline",
  revision: "revision",
  goal_support: "goal_support"
}
```

### Task Structure
```javascript
{
  id: string,
  title: string,
  taskType: TASK_TYPES enum,
  subject: string | null,
  dueISO: ISO 8601 | null,
  subjectMark: number | null (0-100),
  linkedToGoal: boolean,
  priorityScore: number (higher = more urgent),
  reason: string (explanation for priority),
  suggestedHours: number | null (from generateStudyPlan)
}
```

### Algorithm - Priority Scoring
```javascript
computePriorityScore({ taskType, dueISO, subjectMark, linkedToGoal })

Base scores:
- exam_prep: 100
- assignment: 80
- deadline: 70
- revision: 50
- goal_support: 40

Modifications:
- If subject mark < 50: +50 points
- If subject mark < 65: +30 points
- If linked to goal: +20 points
- Days remaining multiplier (closer = higher)
```

### Task Generation Sources
1. **Calendar Events**: Deadlines, exams, assignments
2. **Performance Data**: Low-scoring subjects need revision
3. **Goals**: Goals linked to subjects get +priority
4. **Manual**: Users can add custom tasks

### Study Plan Generation Algorithm
```javascript
generateStudyPlan({ tasks, hoursPerDay })

1. Sort tasks by priorityScore (descending)
2. Distribute across 7 days based on:
   - Available hours per day
   - Task difficulty (0.5-3 hours each)
   - Deadline proximity
   - Task type duration:
     * exam_prep: 2-3 hours
     * assignment: 1.5-2.5 hours
     * deadline: 1-2 hours
     * revision: 1-2 hours
3. Return:
   {
     focusSubject: string (recommended subject),
     today: [ { title, suggestedHours, taskType } ],
     thisWeek: { date: [ tasks ] },
     hoursPerDay: number
   }
```

### Frontend Features
✅ **Implemented:**
- Hours per day configuration (0.5-16 hours)
- Intelligent task prioritization
- Real-time plan generation
- Task list view (top 6 tasks shown)
- "This week's plan" timeline
- Focus subject recommendation
- Data sources summary panel
- Load performance data from backend
- Load goals from localStorage
- Load calendar events from localStorage
- Suggested hours for each task
- Integration with notifications

### Data Sources
- **Calendar**: Real calendar events
- **Performance**: API → `/api/assessment/performance/dashboard`
- **Goals**: localStorage (goalsStorage.js)
- **User Preference**: Hours per day (localStorage)

### Data Flow
```
User sets hours per day
  ↓
Click "Generate Plan"
  ↓
Fetch performance data from API
  ↓
Load calendar events (localStorage)
  ↓
Load goals (localStorage)
  ↓
buildPlannerTasks() → creates task list
  ↓
generateStudyPlan() → distributes across week
  ↓
Render timeline + top tasks
  ↓
Create notification for focus subject
```

### Potential Issues
⚠️ **Issues:**
1. Performance API endpoint might not exist in routes
2. No persistence of generated plans (only state)
3. Task distribution algorithm may not always work perfectly
4. No conflict detection for time slots
5. Suggested hours based on heuristics, not actual data
6. No integration with actual task tracking
7. No deadline warnings

---

## 5️⃣ GOALS

### 🎯 Purpose
Set academic goals (GPA, subject marks, assignments, study hours) with progress tracking, milestone badges, and deadline notifications.

### Frontend Components
- **File**: [StudentGoalsPage.jsx](../frontend/src/studentPerformance/StudentGoalsPage.jsx)
- **Storage**: [goalsStorage.js](../frontend/src/studentPerformance/goalsStorage.js)

### Goal Types
```javascript
GOAL_TYPES = [
  {
    value: "gpa",
    label: "GPA target",
    description: "Set a GPA you want to reach by the deadline"
  },
  {
    value: "subject_marks",
    label: "Subject marks target",
    description: "Target mark (%) for one subject by the deadline"
  },
  {
    value: "assignments",
    label: "Assignments complete target",
    description: "How many assignments to finish by the deadline"
  },
  {
    value: "study_hours",
    label: "Study hours target",
    description: "Total study hours to log before the deadline"
  }
]
```

### Goal Structure
```javascript
{
  id: string (uuid),
  studentId: string,
  title: string,
  type: "gpa" | "subject_marks" | "assignments" | "study_hours",
  targetValue: number,
  currentValue: number,
  subjectName: string | null (for subject_marks type),
  deadline: ISO 8601 string,
  category: string (optional),
  linkedToCalendarEvent: string | null (eventId),
  completed: boolean,
  completedAt: ISO 8601 | null
}
```

### Backend Model
**File**: [GoalModel.js](../backend/src/models/GoalModel.js)
```javascript
{
  studentId: String (required),
  title: String (required),
  type: enum["SUBJECT_MARK", "GPA", "WEEKLY_TARGET"] (required),
  targetValue: Number (required),
  currentValue: Number (default: 0),
  subject: String (required if type=SUBJECT_MARK),
  semester: String,
  academicYear: String,
  status: enum["ACTIVE", "ACHIEVED", "EXPIRED"] (default: ACTIVE),
  progressPercent: Number (0-100, default: 0),
  achievedAt: Date,
  lastUpdatedAt: Date,
  timestamps: true
}
```

### Backend API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/goals` | Create goal |
| GET | `/api/goals/student/:studentId` | Get all goals |
| PATCH | `/api/goals/:goalId/progress` | Update progress |
| DELETE | `/api/goals/:goalId` | Delete goal |
| GET | `/api/goals/student/:studentId/badges` | Get badges |

### Badge System

#### Milestone Badges (Lifetime Completion)
```javascript
MILESTONE_COMPLETION_THRESHOLDS = [
  { tier: "bronze", at: 10, label: "10 goals completed" },
  { tier: "silver", at: 35, label: "35 goals completed (25 after Bronze)" },
  { tier: "gold", at: 85, label: "85 goals completed (50 after Silver)" }
]
```

**Badge Structure:**
```javascript
{
  id: string (uuid),
  tier: "bronze" | "silver" | "gold",
  kind: "milestone",
  earnedAt: ISO 8601,
  completionsAtUnlock: number
}
```

#### Achievement Tracking
- Bronze: 10 total goals completed
- Silver: 35 total goals completed
- Gold: 85 total goals completed

### Frontend Features
✅ **Implemented:**
- Multiple goal type creation forms
- Progress tracking with visual progress bars
- Manual progress update
- Goal completion detection (100% progress)
- Milestone badge unlocking
- Deadline notifications
- Deadline passed warnings
- Subject marks syncing with performance API
- Manual GPA entry
- Goal deletion
- Completed goals section
- Expired goals handling
- Demo goals with seed flag
- Bulk notifications on app load

### Backend Services
**File**: [GoalServices.js](../backend/src/services/GoalServices.js)

#### Key Features:
1. **Progress Update with Auto-Achievement**:
   - Update currentValue
   - Calculate progressPercent
   - Auto-complete when 100% reached
   - Award badges at 50%, 75%, 100%

2. **Performance Sync**:
   - When performance record created → sync related goals
   - Automatically update goal progress from marks
   - Match subjects by name (case-insensitive)

3. **Badge Awarding**:
   - BRONZE: 50% progress
   - SILVER: 75% progress
   - GOLD: 100% progress

### Data Flow
```
User creates goal (type + target + deadline)
  ↓
Goal stored in localStorage + bundled
  ↓
User updates progress (manual input)
  ↓
calculateProgress() → progressPercent
  ↓
Check milestones:
  - 50% → Bronze badge
  - 75% → Silver badge
  - 100% → Goal achieved + Gold badge
  ↓
Create notifications for each badge
  ↓
Update totalCompletedCount
  ↓
Check lifetime milestones:
  - 10 → Bronze milestone
  - 35 → Silver milestone
  - 85 → Gold milestone
  ↓
Add milestone badge if unlocked
  ↓
Persist all to localStorage
```

### Goal-Performance Integration
```
Performance Record Created (studentsPerformanceServices.js)
  → syncGoalsFromPerformance()
  → Find goals matching:
    * studentId
    * subject (if SUBJECT_MARK type)
    * semester (if specified)
    * academicYear (if specified)
  → Auto-update goal.currentValue = performance.mark
  → Trigger notifications if goal achieved
```

### Potential Issues
⚠️ **Issues:**
1. Subject matching is case-insensitive substring search (might match incorrectly)
2. No goal edit functionality (only delete + recreate)
3. Expired goals don't auto-expire (manual check only)
4. No priority/ordering system for goals
5. No goal categories/tags
6. Performance sync only works if backend is configured
7. No batch update of goals
8. Deadline notifications stored but not always reliable

---

## 🔗 Feature Interconnections

```
PERFORMANCE DASHBOARD
        ↓
     Updates
        ↓
GOALS (performance sync)
  ↓
  Triggers milestone badges
  ↓
Creates NOTIFICATIONS
  ↓
                STUDY PLANNER
                    ↓
             References Performance
             & Goals & Calendar
                    ↓
            Generates tasks with
            priority scores
                    ↓
          Recommends focus subject
                    ↓
          Creates NOTIFICATIONS
          for plan summary


CALENDAR
  ↓
Events trigger
  ↓
NOTIFICATIONS (reminders)
  ↓
STUDY PLANNER
  ↓
Uses events as
task sources
```

---

## 📊 Data Persistence Comparison

| Feature | Frontend | Backend | Real-time Sync |
|---------|----------|---------|---|
| **Performance** | Demo only | ✅ Full | Manual fetch |
| **Calendar** | ✅ Full localStorage | ⚠️ Optional | One-way (display) |
| **Goals** | ✅ Full localStorage | ⚠️ Optional | One-way (display) |
| **Notifications** | ✅ Full localStorage | ⚠️ Optional | Dispatch event |
| **Study Plan** | ✅ State + localStorage | ❌ None | N/A |

---

## 🚀 Performance Considerations

### Optimizations Made
✅ useMemo hooks to prevent unnecessary recalculations
✅ useCallback to memoize event handlers
✅ localStorage for client-side caching
✅ Lazy loading of calendar events
✅ Truncated goal lists (show top 6)

### Potential Bottlenecks
⚠️ No pagination on large datasets
⚠️ All notifications loaded at once
⚠️ All calendar events loaded at once
⚠️ All goals loaded at once
⚠️ Real-time countdown runs 1/second (can spike CPU)

---

## 🔐 Security Considerations

### Current Security Level
⚠️ **Low** - All data stored in localStorage (accessible via DevTools)

### Risks
1. localStorage data is not encrypted
2. No authentication on localStorage access
3. Performance data exposed to client
4. Cross-site scripting (XSS) could access all data
5. No input validation on frontend forms

### Recommendations
1. Add input validation schemas (Yup/Joi)
2. Sanitize user inputs
3. Implement CSRF protection for API calls
4. Add rate limiting on goal/calendar updates
5. Validate data on backend before persistence
6. Add audit logging for sensitive operations

---

## 🐛 Known Issues & Bugs

### Critical
1. **Performance API not wired**: `/api/assessment/performance/dashboard` may not exist
2. **Goal-subject sync logic flawed**: Case-insensitive substring matching could cause false matches
3. **Two notification pages**: Duplicate files (StudentNotificationsPage.jsx vs _new.jsx)

### Major
1. **No pagination**: All items loaded at once
2. **Recurring events not persisted**: Only work during session
3. **No timezone support**: All dates in local timezone
4. **No conflict detection**: Study planner doesn't check overlaps

### Minor
1. **Demo data hardcoded**: Can't change subjects/skills without code edit
2. **No form validation messages**: Silent failures
3. **No undo/restore functionality**
4. **Expired goals not marked**: Only local check

---

## 💡 Recommendations for Improvement

### Phase 1: Stabilization
1. **Validation**: Add Yup schemas for all forms
2. **Error Handling**: Add error boundaries and toast notifications
3. **Bug Fixes**: 
   - Fix goal-subject matching algorithm
   - Consolidate notification pages
   - Add missing API routes

### Phase 2: Features
1. **Persistence**: 
   - Add optional backend sync toggle
   - Implement conflict resolution
   - Add data export/import

2. **UI/UX**:
   - Add pagination to all lists
   - Add bulk operations (delete multiple goals)
   - Add goal templates
   - Add calendar import/export (ICS)

3. **Analytics**:
   - Track goal completion rate
   - Analyze performance trends
   - Predict performance based on goals
   - Recommend subjects for improvement

### Phase 3: Advanced
1. **AI Features**:
   - Predictive deadline alerts
   - Adaptive plan generation
   - Performance anomaly detection
   - Personalized goal recommendations

2. **Collaboration**:
   - Share goals with study groups
   - Compare performance with peers
   - Group study sessions

3. **Integration**:
   - Connect with external calendars (Google Calendar, Outlook)
   - Export to PDF
   - Mobile app
   - Slack/Teams notifications

---

## 📦 Dependencies

### Frontend Libraries Used
- `recharts`: Chart rendering (Performance Dashboard)
- `lucide-react`: Icon set (all features)
- `date-fns`: Date manipulation (Calendar)
- `react-hook-form`: Form handling (Goals, Calendar)
- localStorage API: Browser storage

### Backend Libraries Used
- `mongoose`: MongoDB ODM
- `express`: API routing
- `bcryptjs`: Password hashing (for User model)

---

## 📝 Summary Table

| Feature | Status | Frontend | Backend | Data Persistence | Notes |
|---------|--------|----------|---------|---|---|
| **Performance Dashboard** | ⚠️ Partial | ✅ Yes | ⚠️ Optional | Demo + API | API endpoint may be missing |
| **Academic Calendar** | ✅ Complete | ✅ Full | ⚠️ Optional | localStorage | No backend sync yet |
| **Notifications** | ✅ Complete | ✅ Full | ⚠️ Optional | localStorage | Two page versions exist |
| **Study Planner** | ✅ Complete | ✅ Full | ❌ None | State + localStorage | No persistence |
| **Goals** | ✅ Complete | ✅ Full | ⚠️ Optional | localStorage | Needs sync implementation |

---

Generated on: April 24, 2026

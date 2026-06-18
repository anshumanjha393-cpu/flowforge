<div align="center">

# FlowForge

### Enterprise Project Management & Task Tracking Platform

A full-stack project management application with real-time collaboration, Kanban boards, sprints, time tracking, team management, and analytics dashboard.

</div>

---

## Features

- **Authentication & Authorization** - Email/password + OAuth (Google, GitHub) with JWT & session-based auth, forgot password flow
- **Real-time Collaboration** - Socket.IO powered live updates across all connected clients (task moves, comments, activities)
- **Kanban Board** - Drag-and-drop task management with priority/status filters, quick mark-as-done button, task detail modal with comments and attachments
- **Workspaces** - Create and manage workspaces to organize projects and team members
- **Projects** - Create projects with descriptions, priorities, due dates, and progress tracking
- **Sprints** - Plan, start, and complete sprints with date ranges and goals; task association per sprint
- **Time Tracking** - Log hours against tasks, view weekly summaries with bar charts, manage entries
- **Dashboard Analytics** - Interactive charts (pie, bar) for task completion, priority breakdown, productivity overview, recent activity feed
- **Team Management** - Role-based access control (Admin, Manager, Member) with user invitations, member detail view
- **Webhooks** - Create and manage webhook subscriptions for project events, view delivery logs
- **Board Sharing** - Generate shareable links for board access with role-based permissions and expiry
- **Activity Feed** - Real-time activity stream with filtering
- **Audit Logs** - Comprehensive audit trail with search and pagination
- **Notifications** - In-app notification dropdown for assignments and updates
- **Settings** - Profile management (name update)
- **Dark Mode** - Full dark mode support with system preference detection
- **Input Validation** - Zod schema validation on all API endpoints
- **Rate Limiting** - Redis-backed rate limiting with IP blocking for brute force protection
- **Swagger/OpenAPI** - API documentation at `/api-docs`
- **Error Handling** - Global error boundary with graceful recovery

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| TypeScript 5 | Type safety |
| Vite 6 | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| Socket.IO Client | Real-time updates |
| @hello-pangea/dnd | Drag-and-drop Kanban |
| Recharts | Charts & analytics |
| Axios | HTTP client |
| React Router v7 | Client-side routing |
| Sonner | Toast notifications |
| Vitest | Testing |

### Backend

| Technology | Purpose |
|------------|---------|
| Express 5 | HTTP framework |
| TypeScript 5 | Type safety |
| Prisma 6 | ORM |
| PostgreSQL 16 | Database |
| Redis 7 | Caching & sessions (with in-memory fallback) |
| Passport.js | OAuth (Google, GitHub) |
| Socket.IO | WebSocket server |
| Zod | Input validation |
| Winston | Logging |
| Helmet | Security headers |
| Multer | File uploads |
| Vitest | Testing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| GitHub Actions | CI/CD pipeline |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (optional, falls back to in-memory)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flowforge.git
   cd flowforge
   ```

2. **Install backend dependencies**
   ```bash
   cd flowforge-backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../flowforge
   cp .env.example .env
   npm install
   ```

4. **Set up the database**
   ```bash
   cd flowforge-backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd flowforge-backend
   npm run dev

   # Terminal 2 - Frontend
   cd flowforge
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Docs: http://localhost:5001/api-docs
   - Health Check: http://localhost:5001/health

### Docker Setup

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Project Structure

```
flowforge/
├── flowforge/                        # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                     # Axios client config
│   │   │   └── client.ts
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AttachmentSection.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── NotificationsDropdown.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── TaskDetailModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/                   # Custom hooks
│   │   │   └── useDebounce.ts
│   │   ├── pages/                   # Page components
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   ├── BoardShareManage.tsx
│   │   │   ├── BoardSharePublic.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Kanban.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Notfound.tsx
│   │   │   ├── Project.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── SprintDetail.tsx
│   │   │   ├── Sprints.tsx
│   │   │   ├── TeamMembers.tsx
│   │   │   ├── TimeTracking.tsx
│   │   │   ├── Webhooks.tsx
│   │   │   ├── WorkspaceDetail.tsx
│   │   │   └── Workspaces.tsx
│   │   ├── types/                   # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx                  # Router & layout
│   │   ├── Layout.tsx
│   │   ├── main.tsx
│   │   └── socket.ts               # Socket.IO client
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── vitest.config.ts
│   └── package.json
│
├── flowforge-backend/                # Backend (Express + Prisma)
│   ├── src/
│   │   ├── config/                  # Configuration modules
│   │   │   ├── cache.ts
│   │   │   ├── logger.ts
│   │   │   ├── multer.ts
│   │   │   ├── passport.ts
│   │   │   ├── prisma.ts
│   │   │   ├── redis.ts
│   │   │   ├── session.ts
│   │   │   └── swagger.ts
│   │   ├── controllers/             # Route handlers
│   │   │   ├── activitycontroller.ts
│   │   │   ├── attachmentcontroller.ts
│   │   │   ├── auditlogcontroller.ts
│   │   │   ├── authcontroller.ts
│   │   │   ├── boardsharecontroller.ts
│   │   │   ├── commentcontroller.ts
│   │   │   ├── projectcontroller.ts
│   │   │   ├── sprintcontroller.ts
│   │   │   ├── taskcontroller.ts
│   │   │   ├── timeentrycontroller.ts
│   │   │   ├── usercontroller.ts
│   │   │   ├── webhookcontroller.ts
│   │   │   └── workspacecontroller.ts
│   │   ├── middleware/              # Custom middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes/                  # API routes
│   │   │   ├── activityroutes.ts
│   │   │   ├── attachmentroutes.ts
│   │   │   ├── auditlogroutes.ts
│   │   │   ├── authroutes.ts
│   │   │   ├── boardshareroutes.ts
│   │   │   ├── commentroutes.ts
│   │   │   ├── projectroutes.ts
│   │   │   ├── spintroutes.ts
│   │   │   ├── taskroutes.ts
│   │   │   ├── timeentryroutes.ts
│   │   │   ├── userroutes.ts
│   │   │   ├── webhookroutes.ts
│   │   │   └── workspaceroutes.ts
│   │   ├── validation/              # Zod schemas
│   │   │   ├── schemas.ts
│   │   │   └── schemas.test.ts
│   │   ├── server.ts
│   │   └── health.test.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── Dockerfile
│   ├── vitest.config.ts
│   └── package.json
│
├── .github/workflows/               # CI/CD pipeline
│   └── ci.yml
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/github` | GitHub OAuth |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (paginated, filterable by status/priority/project) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task (status, priority, assignee, etc.) |
| DELETE | `/api/tasks/:id` | Delete task |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (paginated) |
| POST | `/api/projects` | Create project |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/:id` | Get workspace details |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| POST | `/api/workspaces/:id/members` | Add member |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove member |
| PUT | `/api/workspaces/:id/members/:userId/role` | Update member role |

### Sprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sprints` | List sprints (filterable by project/workspace/status) |
| POST | `/api/sprints` | Create sprint |
| GET | `/api/sprints/:id` | Get sprint details |
| PUT | `/api/sprints/:id` | Update sprint |
| POST | `/api/sprints/:id/start` | Start sprint |
| POST | `/api/sprints/:id/complete` | Complete sprint |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (paginated, searchable by email/role) |
| POST | `/api/users/invite` | Invite user (Admin) |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id/role` | Update role (Admin) |
| PUT | `/api/users/me` | Update own profile |

### Time Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/time-entries` | List time entries (paginated) |
| POST | `/api/time-entries` | Log time entry |
| PUT | `/api/time-entries/:id` | Update time entry |
| DELETE | `/api/time-entries/:id` | Delete time entry |
| GET | `/api/time-entries/summary` | Get time summary (grouped by day/week/month) |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId/comments` | List task comments |
| POST | `/api/tasks/:taskId/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |

### Attachments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId/attachments` | List task attachments |
| POST | `/api/tasks/:taskId/attachments` | Upload attachment |
| DELETE | `/api/attachments/:id` | Delete attachment |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks` | List webhooks (paginated) |
| POST | `/api/webhooks` | Create webhook |
| PUT | `/api/webhooks/:id` | Update webhook |
| DELETE | `/api/webhooks/:id` | Delete webhook |
| POST | `/api/webhooks/:id/test` | Test webhook |
| GET | `/api/webhooks/:id/logs` | View delivery logs |

### Board Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/board-shares` | List share links |
| POST | `/api/board-shares` | Create share link |
| DELETE | `/api/board-shares/:id` | Revoke share link |
| GET | `/api/board-shares/public/:token` | Access shared board |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | List activities (paginated, filterable) |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | List audit logs (paginated, filterable by entity type) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Testing

```bash
# Backend tests
cd flowforge-backend
npm test

# Frontend tests
cd flowforge
npm test

# With coverage
npm run test:coverage
```

## Security Features

- **Helmet.js** - HTTP security headers
- **Rate Limiting** - 100 req/15min general, 10 req/15min for auth
- **IP Blocking** - Auto-block after 5 failed login attempts (30 min)
- **JWT + Session Auth** - Dual authentication with session IP mismatch detection
- **Input Validation** - Zod schemas on all endpoints
- **CORS** - Configurable cross-origin resource sharing via `FRONTEND_URL`
- **Password Hashing** - bcrypt with 10 rounds

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `SESSION_SECRET` | Session signing secret | - |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `BACKEND_URL` | Backend URL for OAuth callbacks | http://localhost:5001 |
| `REDIS_URL` | Redis connection string (optional) | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | - |
| `PORT` | Server port | 5001 |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5001 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

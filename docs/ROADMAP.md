## Collaborito: Comprehensive Roadmap, Status, and Future Plan

### Executive summary
- The app has a production-ready onboarding pipeline with Supabase persistence, modern security foundations (login monitoring, device registration/trust, session timeouts), and a healthy services architecture with clean TypeScript.
- Immediate focus: finish security RPC deployment, polish session timeout UX, and complete a user-facing device management UI.
- Growth levers: Profile/Avatar system, LinkedIn OAuth enhancement, Project discovery/feed, Messaging MVP, and (scaffold) Workspace/Event Booking with payments.
- This document provides the current status, gaps, detailed feature specs, database/API work, testing and rollout plan, risks, KPIs, and a 7–14–30 day execution roadmap.

---

## 1) Current status snapshot

- Core platform
  - Expo SDK aligned with expected versions; type-check clean; health-check warnings limited to known non-blocking items.
  - Strong services layer: onboarding, auth/session, device/security, error handling, logging.

- Security features
  - Login attempt monitoring: Client integration live. RPC not yet deployed remotely; local verification warns but does not block login.
  - Device registration/trust: Implemented (fingerprint + trust flows), added UI action (“Trust This Device”) and a small list in Profile.
  - Session timeout: Minimal service and hook live with warning callback; needs UX polish and global integration.

- Onboarding UX
  - Restored to previous design per your preference (native inputs and gradient buttons); modern accessibility components available but not applied to onboarding.

- Tooling
  - Verification script `npm run verify-security` validates existence of `login_attempts`/`user_devices`; indicates RPC missing in remote DB.
  - Node/Expo warnings reduced; Expo deps updated to target SDK compatibility.

---

## 2) Recently delivered

- Security
  - Client-side login attempt logging with RPC hook.
  - Device registration + trust check; Profile screen “Trust This Device” and trusted devices list.
  - Session timeout hook and service (warning + timeout callback; app foreground activity detection).

- Infra/tooling
  - Expo/Router/Lottie packages aligned (expo 53.0.20, expo-router ~5.1.4, lottie-react-native 7.2.2).
  - Security verification script and task: `npm run verify-security`.

- Onboarding
  - Reverted UI to previous style on Profile/Interests onboarding steps.

---

## 3) Open problems and gaps

- Security RPC not deployed (remote Supabase):
  - `record_login_attempt_and_check_lockout` and related functions exist in repo migrations but aren’t applied to the live project, so lockout remains “soft”.
- Session timeout UX:
  - Needs consistent non-blocking warning toast and a “Keep me signed in” control.
  - Needs app-wide integration (Home/Feed/Messages/Profile).
- Device management UI:
  - Need full list, revoke/untrust flows, and a “New device login” alert/notification.
- Profile/Avatar:
  - No final upload flow (crop/compress/store), editing UI incomplete.
- LinkedIn provider:
  - Provider on, but advanced profile import and optional connection sync not implemented.
- Discovery/Feed and Messaging:
  - Not yet implemented; critical to engagement and retention.
- Booking platform (from requirements):
  - Requires full schema, payments, maps integration, etc. (major feature set).

---

## 4) Immediate next steps (7–14 days)

- Security hardening (priority)
  - Deploy RPCs/functions and indexes to Supabase; re-run verification until status is OK (no warnings).
  - Add lockout feedback UI (countdown timer, “Reset password” shortcut).
- Session timeout UX
  - Global non-blocking toast when <5 min remaining; “Extend session” button that records activity.
  - Add “Remember me” (longer timeout) and per-user configuration.
- Device management
  - Profile > Security: full device list, trust/untrust/revoke, metadata (OS, last seen, IP), and new-device notification.

---

## 5) Growth features (near-term, 2–6 weeks)

- Profile & Avatar system (high ROI)
  - Supabase Storage bucket, policies, upload service (client compression, EXIF strip, resize, retry).
  - Profile editing: name/headline/location/role/bio; live preview.
  - Avatar preloading for lists/chat; upload progress, error handling.

- LinkedIn OAuth enhancement
  - Finalize OAuth callback UX and deep link flow.
  - Import headline/profile picture; optional connection sync toggle; allow unlink/relink.

- Project discovery & feed
  - Feed service (interests/skills-based scoring).
  - Search/filter UI (tags, categories, skills/interests).
  - Project card skeleton loaders, bookmarking.

- Messaging MVP
  - Project chat + DMs with Supabase Realtime.
  - Optimistic sending, retry/resend, typing indicators, read status.

---

## 6) Future scope (medium-term, 1–3 months)

- Workspace/Event Booking
  - Schema: venues, availability, bookings, reviews, images, payments.
  - Listing/search with maps and filters; Stripe integration; booking details and history.
- AI assistance (Claude)
  - Smart project creation prompts; matching suggestions.
  - Onboarding assistant (“help me complete profile”); feed personalization.

---

## 7) Detailed feature specifications

### 7.1 Security RPC deployment (DB)
- Migrations to apply
  - Ensure security migration that defines `record_login_attempt_and_check_lockout`, `is_account_locked`, `get_account_lockout_info`, and `cleanup_expired_lockouts` is pushed to Supabase.
  - Verify indexes on `login_attempts`, `user_devices`, and lockout tables.
- Acceptance criteria
  - `npm run verify-security` → RPC “OK”, tables accessible, overall OK=3, WARN=0.
  - Lockouts trigger after configured failures; unlock honors duration.

### 7.2 Session timeout UX
- Behavior
  - Warning toast appears 5 minutes before expiration; includes “Extend session”.
  - Extend resets activity timestamp; respects reduce-motion/accessibility.
  - “Remember me” extends default session duration (user-configurable).
- Acceptance criteria
  - Session expires reliably; sign-out-on-timeout; covered by unit/integration tests.
  - Warning is non-blocking and not spammy (throttled).

### 7.3 Device management UI
- Screens
  - Profile > Security: list all devices, trust/untrust/revoke; show OS, device name, IP, last seen.
  - “Trust This Device” CTA (with confirmation).
  - New device login alert (notification and/or toast).
- Acceptance criteria
  - Device list and trust status reflect DB state; revoke removes trust.
  - New device alerts appear on login from unknown device.

### 7.4 Profile & Avatar
- UI & services
  - Profile editing: text fields with validations; avatars (upload/crop/resize).
  - Storage: SUPABASE storage bucket `avatars` with RLS; signed URLs where appropriate.
  - Preloading: service-backed prefetch for lists and chat.
- Acceptance criteria
  - Avatar upload stable on iOS/Android; handles retries/failures.
  - Image sizes optimized; poor-network UX graceful.

### 7.5 LinkedIn enhancements
- Data import
  - Pull headline & profile image; optional “sync” toggle; clear unlink path.
- Acceptance criteria
  - OAuth flow end-to-end; privacy & consent messaging clear.

### 7.6 Discovery/feed
- Algorithm
  - Score by overlap of interests, skills, recency, tags; add bookmarks/favorites.
- Acceptance criteria
  - Feed feels relevant (user testing); filters/search responsive; skeleton loaders during fetch.

### 7.7 Messaging MVP
- Features
  - Project channels and DMs; optimistic sending; network-aware retries; typing indicators.
- Acceptance criteria
  - Latency acceptable; offline-safe draft handling; basic moderation hooks.

---

## 8) Database and API tasks checklist

- Security
  - [ ] Push `record_login_attempt_and_check_lockout` RPC and supporting functions.
  - [ ] Recreate indexes on security tables; verify RLS on `login_attempts` and `user_devices`.
- Storage
  - [ ] Ensure `avatars` bucket + RLS policies (upload/view rules).
- Booking (scaffold)
  - [ ] Create tables (venues, availability, bookings, payments, reviews) with RLS.
- Realtime
  - [ ] Configure channels for messaging; presence/typing indicators.

---

## 9) Performance, resilience, and privacy

- Performance
  - Image compression/resizing; avatar preloading.
  - Query optimization and indexes; caching for reference data.
- Resilience
  - Unified error boundaries; retry/backoff; offline queues for writes.
- Privacy/Security
  - RLS across tables; scoped user access; sanitize inputs; short-lived signed URLs for private assets.

---

## 10) Testing strategy

- Unit tests
  - Auth/session, security (lockouts), onboarding services, profile/avatar upload, feed scorer.
- Integration/E2E
  - New user: signup → onboarding → feed.
  - Login lockout flow; session warning → extend; device trust/revoke.
  - Avatar upload under flaky networks.
- Non-functional
  - Accessibility checks; performance budget (TTI, animation 60fps); error telemetry.

---

## 11) KPIs and success metrics

- Onboarding
  - Completion rate > 95%; time-to-complete < 2 minutes.
- Security
  - < 0.1% lockout false positives; zero PII leakage.
- Engagement
  - DAU/WAU; messages sent per user; projects favorited/created per week.
- Reliability
  - Crash-free sessions > 99.5%; p95 screen load < 800ms.

---

## 12) Risks and mitigations

- Supabase function drift
  - Mitigation: CI-based migration push to staging before production; verification script gate.
- Push notifications limits (new device)
  - Mitigation: Start with local toasts/email; add push later with expo-notifications.
- Messaging scale
  - Mitigation: Start with small channels; monitor; shard or paginate aggressively.

---

## 13) Commit plan and branching

- Strategy
  - 1–3 commits per subtask; descriptive conventional commits.
  - Feature branches per major epic; PR review before merge.
- Examples
  - `feat(security): deploy lockout RPC and wire client`
  - `feat(session): add extend-session toast and warning`
  - `feat(profile): avatar upload with compression and retries`

---

## 14) Timeline

- Week 1–2 (Immediate)
  - Deploy RPCs; session warning UX; full device management UI; verification green.
- Week 3–4
  - Profile editing + avatar upload; LinkedIn profile import; feed prototype.
- Week 5–6
  - Messaging MVP; polish feed; avatar preloading; telemetry and tests.
- Week 7+
  - Booking scaffold; maps integration; payments.

---

## 15) Next 7 days execution plan

- Day 1–2
  - Push security migrations to Supabase; get `verify-security` OK.
  - Lockout feedback UI with countdown; add “Reset password” shortcut.
- Day 3–4
  - Global session warning toast + “Extend session” control; “Remember me.”
- Day 5–7
  - Device management: list, trust/untrust/revoke; new-device notification; tests.

---

## 16) Acceptance criteria for this milestone

- Security
  - Verification script: OK=3, WARN=0, FAIL=0.
  - Lockouts work end-to-end; device trust flows fully functional.
- UX
  - Session warning and extension seen across main screens; tests cover timeout/extend.
- Quality
  - Type-check clean; smoke tests pass; no regressions in onboarding/auth.

---

## 17) Dependencies and prerequisites

- Supabase access (CLI auth) to push migrations/functions.
- Stripe account (for future booking).
- Claude API key (for AI features).
- Figma access (for design parity).

---

## 18) Appendix: how to deploy security RPC (operator notes)

- Ensure Supabase CLI is linked:
  - `supabase link --project-ref <project-ref>`
- Push migrations:
  - `supabase db push`
- Verify:
  - `npm run verify-security` should show RPC OK and tables accessible.

---

## 19) Milestone status update (2025-08-18)

- Security RPC deployment: In progress (verification script in place; pushing remote pending)
- Session timeout UX: In progress (global toast + extend control pending rollout)
- Device management UI: Planned (trust/untrust/revoke flows and new-device alerts)
- Documentation: Ongoing updates across security, workflow, and operations

---

## 20) Recent adjustments (2025-08-19)

- Prioritized device management UI ahead of LinkedIn enhancements to support security milestone.
- Added explicit acceptance criteria for session timeout extend control.
- Scheduled staging push for security RPCs before end of week; production push next week pending verification green.

## 21) Risks added/removed (2025-08-19)

- Added: Potential delay in Supabase RPC deployment due to environment access windows.
- Removed: Expo package mismatch risk (versions aligned and validated in CI).

## 22) Decision log (2025-08-19)

- Prioritized security milestone (RPC deploy + session UX) before feed/messaging.
- Kept onboarding UI reverted to preferred style; accessibility upgrades deferred post-security.
- Adopted small, focused commits with immediate pushes to maintain linear history.

## 23) Owners and reviewers (2025-08-19)

- Security milestone: Swaraj Bangar (lead), team review required
- Session timeout UX: Swaraj Bangar (implementation), UX team review
- Device management: Swaraj Bangar (UI), security team validation
- Documentation: Swaraj Bangar (maintainer), community contributions welcome

## 24) Next sprint planning (2025-08-19)

- Sprint duration: 2 weeks (Aug 19 - Sep 2)
- Focus: Security RPC deployment and session timeout UX
- Deliverables: Working lockout system, global session warnings, device trust flows
- Success criteria: `npm run verify-security` returns OK=3, WARN=0

## 25) Technical debt tracking (2025-08-19)

- High priority: Security RPC deployment lag (blocks production security)
- Medium priority: Session timeout global integration (UX consistency)
- Low priority: Accessibility upgrades for onboarding (post-security milestone)
- Monitoring: Package version drift, unused dependencies, test coverage gaps

## 26) Communication channels (2025-08-19)

- Project updates: GitHub Issues and Discussions
- Security concerns: Private security channel (urgent issues)
- Development coordination: Pull request reviews and comments
- Documentation feedback: GitHub Issues with 'docs' label
- Team sync: Weekly status updates in project discussions

## 27) Dependency update schedule (2025-08-19)

- Weekly: Minor/patch updates checked every Friday
- Monthly: Expo/React Native ecosystem review and planned upgrades
- Quarterly: Audit transitive deps, remove unused packages, review polyfills
- Always: Security patches applied immediately when available

## 28) Quality gates (2025-08-19)

- Code review: All changes require at least one approval
- Testing: Unit tests must pass, integration tests for critical paths
- Security: Security verification script must return OK=3, WARN=0
- Performance: No regression in app startup time or screen load times
- Documentation: README and API docs updated with new features

## 29) Rollback procedures (2025-08-19)

- Database migrations: Use Supabase CLI to revert specific migrations
- Code deployments: Git revert to previous stable commit
- Feature flags: Disable problematic features without full rollback
- Emergency contacts: Immediate escalation to lead developer
- Rollback criteria: Security issues, critical bugs, performance degradation

## 30) Post-release checklist (2025-08-19)

- Verify error telemetry shows no new spikes
- Check performance dashboards (startup, p95 load times)
- Validate critical user flows (login, onboarding, profile update)
- Review user feedback and open issues
- Prepare hotfix plan if blockers detected

## 31) Monitoring alerts (2025-08-19)

- Critical: App crashes, login failures > 5%, security lockout spikes
- Warning: Performance degradation > 20%, high error rates
- Info: New user registrations, feature usage metrics
- Escalation: Immediate notification to lead developer for critical alerts
- Recovery: Automated retry for transient failures, manual intervention for persistent issues

## 32) Documentation maintenance (2025-08-19)

- Weekly: Review and update README sections for accuracy
- Monthly: Audit all documentation for outdated information
- Quarterly: Restructure documentation based on user feedback
- Always: Update docs when adding new features or changing APIs
- Version control: Tag documentation releases with code releases

## 33) Final summary (2025-08-19)

This roadmap provides a comprehensive guide for Collaborito's development, covering current status, immediate priorities, growth features, and operational procedures. The focus remains on completing the security milestone (RPC deployment, session timeout UX, device management) before moving to engagement features (feed, messaging, booking). Regular updates to this document ensure alignment with project goals and team capabilities.

## 34) Backup strategy (2025-08-19)

- Daily: Automated database backups retained for 14 days
- Weekly: Full backup snapshot retained for 3 months
- Encryption: Backups encrypted at rest and in transit
- Recovery test: Quarterly restore drill to validate procedures
- Ownership: Lead developer responsible for backup monitoring

## 35) Performance benchmarks (2025-08-19)

- App startup: < 3 seconds on average devices
- Screen transitions: < 500ms for smooth navigation
- API response: < 200ms for 95th percentile
- Memory usage: < 150MB peak during normal operation
- Battery impact: Minimal background processing

## 36) Incident response (2025-08-19)

- Severity levels: P1 (critical), P2 (high), P3 (medium), P4 (low)
- Response times: P1 (15 min), P2 (1 hour), P3 (4 hours), P4 (24 hours)
- Escalation: Immediate notification to lead developer for P1/P2
- Communication: Status updates every 30 minutes for P1 incidents
- Post-mortem: Required for P1/P2 incidents within 48 hours

## 37) Glossary (2025-08-19)

- RPC: Remote Procedure Call (Supabase functions)
- RLS: Row Level Security (database access control)
- OAuth: Open Authorization (LinkedIn login)
- MVP: Minimum Viable Product
- DAU/WAU: Daily/Weekly Active Users
- TTI: Time to Interactive (performance metric)

## 38) Project completion criteria (2025-08-19)

- Security milestone: All RPCs deployed, session timeout UX complete, device management functional
- Engagement features: Feed algorithm working, messaging MVP deployed, user retention > 70%
- Booking platform: Core booking flow complete, payment integration tested, venue management operational
- Quality metrics: < 1% crash rate, > 99% uptime, user satisfaction > 4.5/5



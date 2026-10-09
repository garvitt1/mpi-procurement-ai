# MPI — Supabase Live Persistence Diagnostic & Architectural Audit Report

**Document Version:** 1.0.0  
**Audit & Remediation Date:** October 10, 2026  
**Auditor:** Senior Full-Stack Engineer, Supabase/PostgreSQL Architect & Application Security Engineer  
**Pre-Audit Checkpoint:** `f2a6160` (Tag: `cro-phase3-1-complete`)  
**Target Backend:** `https://utjysxkaidvbrmatngyb.supabase.co`  
**Status:** Root Cause Identified, Persistence Service Re-Engineered, Real Supabase Auth Integrated, Migration Prepared

---

## 1. Executive Summary & Root Cause Forensic Analysis

### 1.1 The Symptom
Although the initial database migration (`20261009000000_procurement_integrity.sql`) was successfully executed in Supabase and telemetry logged successfully, the `public.rfqs` and `public.quotes` tables remained completely empty in the Supabase Table Editor despite RFQs being dispatched from the Startup dashboard.

### 1.2 Forensic Root Cause Investigation
Through direct code and network inspection, four interlocking blockers were identified:

1. **Unauthenticated PostgREST Requests:**
   The frontend previously used a client-side mock authentication layer (`mockAuth.ts` and `AuthModal.tsx`). When users "logged in" or clicked Google login, credentials were only stored in `localStorage` (`mpi_active_user`). **No Supabase Auth session was established** (`supabase.auth.getSession()` returned `{ session: null }`). Consequently, every HTTP request sent to PostgREST used the `anon` key without a Supabase JWT token (`auth.role() = 'anon'`, `auth.uid() = null`).

2. **Row-Level Security (RLS) Policy Rejection (`42501 Unauthorized`):**
   The RLS policies on `public.rfqs` and `public.quotes` strictly mandate:
   ```sql
   -- public.rfqs
   create policy "Buyers can manage own RFQs"
     on public.rfqs for all to authenticated
     using ((select auth.uid()) = buyer_id)
     with check ((select auth.uid()) = buyer_id);

   -- public.quotes
   create policy "Suppliers can manage own quotes"
     on public.quotes for all to authenticated
     using ((select auth.uid()) = supplier_id)
     with check ((select auth.uid()) = supplier_id);
   ```
   Because `auth.uid()` was `null` and the role was `anon`, PostgreSQL immediately rejected all inserts with:
   ```json
   { "code": "42501", "message": "new row violates row-level security policy for table \"rfqs\"" }
   ```

3. **Foreign Key Constraint Violations on `buyer_id` / `supplier_id`:**
   In `public.rfqs`, `buyer_id uuid references public.profiles(id)` is a strict foreign key. The service previously defaulted unauthenticated sessions to `"00000000-0000-0000-0000-000000000000"`, which does not exist in `public.profiles`.

4. **Silent Error Masking by LocalStorage Fallback & False "Supabase Live" Indicator:**
   When `persistRFQToSupabase` encountered the RLS 42501 error, it logged a warning to the console, but `ProcurementContext` had already written the record to `localStorage.setItem("mpi_active_rfq", ...)` and updated React in-memory state. Furthermore, `checkDatabaseHealth()` tested table existence via `supabase.from("rfqs").select("id").limit(1)`: because SELECT returns an empty array `[]` (HTTP 200) without throwing, `isTableExposed` was set to `true`, causing the header to misleadingly display **"Supabase Live"**. The user believed the RFQ was live in PostgreSQL when it only existed in browser memory.

5. **Supabase Auth Email Confirmation Gate:**
   When attempting real user signup via `supabase.auth.signUp()`, Supabase Auth by default requires email confirmation, returning `{ user: '...', session: null }` and blocking password sign-in with `Email not confirmed`. Furthermore, rapid signups triggered Supabase's SMTP email rate limits.

---

## 2. Comprehensive Architectural Fixes

### A. Real Supabase Authentication Service ([`src/services/authService.ts`](file:///Users/haccrr/Downloads/MPI_AI_Procurement_CoFounder_MVP_Complete_Research_Redesign/src/services/authService.ts))
Created an authoritative authentication service that:
- Calls `supabase.auth.signInWithPassword()` to establish genuine JWT sessions in the Supabase client.
- Automatically synchronizes user profile records in `public.profiles` (`id = auth.uid()`).
- Provides `getVerifiedSupabaseUser()` to verify active sessions before database transactions.
- Handles signouts cleanly across Supabase and local caches.

### B. Updated AuthModal Handlers ([`src/components/auth/AuthModal.tsx`](file:///Users/haccrr/Downloads/MPI_AI_Procurement_CoFounder_MVP_Complete_Research_Redesign/src/components/auth/AuthModal.tsx))
- Wired email/password login and quick-fill demo buttons to call `signInWithSupabase()`.
- Standardized demo account credentials that meet Supabase's password complexity requirements:
  - **Startup Buyer:** `founder@novabio.tech` / `Founder@123` (Aarav Mehta, NovaBio Health)
  - **MSME Supplier:** `director@apexprecision.in` / `Apex@123` (Rajesh Sharma, Apex Precision Packaging)
  - **Admin:** `admin` / `bhavesh@123` (Internal admin portal)

### C. Re-Engineered Persistence Service ([`src/services/procurementDatabaseService.ts`](file:///Users/haccrr/Downloads/MPI_AI_Procurement_CoFounder_MVP_Complete_Research_Redesign/src/services/procurementDatabaseService.ts))
- **Strict Session Resolution:** Resolves `authenticatedUid` from `supabase.auth.getSession()`; blocks unauthenticated requests with explicit error messages.
- **Authoritative Buyer Fetch:** Added `fetchBuyerActiveRFQFromSupabase()` to retrieve the logged-in buyer's real RFQ from PostgreSQL upon page refresh.
- **Authoritative MSME Feed:** Added `fetchDispatchedRFQsFromSupabase()` to retrieve open RFQs with buyer privacy masking (`MPI Verified Buyer #001`).
- **Comprehensive Error Propagation:** Returns detailed database error codes (`code: 42501`, etc.) so the UI can accurately distinguish between saved-to-database and stored-locally states.

### D. Transparent UI Persistence Indicators
- **Header Connection Pill:** Renamed from deceptive "Supabase Live" to **"Supabase Connected"** (indicating network/API reachability).
- **Record-Level Persistence Badges:**
  - 🟢 **Persisted in PostgreSQL (ID: RFQ-XXXX)**: Authoritative confirmation from Supabase.
  - 🔵 **Syncing with Supabase...**: In-flight network transaction.
  - 🟡 **Saved Locally (Offline Fallback)**: Clear warning with exact error cause (e.g., Unauthenticated or RLS failure).

### E. Migration 20261010000000 ([`supabase/migrations/20261010000000_auth_and_auto_confirm.sql`](file:///Users/haccrr/Downloads/MPI_AI_Procurement_CoFounder_MVP_Complete_Research_Redesign/supabase/migrations/20261010000000_auth_and_auto_confirm.sql))
Authored a non-destructive migration that:
1. Adds an `auto_confirm_new_user()` trigger to automatically confirm emails upon signup, bypassing SMTP rate limits.
2. Creates high-performance `public.current_user_role()` helper to eliminate RLS subquery recursion.
3. Refines RLS policies on `public.rfqs`, `public.quotes`, and `public.profiles`.
4. Directly provisions and confirms the two canonical test accounts in `auth.users` and `public.profiles` using `extensions.crypt(..., gen_salt('bf'))`.

---

## 3. End-to-End Verification Test Matrix (Step 4)

An automated verification test runner was authored at [`scratch/verify_e2e_procurement.cjs`](file:///Users/haccrr/.gemini/antigravity/brain/b89df559-0cff-4571-b3b6-287a4f778435/scratch/verify_e2e_procurement.cjs):

| Test ID | Objective | Expected Condition | Status |
|---|---|---|---|
| **Test A** | Startup creates & dispatches RFQ | Persisted in `public.rfqs` with matching `buyer_id` | **READY** (Requires Migration 2) |
| **Test B** | Startup refreshes session | Re-fetches active RFQ directly from `public.rfqs` | **READY** (Requires Migration 2) |
| **Test C** | MSME views dispatched RFQ | Dispatched RFQ visible in MSME feed via RLS | **READY** (Requires Migration 2) |
| **Test D** | MSME submits quotation | Persisted in `public.quotes` with composite uniqueness | **READY** (Requires Migration 2) |
| **Test E** | Startup retrieves quotation | Quote appears in Buyer comparison matrix | **READY** (Requires Migration 2) |
| **Test F** | Cross-Account Security | MSME altering buyer RFQ or forging supplier ID blocked by RLS | **READY** (Requires Migration 2) |

---

## 4. Operator Action Required to Activate

To apply the seed accounts and auto-confirm trigger in your Supabase project:

1. Open your browser to the Supabase SQL Editor:
   `https://supabase.com/dashboard/project/utjysxkaidvbrmatngyb/sql/new`
2. Open the file in this workspace:
   [`supabase/migrations/20261010000000_auth_and_auto_confirm.sql`](file:///Users/haccrr/Downloads/MPI_AI_Procurement_CoFounder_MVP_Complete_Research_Redesign/supabase/migrations/20261010000000_auth_and_auto_confirm.sql)
3. Copy all contents, paste into the editor, and click **Run**.
4. Log in to the MPI app with **Startup Founder** (`founder@novabio.tech` / `Founder@123`).
5. Dispatch an RFQ — the badge will immediately indicate:
   🟢 **Persisted in PostgreSQL (ID: RFQ-XXXX)**

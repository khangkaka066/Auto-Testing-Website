# Implementation Plan: Worker Container Architecture

## Mục tiêu
Tách pipeline ra khỏi Express backend, chạy trong một Worker container riêng. Backend chỉ nhận request và enqueue job. Worker poll queue, download source từ R2, chạy pipeline, ghi progress lên Supabase.

## Kiến trúc sau khi triển khai

```
User → [Backend Express] → enqueue job → [Supabase: pipeline_jobs]
                                                  ↑ poll
                                          [Worker Container]
                                            ↓ download source
                                          [Cloudflare R2]
                                            ↓ run pipeline
                                          [Playwright + AI]
                                            ↓ write progress/result
                                          [Supabase: pipeline_jobs]
Frontend polls: Backend Express → reads Supabase → returns status
```

## Điểm thay đổi so với hiện tại

| Hiện tại | Sau khi đổi |
|---|---|
| `setImmediate(runPipelineJob)` - chạy trong cùng process | Worker container poll Supabase queue |
| `jobStore.js` - in-memory `_jobs` object | Supabase table `pipeline_jobs` |
| `onProgress` callback in-memory | Worker ghi progress trực tiếp lên Supabase |
| Source code extract tại chỗ, không cleanup | Worker download từ R2, tự cleanup sau khi xong |

---

## Files cần tạo/sửa

### [NEW] `supabase/migrations/pipeline_jobs.sql`
Tạo bảng `pipeline_jobs` trong Supabase làm job queue + progress store.

### [NEW] `worker/`
Thư mục worker container hoàn toàn độc lập.

### [NEW] `worker/package.json`
Dependencies: `@aws-sdk/client-s3`, `adm-zip`, uuid, supabase-js, dotenv.
Không cần Express.

### [NEW] `worker/Dockerfile`
Kế thừa từ `backend/Dockerfile` (đã có Playwright + Docker CLI).
Override CMD để chạy worker poll loop thay vì server.js.

### [NEW] `worker/src/index.js`
Poll loop: mỗi 5s query `pipeline_jobs WHERE status='queued'`,
atomic claim bằng UPDATE ... WHERE status='queued' RETURNING *,
gọi pipelineRunner, handle lỗi.

### [NEW] `worker/src/pipelineRunner.js`
- Download ZIP từ R2 (dùng `source_archive_key`)
- Extract vào thư mục temp
- Khởi tạo `Pipeline` với `onProgress` ghi lên Supabase
- Sau khi xong: upload report lên Supabase, cleanup temp dir

### [NEW] `worker/src/supabaseProgress.js`
Helper: `updateJobProgress(jobId, changes)` → `supabase.from('pipeline_jobs').update(changes).eq('job_id', jobId)`

### [MODIFY] `backend/src/lib/jobStore.js`
Thêm 2 functions mới (giữ nguyên existing functions để không break):
- `enqueueJobToSupabase(jobData)` → insert vào `pipeline_jobs`
- `getJobFromSupabase(jobId)` → query `pipeline_jobs`

In-memory store vẫn giữ như write-through cache để `/status` endpoint nhanh.

### [MODIFY] `backend/src/api/test/test.controller.js`
- `startTest`: thay `setImmediate(runPipelineJob)` → `enqueueJobToSupabase(job)`
- `startTestFromGithub`: tương tự
- `getTestStatus`: thêm fallback đọc Supabase nếu job không có trong memory
- Xóa function `runPipelineJob` (pipeline không còn chạy trong backend process)

### [MODIFY] `docker-compose.yml`
Thêm service `worker`:
```yaml
worker:
  build:
    context: ./worker
  environment:
    - POLL_INTERVAL_MS=5000
    - MAX_CONCURRENT_JOBS=2
  env_file:
    - ./backend/.env   # dùng chung env (Supabase, R2, AI keys)
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./workspaces:/app/workspaces
  restart: unless-stopped
```

---

## Supabase table schema

```sql
create table pipeline_jobs (
  job_id        uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  project_id    uuid not null,
  status        text not null default 'queued',  -- queued|running|completed|failed
  stage         text,
  progress_percent int default 10,
  message       text,
  sub_progress  jsonb,
  source_archive_key text,   -- R2 key để worker download
  base_url      text,
  test_type     text default 'UI Testing',
  result        jsonb,
  error         jsonb,
  run_id        text,
  tokens_used   int,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
```

---

## Thứ tự thực hiện (execution order)

1. Tạo Supabase migration (bảng `pipeline_jobs`)
2. Tạo `worker/` directory + package.json + Dockerfile
3. Tạo `worker/src/supabaseProgress.js`
4. Tạo `worker/src/pipelineRunner.js` (copy pipeline logic từ test.controller.js)
5. Tạo `worker/src/index.js` (poll loop)
6. Sửa `backend/src/lib/jobStore.js` (thêm Supabase helpers)
7. Sửa `backend/src/api/test/test.controller.js` (enqueue thay vì setImmediate)
8. Sửa `docker-compose.yml` (thêm worker service)
9. Test: `docker-compose up --build`, upload ZIP, verify job progress

---

## Rủi ro & xử lý

| Rủi ro | Xử lý |
|---|---|
| Worker crash giữa chừng | `status='running'` quá 30 phút → worker khác re-claim (stale job recovery) |
| R2 download fail | Retry 3 lần với backoff, mark failed nếu vẫn lỗi |
| Pipeline throws | try/catch trong pipelineRunner, ghi error lên Supabase |
| Race condition 2 worker claim cùng job | UPDATE ... WHERE status='queued' RETURNING * — Supabase atomic |

---

## Không thay đổi

- `Pipeline.js` và toàn bộ `pipeline/stages/` — không sửa
- `frontend/` — không sửa (vẫn poll `/api/test/status/:project_id`)
- Auth, GitHub OAuth, upload logic — không sửa

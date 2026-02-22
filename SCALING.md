# Scaling Playbook

Quick reference for handling traffic spikes and scaling BacklogBox infrastructure.

## Current Setup

- 2x Hetzner CX22 (2 vCPU, 4GB RAM each, ~$5/mo)
- Docker Swarm: 4 app replicas (2 per node)
- Redis: 64MB LRU, ephemeral, on manager node
- Neon free tier Postgres (eu-central-1)
- Caddy serves static assets directly (bypasses Node)
- Blog posts + OG images are prerendered (zero server cost)

---

## 1. Monitor — Know When You're Under Load

SSH into manager:

```bash
# container CPU/memory usage
docker stats

# replica health
docker service ps backlogbox_app

# service logs (last 100 lines, follow)
docker service logs backlogbox_app --tail 100 -f
```

Also check:

- **Axiom** for request volume/latency spikes
- **Sentry** for increased error rates
- **Neon dashboard** for connection count and compute usage

---

## 2. Vertical Scaling — Resize Existing VPS (Recommended First Step)

Resize in Hetzner Cloud Console. Requires a reboot (~30 seconds downtime per node — do one at a time so Swarm keeps serving).

| Plan                  | vCPU  | RAM     | Price/mo | 2x Cost  | Replicas Per Node |
| --------------------- | ----- | ------- | -------- | -------- | ----------------- |
| CX22 (current)        | 2     | 4GB     | ~$5      | ~$10     | 2-3               |
| **CX32 (sweet spot)** | **4** | **8GB** | **~$9**  | **~$18** | 4-6               |
| CX42                  | 8     | 16GB    | ~$17     | ~$34     | 8-10              |
| CX52                  | 16    | 32GB    | ~$33     | ~$66     | 12+               |

**How to resize with minimal downtime:**

```bash
# 1. Drain worker node (moves replicas to manager)
docker node update --availability drain backlogbox-worker

# 2. Resize worker in Hetzner Console (triggers reboot)
#    Hetzner Console → Servers → backlogbox-worker → Rescale

# 3. Re-activate worker
docker node update --availability active backlogbox-worker

# 4. Scale replicas to use new capacity
docker service scale backlogbox_app=6

# 5. Repeat for manager (drain to worker first)
docker node update --availability drain backlogbox-manager
# Resize in Hetzner Console
docker node update --availability active backlogbox-manager
```

After resizing to CX32, bump Redis memory too:

```bash
# Update docker-stack.yml redis command:
# --maxmemory 256mb (up from 64mb)
docker stack deploy -c docker-stack.yml backlogbox
```

---

## 3. Quick Wins — Scale Replicas (Minutes, No Cost)

Each Node.js replica uses ~100-200MB RAM. On CX22 (4GB), 3 replicas is safe. On CX32 (8GB), 6 is comfortable.

```bash
# Scale up (current nodes)
docker service scale backlogbox_app=6

# Check distribution
docker service ps backlogbox_app

# Scale back down after spike
docker service scale backlogbox_app=4
```

---

## 4. Horizontal Scaling — Add a Node (10-15 min, ~$5-9/mo)

When vertical scaling is not enough or you want redundancy.

```bash
# 1. Create new CX22/CX32 on Hetzner (same region, same firewall)

# 2. On the new server: install Docker
curl -fsSL https://get.docker.com | sh

# 3. Get join token from manager
ssh backlogbox-manager "docker swarm join-token worker -q"

# 4. On the new server: join the swarm
docker swarm join --token <WORKER_TOKEN> <MANAGER_IP>:2377

# 5. Open firewall ports on new node
ufw allow 2377/tcp   # Swarm management
ufw allow 7946/tcp   # Node communication
ufw allow 7946/udp
ufw allow 4789/udp   # Overlay network (VXLAN)

# 6. Scale replicas to use new node
docker service scale backlogbox_app=6  # or more

# 7. After spike: drain and remove node
docker node update --availability drain <NODE_ID>
docker node rm <NODE_ID>
# Then delete the Hetzner server
```

---

## 5. Database — Neon (The Real Bottleneck)

Neon free tier limits:

- 0.25 compute units
- ~100 concurrent connections (via pgBouncer)
- Scales to zero when idle (~500ms cold start)

**What hits the DB:** signups, login, board CRUD, profile loads. Landing page and blog are static — no DB.

**If DB is the bottleneck:**

1. **Quick**: upgrade to Neon Launch plan (~$19/mo) — more compute, higher connection limits, no scale-to-zero cold starts
2. **Free**: add app-level caching for public profile pages (currently queries DB every request)

Check Neon dashboard for connection count and compute usage during spikes.

---

## 6. What Already Handles Load Well (No Action Needed)

| Layer              | Why It's Fine                                       |
| ------------------ | --------------------------------------------------- |
| Landing page       | Static HTML, served by Caddy                        |
| Blog posts         | Prerendered at build time                           |
| OG images          | Prerendered PNGs, Caddy serves directly             |
| Static assets      | Caddy serves with 1-year immutable cache            |
| Media cover images | Service worker caches client-side (CacheFirst, 30d) |
| Search API results | Redis LRU cache (5min search, 30min trending)       |
| External API calls | Request coalescing prevents duplicate calls         |

**In a Reddit spike scenario**: most visitors hit the landing page (static) and maybe a blog post (prerendered). Only signups and actual app usage hit the DB. This means your infrastructure handles traffic spikes much better than the raw specs suggest.

---

## 7. After the Spike

```bash
# Scale back to normal
docker service scale backlogbox_app=4

# Remove extra nodes if added
docker node update --availability drain <NODE_ID>
docker node rm <NODE_ID>

# Check for issues that surfaced under load
# - Axiom: search for 5xx errors, slow requests
# - Sentry: new error types
# - Neon: connection limit warnings
```

---

## Decision Tree

```
Traffic spike detected
│
├─ Landing page / blog only (most Reddit spikes)?
│  └─ Do nothing. Caddy handles it.
│
├─ App usage spiking (signups, board activity)?
│  │
│  ├─ CPU/memory OK on nodes?
│  │  └─ Scale replicas: docker service scale backlogbox_app=6
│  │
│  ├─ Nodes maxed out?
│  │  ├─ Quick: resize to CX32 in Hetzner Console
│  │  └─ Or: add a 3rd node (10 min)
│  │
│  └─ DB connection errors in logs?
│     └─ Upgrade Neon to Launch plan ($19/mo)
│
└─ Redis eviction warnings?
   └─ Bump maxmemory to 256mb in docker-stack.yml
```

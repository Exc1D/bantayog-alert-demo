---
name: trailofbits-debug-buttercup
description: "Debug Buttercup — a Kubernetes-based fuzzing orchestration system. Use when pods in the crs namespace are in CrashLoopBackOff, OOMKilled, or restarting, Redis is unresponsive, queues are growing but tasks are not progressing, nodes show DiskPressure/MemoryPressure/PID pressure, or scheduler is stuck."
allowed-tools:
  - Bash
  - Read
---

# Debug Buttercup

Debugging guide for Buttercup — a Kubernetes-based fuzzing orchestration system running in namespace `crs`.

## When to Use

- Pods in the `crs` namespace are in CrashLoopBackOff, OOMKilled, or restarting
- Multiple services restart simultaneously (cascade failure)
- Redis is unresponsive or showing AOF warnings
- Queues are growing but tasks are not progressing
- Nodes show DiskPressure, MemoryPressure, or PID pressure
- Scheduler is stuck and not advancing task state
- Health check probes are failing unexpectedly

## When NOT to Use

- Deploying or upgrading Buttercup (use Helm and deployment guides)
- Debugging issues outside the `crs` Kubernetes namespace
- Performance tuning that doesn't involve a failure symptom

## Namespace and Services

All pods run in namespace `crs`. Key services:

| Layer | Services |
|-------|----------|
| Infra | redis, dind, litellm, registry-cache |
| Orchestration | scheduler, task-server, task-downloader, scratch-cleaner |
| Fuzzing | build-bot, fuzzer-bot, coverage-bot, tracer-bot, merger-bot |
| Analysis | patcher, seed-gen, program-model, pov-reproducer |
| Interface | competition-api, ui |

## Triage Workflow

Always start with triage:

```bash
# 1. Pod status - look for restarts, CrashLoopBackOff, OOMKilled
kubectl get pods -n crs -o wide

# 2. Events - the timeline of what went wrong
kubectl get events -n crs --sort-by='.lastTimestamp'

# 3. Warnings only - filter the noise
kubectl get events -n crs --field-selector type=Warning --sort-by='.lastTimestamp'
```

Then narrow down:

```bash
# Why did a specific pod restart?
kubectl describe pod -n crs <pod-name> | grep -A8 'Last State:'

# Check actual resource limits vs intended
kubectl get pod -n crs <pod-name> -o jsonpath='{.spec.containers[0].resources}'

# Crashed container's logs
kubectl logs -n crs <pod-name> --previous --tail=200

# Current logs
kubectl logs -n crs <pod-name> --tail=200
```

## Cascade Detection

When many pods restart around the same time, check for a shared-dependency failure first. The most common cascade: **Redis goes down → every service gets ConnectionError → mass restarts**.

Look for the same error across multiple `--previous` logs. If they all say `redis.exceptions.ConnectionError`, debug Redis first.

## Redis Debugging

Redis is the backbone. When it goes down, everything cascades.

```bash
# Redis pod status
kubectl get pods -n crs -l app.kubernetes.io/name=redis

# Redis logs
kubectl logs -n crs -l app.kubernetes.io/name=redis --tail=200

# Connect to Redis CLI
kubectl exec -n crs <redis-pod> -- redis-cli

# Inside redis-cli: key diagnostics
INFO memory
INFO persistence
INFO clients
INFO stats
CLIENT LIST
DBSIZE
```

### Queue Inspection

Buttercup uses Redis streams with consumer groups:

| Queue | Stream Key |
|-------|-----------|
| Build | fuzzer_build_queue |
| Crash | fuzzer_crash_queue |
| Tasks Ready | tasks_ready_queue |
| Traced Vulns | traced_vulnerabilities_queue |

```bash
# Check stream length
kubectl exec -n crs <redis-pod> -- redis-cli XLEN fuzzer_build_queue

# Check consumer group lag
kubectl exec -n crs <redis-pod> -- redis-cli XINFO GROUPS fuzzer_build_queue
```

## Resource Pressure

```bash
# Per-pod CPU/memory
kubectl top pods -n crs

# Node-level
kubectl top nodes

# Node conditions
kubectl describe node <node> | grep -A5 Conditions
```

## Health Checks

Pods write timestamps to `/tmp/health_check_alive`. The liveness probe checks file freshness.

```bash
# Check health file freshness
kubectl exec -n crs <pod> -- stat /tmp/health_check_alive
kubectl exec -n crs <pod> -- cat /tmp/health_check_alive
```

## Diagnostic Script

Run the automated triage snapshot:

```bash
bash {baseDir}/scripts/diagnose.sh
```

Pass `--full` to also dump recent logs from all pods:

```bash
bash {baseDir}/scripts/diagnose.sh --full
```

This collects pod status, events, resource usage, Redis health, and queue depths in one pass.

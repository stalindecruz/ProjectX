# Mountebank container load balancer utility

This repository provides a small utility and configuration to run multiple
mountebank instances in containers and load balance them. Each mountebank
instance loads the same imposters config, so requests can be distributed
across containers for higher concurrency.

## What is included

- `mbctl.py`: renders the Docker Compose + Nginx config and manages imposters.
- `docker-compose.yml`: default 3-instance cluster.
- `loadbalancer/nginx.conf`: load balancer for admin and imposter traffic.
- `imposters/imposters.json`: example imposter config.

## Quick start

1. (Optional) Regenerate configs:

   ```bash
   python mbctl.py render --instances 3
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Call the imposter through the load balancer:

   ```bash
   curl http://localhost:4545/
   ```

4. Check admin API through the load balancer:

   ```bash
   curl http://localhost:2525/imposters
   ```

5. Apply the config to each instance (useful if you changed it):

   ```bash
   python mbctl.py apply --config imposters/imposters.json
   ```

6. Check per-instance status:

   ```bash
   python mbctl.py status
   ```

## Scaling

To increase concurrency, generate a larger cluster and restart:

```bash
python mbctl.py render --instances 5
docker compose up -d
```

The load balancer will round-robin across the generated `mb1..mbN` services.

## Ports

- `4545`: load-balanced imposter traffic
- `2525`: load-balanced admin API (read-only is safest)
- `2526+`: per-instance admin ports (mb1 -> 2526, mb2 -> 2527, ...)

## Notes

- The default imposter response is defined in `imposters/imposters.json`.
- For per-instance admin calls, use the host ports exposed in the compose file.

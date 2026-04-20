#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent

DEFAULT_INSTANCES = 3
DEFAULT_ADMIN_PORT = 2525
DEFAULT_ADMIN_HOST_BASE_PORT = 2526
DEFAULT_IMPOSTER_PORT = 4545
DEFAULT_MB_IMAGE = "bbyars/mountebank:latest"
DEFAULT_LB_IMAGE = "nginx:latest"
DEFAULT_CONFIG_PATH = ROOT / "imposters" / "imposters.json"
DEFAULT_NGINX_PATH = ROOT / "loadbalancer" / "nginx.conf"
DEFAULT_COMPOSE_PATH = ROOT / "docker-compose.yml"


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


def render_nginx_conf(instances: int, admin_port: int, imposter_port: int) -> str:
    lines = [
        "worker_processes 1;",
        "events {",
        "  worker_connections 1024;",
        "}",
        "http {",
        "  upstream mb_admin {",
    ]
    for idx in range(1, instances + 1):
        lines.append(f"    server mb{idx}:{admin_port};")
    lines.extend(
        [
            "  }",
            "  upstream mb_data {",
        ]
    )
    for idx in range(1, instances + 1):
        lines.append(f"    server mb{idx}:{imposter_port};")
    lines.extend(
        [
            "  }",
            "  server {",
            f"    listen {admin_port};",
            "    location / {",
            "      proxy_pass http://mb_admin;",
            "      proxy_http_version 1.1;",
            "      proxy_set_header Connection \"\";",
            "      proxy_set_header Host $host;",
            "      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
            "    }",
            "  }",
            "  server {",
            f"    listen {imposter_port};",
            "    location / {",
            "      proxy_pass http://mb_data;",
            "      proxy_http_version 1.1;",
            "      proxy_set_header Connection \"\";",
            "      proxy_set_header Host $host;",
            "      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
            "    }",
            "  }",
            "}",
        ]
    )
    return "\n".join(lines)


def render_compose(
    instances: int,
    admin_port: int,
    admin_host_base_port: int,
    imposter_port: int,
    mb_image: str,
    lb_image: str,
) -> str:
    lines = [
        'version: "3.9"',
        "services:",
        "  lb:",
        f"    image: {lb_image}",
        "    ports:",
        f'      - "{admin_port}:{admin_port}"',
        f'      - "{imposter_port}:{imposter_port}"',
        "    volumes:",
        "      - ./loadbalancer/nginx.conf:/etc/nginx/nginx.conf:ro",
        "    depends_on:",
    ]
    for idx in range(1, instances + 1):
        lines.append(f"      - mb{idx}")
    for idx in range(1, instances + 1):
        host_port = admin_host_base_port + (idx - 1)
        lines.extend(
            [
                f"  mb{idx}:",
                f"    image: {mb_image}",
                "    command: [\"--configfile\", \"/imposters/imposters.json\"]",
                "    volumes:",
                "      - ./imposters:/imposters:ro",
                "    ports:",
                f'      - "{host_port}:{admin_port}"',
            ]
        )
    return "\n".join(lines)


def example_imposter_config(imposter_port: int) -> str:
    payload = {
        "imposters": [
            {
                "port": imposter_port,
                "protocol": "http",
                "name": "example",
                "stubs": [
                    {
                        "responses": [
                            {
                                "is": {
                                    "statusCode": 200,
                                    "headers": {
                                        "Content-Type": "application/json"
                                    },
                                    "body": "{\"message\":\"hello from mountebank\"}",
                                }
                            }
                        ]
                    }
                ],
            }
        ]
    }
    return json.dumps(payload, indent=2, sort_keys=True)


def ensure_example_imposters(path: Path, imposter_port: int) -> bool:
    if path.exists():
        return False
    write_file(path, example_imposter_config(imposter_port))
    return True


def parse_targets(targets_arg: str, instances: int, admin_host_base_port: int):
    if instances < 1:
        raise SystemExit("Instances must be >= 1.")
    if targets_arg:
        targets = [t.strip() for t in targets_arg.split(",") if t.strip()]
    else:
        targets = [
            f"http://localhost:{admin_host_base_port + idx}"
            for idx in range(instances)
        ]
    if not targets:
        raise SystemExit("No mountebank targets resolved.")
    return targets


def request_json(method: str, url: str, payload, timeout: float):
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8")
        return response.status, body


def apply_imposters(config_path: Path, targets, timeout: float):
    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"Config not found: {config_path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {config_path}: {exc}")

    if "imposters" not in payload:
        raise SystemExit("Config must include an 'imposters' key.")

    failures = 0
    for target in targets:
        url = target.rstrip("/") + "/imposters"
        try:
            status, _body = request_json("PUT", url, payload, timeout)
            print(f"{target}: applied ({status})")
        except urllib.error.HTTPError as exc:
            failures += 1
            detail = exc.read().decode("utf-8", errors="replace")
            print(f"{target}: failed ({exc.code}) {detail}")
        except Exception as exc:  # pylint: disable=broad-except
            failures += 1
            print(f"{target}: failed ({exc})")
    if failures:
        raise SystemExit(f"{failures} target(s) failed.")


def show_status(targets, timeout: float):
    failures = 0
    for target in targets:
        url = target.rstrip("/") + "/imposters"
        try:
            status, body = request_json("GET", url, None, timeout)
            payload = json.loads(body) if body else {}
            count = len(payload.get("imposters", []))
            print(f"{target}: {count} imposters ({status})")
        except urllib.error.HTTPError as exc:
            failures += 1
            detail = exc.read().decode("utf-8", errors="replace")
            print(f"{target}: failed ({exc.code}) {detail}")
        except Exception as exc:  # pylint: disable=broad-except
            failures += 1
            print(f"{target}: failed ({exc})")
    if failures:
        raise SystemExit(f"{failures} target(s) failed.")


def handle_render(args):
    if args.instances < 1:
        raise SystemExit("Instances must be >= 1.")
    nginx_conf = render_nginx_conf(
        instances=args.instances,
        admin_port=args.admin_port,
        imposter_port=args.imposter_port,
    )
    compose_yaml = render_compose(
        instances=args.instances,
        admin_port=args.admin_port,
        admin_host_base_port=args.admin_host_base_port,
        imposter_port=args.imposter_port,
        mb_image=args.mb_image,
        lb_image=args.lb_image,
    )
    write_file(DEFAULT_NGINX_PATH, nginx_conf)
    write_file(DEFAULT_COMPOSE_PATH, compose_yaml)
    created = ensure_example_imposters(DEFAULT_CONFIG_PATH, args.imposter_port)
    if created:
        print(f"Wrote example imposters to {DEFAULT_CONFIG_PATH}")
    print(f"Wrote {DEFAULT_NGINX_PATH}")
    print(f"Wrote {DEFAULT_COMPOSE_PATH}")


def handle_apply(args):
    targets = parse_targets(
        args.targets, args.instances, args.admin_host_base_port
    )
    apply_imposters(Path(args.config), targets, args.timeout)


def handle_status(args):
    targets = parse_targets(
        args.targets, args.instances, args.admin_host_base_port
    )
    show_status(targets, args.timeout)


def build_parser():
    parser = argparse.ArgumentParser(
        description=(
            "Utility for running a multi-instance mountebank cluster "
            "behind a load balancer."
        )
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    render = subparsers.add_parser(
        "render", help="Render docker-compose and nginx config files."
    )
    render.add_argument(
        "--instances",
        type=int,
        default=DEFAULT_INSTANCES,
        help="Number of mountebank instances.",
    )
    render.add_argument(
        "--admin-port",
        type=int,
        default=DEFAULT_ADMIN_PORT,
        help="Admin API port exposed by load balancer and containers.",
    )
    render.add_argument(
        "--admin-host-base-port",
        type=int,
        default=DEFAULT_ADMIN_HOST_BASE_PORT,
        help="First host port to map per-instance admin APIs.",
    )
    render.add_argument(
        "--imposter-port",
        type=int,
        default=DEFAULT_IMPOSTER_PORT,
        help="Imposter port exposed by load balancer.",
    )
    render.add_argument(
        "--mb-image",
        default=DEFAULT_MB_IMAGE,
        help="Docker image for mountebank instances.",
    )
    render.add_argument(
        "--lb-image",
        default=DEFAULT_LB_IMAGE,
        help="Docker image for the load balancer.",
    )
    render.set_defaults(func=handle_render)

    apply_cmd = subparsers.add_parser(
        "apply", help="Apply imposters config to all instances."
    )
    apply_cmd.add_argument(
        "--config",
        default=str(DEFAULT_CONFIG_PATH),
        help="Path to the imposters JSON config.",
    )
    apply_cmd.add_argument(
        "--targets",
        default=os.environ.get("MB_TARGETS", ""),
        help="Comma-separated admin URLs (overrides instances).",
    )
    apply_cmd.add_argument(
        "--instances",
        type=int,
        default=DEFAULT_INSTANCES,
        help="Number of instances to target if --targets not set.",
    )
    apply_cmd.add_argument(
        "--admin-host-base-port",
        type=int,
        default=DEFAULT_ADMIN_HOST_BASE_PORT,
        help="First host port for per-instance admin API.",
    )
    apply_cmd.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="HTTP timeout in seconds.",
    )
    apply_cmd.set_defaults(func=handle_apply)

    status = subparsers.add_parser(
        "status", help="Show imposter counts for each instance."
    )
    status.add_argument(
        "--targets",
        default=os.environ.get("MB_TARGETS", ""),
        help="Comma-separated admin URLs (overrides instances).",
    )
    status.add_argument(
        "--instances",
        type=int,
        default=DEFAULT_INSTANCES,
        help="Number of instances to target if --targets not set.",
    )
    status.add_argument(
        "--admin-host-base-port",
        type=int,
        default=DEFAULT_ADMIN_HOST_BASE_PORT,
        help="First host port for per-instance admin API.",
    )
    status.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="HTTP timeout in seconds.",
    )
    status.set_defaults(func=handle_status)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Attach Veyra to the existing Caddy without recreating Joinly containers."""
import datetime
import hashlib
import pathlib
import shutil
import subprocess
import yaml

def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout

root = pathlib.Path("/opt/veyra")
caddy = pathlib.Path("/opt/joinly/infra/Caddyfile")
compose = pathlib.Path("/opt/joinly/docker-compose.vps.yml")
domain = "158.160.159.254:8443"
before = run("curl", "--max-time", "15", "--fail", "--silent", "--resolve", "158.160.159.254:443:127.0.0.1", "https://158.160.159.254/")
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
backup = root / "backups" / stamp
backup.mkdir(parents=True, mode=0o700)
shutil.copy2(caddy, backup / "Caddyfile")
shutil.copy2(compose, backup / "docker-compose.vps.yml")
original = caddy.read_text()
candidate_text = original if domain in original else original.rstrip() + "\n\n" + (root / "deploy/Caddyfile.veyra").read_text()
candidate = root / "Caddyfile.candidate"
candidate.write_text(candidate_text)
run("docker", "cp", str(candidate), "joinly-caddy-1:/tmp/veyra-Caddyfile")
run("docker", "exec", "joinly-caddy-1", "caddy", "validate", "--config", "/tmp/veyra-Caddyfile", "--adapter", "caddyfile")
cfg = yaml.safe_load(compose.read_text())
service = cfg["services"]["caddy"]
networks = service.get("networks", ["default"])
if isinstance(networks, list):
    networks = {name: None for name in networks}
networks["veyra_proxy"] = {"aliases": ["veyra-tls"]}
service["networks"] = networks
cfg.setdefault("networks", {})["veyra_proxy"] = {"external": True, "name": "veyra_proxy"}
compose.write_text(yaml.safe_dump(cfg, sort_keys=False))
try:
    run("docker", "compose", "-f", "/opt/joinly/docker-compose.yml", "-f", str(compose), "config", "--quiet")
    connected = run("docker", "network", "inspect", "veyra_proxy", "--format", "{{range .Containers}}{{.Name}} {{end}}")
    if "joinly-caddy-1" not in connected.split():
        run("docker", "network", "connect", "--alias", "veyra-tls", "veyra_proxy", "joinly-caddy-1")
    caddy.write_text(candidate_text)  # Keep the inode used by the existing bind mount.
    run("docker", "exec", "joinly-caddy-1", "caddy", "reload", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
    after = run("curl", "--max-time", "15", "--fail", "--silent", "--resolve", "158.160.159.254:443:127.0.0.1", "https://158.160.159.254/")
    if hashlib.sha256(before.encode()).digest() != hashlib.sha256(after.encode()).digest():
        raise RuntimeError("Joinly home response changed")
except Exception:
    caddy.write_text(original)
    shutil.copy2(backup / "docker-compose.vps.yml", compose)
    run("docker", "exec", "joinly-caddy-1", "caddy", "reload", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
    raise
print("Caddy reloaded; Joinly response unchanged; backup: " + str(backup))

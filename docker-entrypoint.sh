#!/bin/sh
set -e

# Export Docker Swarm secrets as environment variables.
# Secrets are mounted at /run/secrets/<NAME> — we read each file and
# export its contents under the same variable name.
if [ -d "/run/secrets" ]; then
  for secret_file in /run/secrets/*; do
    [ -f "$secret_file" ] || continue
    secret_name=$(basename "$secret_file")
    export "$secret_name=$(cat "$secret_file")"
  done
fi

exec "$@"

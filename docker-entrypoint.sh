#!/bin/sh
set -e

# Bring the schema forward before serving. A container that starts against a
# database it does not match will fail in ways that look like application bugs,
# so a failed migration should fail the deploy instead.
#
# Set SKIP_MIGRATIONS=1 where something else owns migrations, or to get a
# container up for diagnosis when a migration is the thing that is broken.
if [ "${SKIP_MIGRATIONS}" = "1" ]; then
  echo "entrypoint: SKIP_MIGRATIONS=1, not migrating"
else
  node .output/migrate.mjs
fi

# exec so the server becomes PID 1 and receives stop signals directly.
exec node .output/server/index.mjs

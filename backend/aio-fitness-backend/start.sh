#!/bin/bash
set -a
source "$(dirname "$0")/.env"
set +a
./mvnw spring-boot:run

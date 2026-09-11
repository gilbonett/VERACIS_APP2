FROM grafana/mimir-alpine:latest
COPY mimir.yaml /etc/mimir/mimir.yaml
CMD ["-config.file=/etc/mimir/mimir.yaml", "-config.expand-env=true", "-distributor.otel-promote-resource-attributes=service.name,deployment.environment.name"]

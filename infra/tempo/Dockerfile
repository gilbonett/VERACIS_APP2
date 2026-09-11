FROM grafana/tempo:latest
COPY tempo.yaml /etc/tempo/tempo.yaml
CMD ["-config.file=/etc/tempo/tempo.yaml", "-config.expand-env=true"]

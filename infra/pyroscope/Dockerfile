FROM alpine AS builder
RUN apk add --no-cache busybox-static && \
    mkdir -p /tmp/pyroscope/data

FROM grafana/pyroscope:latest
COPY --from=builder /bin/busybox.static /bin/busybox
COPY --from=builder /tmp/pyroscope /tmp/pyroscope
COPY pyroscope.yaml /etc/pyroscope/pyroscope.yaml
CMD ["-config.file=/etc/pyroscope/pyroscope.yaml", "-config.expand-env=true" ]

FROM grafana/grafana:13.0.2

ENV GF_PLUGINS_PREINSTALL_SYNC=\
grafana-pyroscope-app,\
grafana-lokiexplore-app,\
grafana-exploretraces-app,\
grafana-metricsdrilldown-app,\
yesoreyeram-infinity-datasource,\
grafana-oncall-app

ENV GF_FEATURE_TOGGLES_ENABLE=\
traceToMetrics,\
traceToProfiles,\
correlations

ENV GF_SECURITY_ANGULAR_SUPPORT_ENABLED=false
ENV GF_UNIFIED_ALERTING_ENABLED=true
COPY provisioning/datasources/datasources.yaml /etc/grafana/provisioning/datasources/datasources.yaml

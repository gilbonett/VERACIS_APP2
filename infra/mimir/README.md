## LOGIN TO AWS CLI

```bash
aws configure sso
```

## LOGIN TO ECR

```bash
aws ecr get-login-password --region sa-east-1 --profile power-user-einstein-sandbox-522814724197 | docker login --username AWS --password-stdin 522814724197.dkr.ecr.sa-east-1.amazonaws.com
```

## BUILD IMAGE

```bash
docker build --platform linux/amd64 -t veracis/mimir .
```

## IMAGE TAG

```bash
docker tag veracis/mimir:latest 522814724197.dkr.ecr.sa-east-1.amazonaws.com/veracis/mimir:latest
```

## PUSH IMAGE

```bash
docker push 522814724197.dkr.ecr.sa-east-1.amazonaws.com/veracis/mimir:latest
```

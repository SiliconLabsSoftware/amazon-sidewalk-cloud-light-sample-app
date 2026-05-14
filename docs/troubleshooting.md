# Troubleshooting

## Cross-Platform `esbuild` Binary Incompatibility

### Symptoms

When running `npm run build` in the `lambda/` directory, you see one of:

```
sh: 1: esbuild: Exec format error
```

```
sh: /Users/.../lambda/node_modules/.bin/esbuild: cannot execute binary file
```

### Cause

`npm install` downloads platform-specific native binaries for `esbuild`. If you run `npm install` on macOS, it downloads a macOS binary. If you then try to build inside Docker (Linux), the binary cannot execute — and vice versa.

This commonly happens when switching between native development and Docker-based deployment, or when the `node_modules` directory was created on a different OS or architecture.

You can verify the mismatch with:

```bash
file -b lambda/node_modules/.bin/esbuild
```

- On macOS: `Mach-O 64-bit executable arm64`
- In Docker (Linux): `ELF 64-bit LSB executable, ARM aarch64, ...`

### Fix

Delete `node_modules` and reinstall in the correct environment:

```bash
rm -rf lambda/node_modules
# Then run npm install in the environment where you'll build:
# - If building in Docker: docker compose run --rm deployer lambda-deps
# - If building natively: cd lambda && npm install
```

### Rule of Thumb

Run `npm install` in the same environment where `npm run build` will execute. If you switch between Docker and native builds, clean and reinstall dependencies first. The `deploy` command runs `npm install` as part of its flow, so this issue primarily arises when you have leftover `node_modules` from a previous environment.

## Terraform Certificate Error (Corporate Proxy / VPN)

### Symptom

```
Error: Failed to query available provider packages

Could not retrieve the list of available versions for provider hashicorp/aws:
could not connect to registry.terraform.io: failed to request discovery document:
tls: failed to verify certificate: x509: certificate signed by unknown authority
```

### Cause

A corporate proxy or VPN is performing TLS interception. The Docker container does not have your organization's root CA certificate installed, so it cannot verify the proxied TLS connection to `registry.terraform.io`.

### Fix

1. Copy the sample script:
  ```bash
   cp certificate-fix.sh-sample certificate-fix.sh
  ```
2. Edit `certificate-fix.sh` to download or mount your corporate root CA certificate and install it. The sample shows the pattern:
  ```bash
   curl -fsSL https://your-cert-server/your-cert.der \
       -o /usr/local/share/ca-certificates/your-cert.der
   openssl x509 -inform der \
       -in /usr/local/share/ca-certificates/your-cert.der \
       -out /usr/local/share/ca-certificates/your-cert.crt
   update-ca-certificates
  ```
3. The script runs automatically — `run.sh` executes `certificate-fix.sh` if the file exists, before any other operations.

The `certificate-fix.sh` file is gitignored since it contains environment-specific configuration. 

Alternatively, you can skip Docker entirely and deploy natively from your host, which likely already has the necessary certificates.

## Docker deployment: AWS credentials not found

### Symptom

`docker compose run --rm deployer` fails early with:

```
Error: Failed to retrieve AWS Account ID. Please check your AWS credentials.
Example ways to provide AWS credentials:
  - set environment variables AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (+ optional AWS_SESSION_TOKEN), or
  - set env or configure.sh variable AWS_PROFILE (with ~/.aws/credentials mounted into the container)
```

Your `configure.sh` may already set `AWS_PROFILE` correctly and `~/.aws/credentials` on the host may be fine.

### Cause

`docker-compose.yml` bind-mounts your credentials file using `$HOME`:

```yaml
volumes:
  - $HOME/.aws/credentials:/root/.aws/credentials:ro
```

When Compose expands `$HOME`, it uses the environment of the user running the command. If you prefix the command with `**sudo**`, `$HOME` is often **root's home** (for example `/var/root` on macOS, `/root` on Linux), not your own user's home. Docker then mounts the wrong path. If that path has no file, Docker can create an empty directory at the mount point inside the container, so the AWS CLI sees no credentials even though `AWS_PROFILE` is set.

### Fix

1. **Prefer running without `sudo`.** On macOS with Docker Desktop, your user can run `docker compose` directly; that keeps `$HOME` pointing at your real home and the mount works.
2. **If you must use `sudo`**, preserve your home (or credentials path) explicitly, for example:
  ```bash
   sudo -E docker compose run --rm deployer
  ```
   (Run that from a shell where `$HOME` is already your user’s home, before `sudo` changes the effective user.)
3. **Last resort:** Edit `docker-compose.yml` and replace `$HOME/.aws/credentials` with the **absolute path** to your credentials file (for example `/Users/yourname/.aws/credentials`), then run Compose again.

You can confirm the CLI works on the host with `aws sts get-caller-identity --profile <your-profile>`. Inside the container, the same command should succeed after the mount is correct.

## `run.sh version` Fails on macOS

### Symptom

```
cat: /etc/os-release: No such file or directory
```

### Cause

The `version` command reads `/etc/os-release`, which exists in Linux (including the Docker container) but not on macOS.

### Impact

None — this only affects the version reporting command. Deployment works normally. Run `./run.sh version` inside the Docker container if you need the output.

## Device Not Appearing in the UI

### Checklist

1. **Is the device sending uplinks?** Use the MQTT test client in the AWS IoT Console to subscribe to `CloudLight/received` (Sidewalk devices) or `CloudLight/simulated/+/received` (simulated devices) and verify messages arrive.
2. **Was the cloud infrastructure deployed?** The IoT Wireless destination and topic rules must exist. If you recently ran `./run.sh destroy`, the infrastructure is gone and no uplinks will be processed.
3. **Has the device completed pairing?** The device must send the pairing message (`$v1+cloud_light`) and receive `ready` before it appears in the UI. Check the simulator's log panel or the device's serial output.
4. **Check Lambda logs.** In the AWS Console, go to CloudWatch → Log groups → `/aws/lambda/CloudLightUplink` and look for errors.
5. **Has the device expired?** Device records have a 24-hour TTL. If the device hasn't sent any messages in over a day, its record has been deleted. The device will re-appear when it sends another uplink and re-pairs.
6. **Is the browser connected?** Check that the WebSocket connection is active (browser dev tools → Network → WS). If the connection dropped, refresh the page.

## WebSocket Disconnects

API Gateway WebSocket connections have a **10-minute idle timeout**. The frontend sends keepalive messages every 9 minutes to prevent disconnection.

If you experience frequent disconnects:

- **After 5 reconnect failures**, the frontend stops retrying. Refresh the page or re-login to reconnect.
- **24 hours of browser inactivity** (no mouse/keyboard/touch) causes the frontend to intentionally disconnect and stop keepalives.
- Check your network — proxies or firewalls may close long-lived WebSocket connections.

## Frontend Shows Stale Data After Redeploy

### Cause

CloudFront caches the previous version of the frontend. The `run.sh ui` command creates a cache invalidation (`/`*), but propagation takes a few minutes.

### Fix

- Wait a few minutes for the CloudFront invalidation to propagate
- Hard-refresh the browser (Ctrl+Shift+R / Cmd+Shift+R)
- Clear the browser cache

## Password Issues

**Maximum 20 characters.** The password is embedded in a URL that the device receives as a downlink message. The URL must fit within predefined device buffers, so the password is limited to 20 characters.

**Auto-generated password.** If `FRONTEND_PASSWORD` is left empty in `configure.sh`, the deploy script generates a 4-digit numeric password and saves it back to `configure.sh`. Check the file after your first deploy to see the generated value.

**Changing the password.** Since the password is baked into the Lambda environment variables and the frontend build, changing it requires redeployment:

```bash
# Edit configure.sh with the new password, then:
docker compose run --rm deployer tf    # redeploy Lambda with new env vars
docker compose run --rm deployer ui    # rebuild and redeploy frontend
```

Or in one step: `docker compose run --rm deployer` (full deploy).
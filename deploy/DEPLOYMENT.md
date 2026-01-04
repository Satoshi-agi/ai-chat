# AI Chat - Deployment Guide

This guide covers deploying the AI Chat application to Google Cloud Run.

## Prerequisites

1. **Google Cloud Platform Account**
   - Create a GCP account at https://cloud.google.com
   - Create a new project or use an existing one

2. **Required Tools**
   - [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install)
   - [Docker](https://docs.docker.com/get-docker/)
   - Git

3. **API Keys and Services**
   - Anthropic API key (get from https://console.anthropic.com)
   - MongoDB database (MongoDB Atlas recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-chat
```

### 2. Set Environment Variables

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project $GCP_PROJECT_ID
```

### 4. Setup Secrets

Run the setup script to configure secrets in Google Cloud Secret Manager:

```bash
./deploy/setup-secrets.sh
```

You'll be prompted to enter:
- Anthropic API Key
- MongoDB URI

### 5. Deploy to Cloud Run

```bash
./deploy/deploy.sh
```

The script will:
- Build the Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Output the service URL

## Manual Deployment

If you prefer to deploy manually:

### 1. Enable Required APIs

```bash
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

### 2. Create Secrets

```bash
# Create ANTHROPIC_API_KEY secret
echo -n "your-api-key" | gcloud secrets create ANTHROPIC_API_KEY \
    --replication-policy="automatic" \
    --data-file=-

# Create MONGODB_URI secret
echo -n "your-mongodb-uri" | gcloud secrets create MONGODB_URI \
    --replication-policy="automatic" \
    --data-file=-
```

### 3. Build and Push Docker Image

```bash
# Build the image
docker build -t gcr.io/$GCP_PROJECT_ID/ai-chat:latest .

# Configure Docker authentication
gcloud auth configure-docker

# Push to GCR
docker push gcr.io/$GCP_PROJECT_ID/ai-chat:latest
```

### 4. Deploy to Cloud Run

```bash
gcloud run deploy ai-chat \
    --image gcr.io/$GCP_PROJECT_ID/ai-chat:latest \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
    --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 3000 \
    --timeout 300
```

## GitHub Actions CI/CD

The repository includes GitHub Actions workflows for automated deployment.

### Setup GitHub Secrets

In your GitHub repository settings, add these secrets:

1. **GCP_PROJECT_ID**: Your Google Cloud project ID
2. **GCP_SA_KEY**: Service account key JSON (see below)

### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create key file
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com
```

Copy the contents of `key.json` and add it as the `GCP_SA_KEY` secret in GitHub.

### Automated Deployment

Push to the `main` branch to trigger automatic deployment:

```bash
git push origin main
```

## Local Development with Docker

### Using Docker Compose

```bash
# Start MongoDB and the application
docker-compose up

# Start only MongoDB for local development
docker-compose -f docker-compose.dev.yml up
```

### Build and Run Locally

```bash
# Build the image
docker build -t ai-chat:local .

# Run the container
docker run -p 3000:3000 \
    -e MONGODB_URI=your-mongodb-uri \
    -e ANTHROPIC_API_KEY=your-api-key \
    ai-chat:local
```

## Monitoring and Logs

### View Logs

```bash
# Stream logs
gcloud run services logs tail ai-chat --region asia-northeast1

# View recent logs
gcloud run services logs read ai-chat --region asia-northeast1 --limit 50
```

### Check Service Status

```bash
# Get service details
gcloud run services describe ai-chat --region asia-northeast1

# List all revisions
gcloud run revisions list --service ai-chat --region asia-northeast1
```

### Health Check

```bash
# Test health endpoint
curl https://your-service-url/api/health
```

## Updating the Deployment

### Update Secrets

```bash
# Update ANTHROPIC_API_KEY
echo -n "new-api-key" | gcloud secrets versions add ANTHROPIC_API_KEY --data-file=-

# Update MONGODB_URI
echo -n "new-mongodb-uri" | gcloud secrets versions add MONGODB_URI --data-file=-
```

### Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service ai-chat --region asia-northeast1

# Update traffic to previous revision
gcloud run services update-traffic ai-chat \
    --to-revisions=REVISION_NAME=100 \
    --region asia-northeast1
```

## Scaling Configuration

### Auto-scaling Settings

Cloud Run automatically scales based on:
- Concurrent requests (default: 80 per instance)
- CPU utilization
- Memory usage

Current configuration:
- Min instances: 0 (scales to zero when idle)
- Max instances: 10
- Memory: 512Mi
- CPU: 1

### Adjust Scaling

```bash
gcloud run services update ai-chat \
    --min-instances 1 \
    --max-instances 20 \
    --region asia-northeast1
```

## Cost Optimization

1. **Scale to Zero**: Set `min-instances: 0` to avoid charges when idle
2. **Right-size Resources**: Monitor usage and adjust CPU/memory
3. **Use Secret Manager**: Avoid hardcoding credentials
4. **Enable Request Logging**: Monitor and optimize slow endpoints

## Troubleshooting

### Common Issues

**Issue: Container fails to start**
- Check logs: `gcloud run services logs read ai-chat`
- Verify environment variables and secrets
- Test locally with Docker first

**Issue: Database connection fails**
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access settings
- Ensure Secret Manager permissions are set

**Issue: API errors**
- Verify ANTHROPIC_API_KEY is valid
- Check API rate limits
- Review application logs

### Debug Mode

Enable debug logging:

```bash
gcloud run services update ai-chat \
    --set-env-vars "LOG_LEVEL=debug" \
    --region asia-northeast1
```

## Security Best Practices

1. ✅ Use Secret Manager for sensitive data
2. ✅ Run as non-root user (configured in Dockerfile)
3. ✅ Enable HTTPS (automatic with Cloud Run)
4. ✅ Implement rate limiting (configured in application)
5. ✅ Use latest security patches (alpine base image)
6. ✅ Scan images for vulnerabilities

## Support

For issues or questions:
- Check application logs
- Review Cloud Run documentation
- Open an issue in the repository

---

**Last Updated**: 2026-01-04

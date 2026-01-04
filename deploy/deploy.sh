#!/bin/bash

# Deployment script for Google Cloud Run
# This script builds and deploys the AI Chat application to Cloud Run

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
SERVICE_NAME="ai-chat"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AI Chat - Cloud Run Deployment ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}Authenticating with Google Cloud...${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t $IMAGE_NAME:latest .

# Tag with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag $IMAGE_NAME:latest $IMAGE_NAME:$TIMESTAMP

# Configure Docker to use gcloud as a credential helper
echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker --quiet

# Push the image to Google Container Registry
echo -e "${YELLOW}Pushing image to GCR...${NC}"
docker push $IMAGE_NAME:latest
docker push $IMAGE_NAME:$TIMESTAMP

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:$TIMESTAMP \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
    --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 3000 \
    --timeout 300

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)')

echo ""
echo -e "${GREEN}=== Deployment Successful ===${NC}"
echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
echo ""
echo "Test the deployment:"
echo "  curl $SERVICE_URL/api/health"
echo ""
echo "View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region $REGION"

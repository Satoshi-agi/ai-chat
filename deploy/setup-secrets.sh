#!/bin/bash

# Setup script for Google Cloud Secret Manager
# Creates required secrets for the AI Chat application

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AI Chat - Secret Manager Setup ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable Secret Manager API
echo -e "${YELLOW}Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com

# Function to create or update secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    if gcloud secrets describe $SECRET_NAME &> /dev/null; then
        echo -e "${YELLOW}Secret $SECRET_NAME already exists, creating new version...${NC}"
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=-
    else
        echo -e "${YELLOW}Creating secret $SECRET_NAME...${NC}"
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME \
            --replication-policy="automatic" \
            --data-file=-
    fi
}

# Prompt for ANTHROPIC_API_KEY
echo ""
echo -e "${YELLOW}Enter your Anthropic API Key:${NC}"
read -s ANTHROPIC_API_KEY
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}Error: ANTHROPIC_API_KEY cannot be empty${NC}"
    exit 1
fi

create_or_update_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

# Prompt for MONGODB_URI
echo ""
echo -e "${YELLOW}Enter your MongoDB URI:${NC}"
echo -e "${YELLOW}Example: mongodb+srv://user:password@cluster.mongodb.net/ai-chat${NC}"
read -s MONGODB_URI
echo ""

if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}Error: MONGODB_URI cannot be empty${NC}"
    exit 1
fi

create_or_update_secret "MONGODB_URI" "$MONGODB_URI"

# Grant Cloud Run service account access to secrets
echo ""
echo -e "${YELLOW}Granting Cloud Run access to secrets...${NC}"

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

gcloud secrets add-iam-policy-binding MONGODB_URI \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo ""
echo -e "${GREEN}=== Secret Setup Complete ===${NC}"
echo ""
echo "Secrets created:"
echo "  - ANTHROPIC_API_KEY"
echo "  - MONGODB_URI"
echo ""
echo "You can now deploy the application using ./deploy.sh"

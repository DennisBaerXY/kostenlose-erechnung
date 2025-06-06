#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Sync to S3
echo "Uploading to S3..."
aws s3 sync build/ s3://kostenlose-erechnung.de \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML files with shorter cache
aws s3 sync build/ s3://kostenlose-erechnung.de \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude "*" \
  --include "*.html" \
  --include "*.json"

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id E3SYYDB1ZDRV2I \
  --paths "/*"

echo "Deployment complete!"

sleep 20
#!/bin/bash

# Backup the original service
mv src/services/affiliateService.ts src/services/affiliateService.ts.backup

# Replace with the fixed version
mv src/services/affiliateServiceFixed.ts src/services/affiliateService.ts

echo "✅ Affiliate service replaced with fixed version"
echo "📁 Original backed up as affiliateService.ts.backup"

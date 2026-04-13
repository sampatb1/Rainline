# Rainline MVP - Production Deployment

## 🎉 Deployment Complete!

The Rainline MVP application has been successfully deployed to AWS production environment.

## Production URLs

### Frontend (CloudFront)
**URL:** https://dg6vtbn7r4das.cloudfront.net

The frontend is hosted on AWS CloudFront with S3 as the origin, providing:
- Global CDN distribution
- HTTPS encryption
- Fast content delivery
- Automatic cache invalidation on updates

### Backend API (API Gateway)
**URL:** https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com/prod/

The backend is deployed as serverless Lambda functions behind API Gateway.

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (CloudFront + S3)                                  │
│  └─ https://dg6vtbn7r4das.cloudfront.net                    │
│     ├─ S3 Bucket: rainline-frontend-656721751462            │
│     ├─ CloudFront Distribution: E3CNLTRSL37KMW              │
│     └─ Origin Access Identity for secure S3 access          │
│                                                               │
│  Backend (API Gateway + Lambda)                              │
│  └─ https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com  │
│     ├─ Lambda: FarmsHandler                                  │
│     ├─ Lambda: FieldsHandler                                 │
│     ├─ Lambda: RecommendationsHandler (with Bedrock)        │
│     └─ Lambda: FeedbackHandler                               │
│                                                               │
│  Database (DynamoDB)                                         │
│  ├─ rainline-farms                                           │
│  ├─ rainline-fields                                          │
│  ├─ rainline-recommendations                                 │
│  └─ rainline-feedback                                        │
│                                                               │
│  AI Enhancement                                              │
│  └─ Amazon Bedrock (Claude 3 Haiku)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Deployed Resources

### Frontend
- **S3 Bucket:** `rainline-frontend-656721751462`
- **CloudFront Distribution ID:** `E3CNLTRSL37KMW`
- **CloudFront URL:** https://dg6vtbn7r4das.cloudfront.net

### Backend
- **API Gateway:** Rainline MVP API
- **Lambda Functions:**
  - FarmsHandler (10s timeout)
  - FieldsHandler (10s timeout)
  - RecommendationsHandler (30s timeout for Bedrock)
  - FeedbackHandler (10s timeout)

### Database
- **DynamoDB Tables:**
  - rainline-farms
  - rainline-fields
  - rainline-recommendations
  - rainline-feedback

### AI Service
- **Amazon Bedrock Model:** Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)

## Features Deployed

✅ Farm Management (Create, List, Delete)
✅ Field Management (Create, List, Delete)
✅ AI-Powered Irrigation Recommendations
✅ Weather Integration (OpenWeatherMap)
✅ Location Search (Geocoding)
✅ Recommendation History
✅ User Feedback System
✅ Responsive Modern UI
✅ SPA Routing with React Router

## Testing the Production Deployment

### 1. Access the Frontend
Open your browser and navigate to:
```
https://dg6vtbn7r4das.cloudfront.net
```

### 2. Test the Application Flow
1. **Landing Page:** View the welcome screen
2. **Create Farm:** Click "Get Started" and create a new farm
3. **Add Field:** Add a field to your farm with crop and soil details
4. **Get Recommendation:** Generate an irrigation recommendation
5. **View History:** Check recommendation history
6. **Provide Feedback:** Submit feedback on recommendations

### 3. Test the API Directly
```bash
# Set API URL
export API_URL="https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com/prod"

# Create a farm
curl -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Test Farm","location":"California"}'

# List farms
curl "$API_URL/farms"
```

## Updating the Deployment

### Update Backend Only
```bash
cd backend
npm run build
cd ../infrastructure
cdk deploy
```

### Update Frontend Only
```bash
cd frontend
npm run build
cd ../infrastructure
cdk deploy
```

This will:
1. Upload new files to S3
2. Invalidate CloudFront cache
3. Make changes live immediately

### Update Both
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Deploy everything
cd ../infrastructure
cdk deploy
```

## Monitoring

### CloudWatch Logs
View Lambda function logs:
```bash
# Farms handler
aws logs tail /aws/lambda/RainlineMvpStack-FarmsHandler --follow

# Recommendations handler (includes Bedrock calls)
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

### CloudFront Metrics
Monitor CDN performance in AWS Console:
- CloudFront → Distributions → E3CNLTRSL37KMW → Monitoring

### API Gateway Metrics
Monitor API usage:
- API Gateway → Rainline MVP API → Dashboard

### DynamoDB Metrics
Monitor database performance:
- DynamoDB → Tables → Select table → Metrics

## Cost Estimation

### Production Usage (Moderate Traffic)
- **CloudFront:** ~$0.085 per GB + $0.01 per 10,000 requests
- **S3:** ~$0.023 per GB storage + $0.005 per 1,000 requests
- **Lambda:** Free tier covers 1M requests/month, then $0.20 per 1M
- **API Gateway:** Free tier covers 1M requests/month, then $3.50 per 1M
- **DynamoDB:** Pay-per-request, ~$1.25 per million writes, $0.25 per million reads
- **Bedrock:** ~$0.00025 per 1K input tokens, ~$0.00125 per 1K output tokens

**Estimated Monthly Cost (1,000 users, 10,000 recommendations):** $10-20

## Security Features

✅ HTTPS enforced on CloudFront
✅ S3 bucket not publicly accessible (CloudFront OAI only)
✅ CORS configured on API Gateway
✅ Lambda functions with least-privilege IAM roles
✅ DynamoDB encryption at rest (default)
✅ API Gateway request throttling enabled

## Performance Optimizations

✅ CloudFront CDN for global distribution
✅ Gzip compression enabled
✅ Browser caching configured
✅ Lambda cold start optimization
✅ DynamoDB on-demand billing (auto-scaling)
✅ Bedrock timeout handling with graceful degradation

## Troubleshooting

### Issue: CloudFront shows old content
**Solution:** Invalidate the cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E3CNLTRSL37KMW \
  --paths "/*"
```

### Issue: API returns 502/504 errors
**Solution:** Check Lambda logs for errors
```bash
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

### Issue: Bedrock access denied
**Solution:** Verify Bedrock model access in AWS Console
1. Go to Amazon Bedrock → Model access
2. Ensure Claude 3 Haiku is enabled

### Issue: CORS errors in browser
**Solution:** API Gateway CORS is configured for all origins. Check:
1. Browser console for actual error
2. Ensure API URL in frontend .env is correct
3. Verify preflight OPTIONS requests succeed

## Cleanup

To remove all resources and stop charges:
```bash
cd infrastructure
cdk destroy
```

This will delete:
- CloudFront distribution
- S3 bucket and all files
- All Lambda functions
- API Gateway
- All DynamoDB tables and data
- IAM roles

## Next Steps

### Recommended Enhancements
1. **Custom Domain:** Add Route 53 domain and SSL certificate
2. **Authentication:** Implement AWS Cognito for user management
3. **Monitoring:** Set up CloudWatch alarms for errors
4. **CI/CD:** Automate deployments with GitHub Actions
5. **WAF:** Add Web Application Firewall for security
6. **Backup:** Enable DynamoDB point-in-time recovery
7. **Multi-Region:** Deploy to multiple regions for HA

### Feature Roadmap
- User authentication and multi-tenancy
- Mobile app (React Native)
- Advanced analytics dashboard
- Integration with IoT sensors
- Automated irrigation control
- Weather alerts and notifications

## Support

For issues or questions:
1. Check CloudWatch logs for errors
2. Review AWS Console for resource status
3. Test API endpoints directly with curl
4. Verify frontend can reach backend API

## Deployment Information

- **Deployed:** January 2025
- **Stack Name:** RainlineMvpStack
- **Region:** us-east-1
- **Account:** 656721751462
- **CDK Version:** 2.x
- **Node Version:** 20.x

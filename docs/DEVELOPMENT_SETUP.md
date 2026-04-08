# Denar Development Setup Guide

## Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher) - for session management and caching
- **Expo CLI** - for mobile development
- **Android Studio** - for Android development
- **Xcode** - for iOS development (macOS only)

### Banking API Requirements
- TPP (Third Party Provider) registration with Macedonian banks
- PSD2 certificates (if using EU standard APIs)
- Bank-specific API credentials

## Project Structure

```
denar/
├── api/                    # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Utility functions
│   ├── logs/              # Application logs
│   ├── certs/             # Banking API certificates
│   └── uploads/           # File uploads
├── ui/                    # React Native mobile app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # App screens
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   └── assets/           # Static assets (images, fonts)
├── shared/               # Shared types and utilities
└── docs/                # Documentation
```

## Backend Setup (API)

### 1. Environment Configuration

```bash
cd api
cp .env.example .env
# Edit .env with your configuration
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Create PostgreSQL database
createdb denar_dev
createdb denar_test

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

### 3. Banking API Configuration

#### Macedonian Banks Integration

**Štedilnica Bank (Sparkasse):**
- API Documentation: Contact bank for TPP onboarding
- Required: QWAC and QSEAL certificates
- Endpoints: Account Information Service (AIS) and Payment Initiation Service (PIS)

**Komercijalna Banka:**
- API Type: Bank-specific APIs
- Required: OAuth 2.0 client credentials
- Contact: digital@kb.com.mk

**Stopanska Banka:**
- API Type: REST APIs with custom authentication
- Required: Bank partnership agreement
- Contact: api@stb.com.mk

### 4. Start Development Server

```bash
npm run dev
```

## Frontend Setup (Mobile App)

### 1. Install Dependencies

```bash
cd ui
npm install
```

### 2. Expo Setup

```bash
# Install Expo CLI globally if not already installed
npm install -g @expo/cli

# Start development server
npm start
```

### 3. Device Testing

```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Web (for development)
npm run web
```

## Open Banking Integration

### TPP Registration Process

1. **Choose Banks**: Start with major Macedonian banks
   - Stopanska Banka
   - Komercijalna Banka
   - Štedilnica Bank
   - NLB Bank
   - Silk Road Bank

2. **Prepare Documentation**:
   - Business registration certificate
   - Financial services license (if required)
   - Technical documentation
   - Security certificates
   - Compliance documentation

3. **API Access Levels**:
   - **Sandbox**: Testing environment
   - **Production**: Live environment with real data

### Certificate Requirements

For PSD2-compliant banks:
- **QWAC (Qualified Website Authentication Certificate)**: Website authentication
- **QSEAL (Qualified Electronic Seal)**: Digital signatures
- **eIDAS certificates**: EU regulatory compliance

### API Integration Steps

1. **Account Information Service (AIS)**:
   ```javascript
   // Get account information
   const accounts = await bankingApi.getAccounts(userId, consentId);
   ```

2. **Payment Initiation Service (PIS)**:
   ```javascript
   // Initiate payment
   const payment = await bankingApi.initiatePayment({
     from: fromAccount,
     to: toAccount,
     amount: amount,
     currency: 'MKD'
   });
   ```

## Common Issues and Solutions

### TPP Registration Problems

1. **Documentation Requirements**:
   - Ensure all legal documents are in Macedonian or English
   - Have translations certified if required
   - Include technical specifications document

2. **Compliance Issues**:
   - AML/KYC procedures must be documented
   - GDPR compliance documentation
   - Security audit reports

3. **Technical Requirements**:
   - Strong Customer Authentication (SCA) implementation
   - PCI DSS compliance for payment processing
   - ISO 27001 security standards

### Banking API Common Issues

1. **Certificate Problems**:
   ```bash
   # Verify certificate validity
   openssl x509 -in cert.pem -text -noout

   # Check certificate expiration
   openssl x509 -in cert.pem -enddate -noout
   ```

2. **Consent Management**:
   - Implement proper consent lifecycle
   - Handle consent expiration
   - Provide consent revocation

3. **Error Handling**:
   - Implement retry mechanisms
   - Log all API interactions
   - Handle rate limiting

## Testing

### API Testing
```bash
cd api
npm test
npm run test:watch
```

### Mobile App Testing
```bash
cd ui
npm test
```

### Integration Testing
- Use sandbox environments
- Test with mock banking APIs
- Simulate various transaction scenarios

## Deployment

### Environment Setup
- **Development**: Local development with mock APIs
- **Staging**: Testing with sandbox banking APIs
- **Production**: Live banking API integration

### Security Checklist
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] API endpoints secured with HTTPS
- [ ] Banking certificates properly managed
- [ ] Sensitive data encryption implemented
- [ ] Rate limiting configured
- [ ] Monitoring and logging setup

## Regulatory Compliance

### Macedonia Specific Requirements
- National Bank of Republic of Macedonia (NBRM) regulations
- Anti-Money Laundering (AML) compliance
- Know Your Customer (KYC) procedures
- Data protection laws

### EU Compliance (if expanding)
- PSD2 compliance
- GDPR data protection
- eIDAS electronic identification

## Support and Resources

### Banking API Support
- Each bank provides specific developer documentation
- Sandbox environments for testing
- Developer support contacts

### Development Resources
- [National Bank of Macedonia](https://www.nbrm.mk/)
- [EU PSD2 Guidelines](https://eba.europa.eu/regulation-and-policy/payment-services-and-electronic-money/guidelines-on-the-application-of-the-exemptions-to-the-contingency-measures-under-article-33-9-of-regulation-eu-2018-389-rts-on-sca-csc)
- [Open Banking Europe](https://www.openbankingeurope.eu/)

## Next Steps

1. Complete TPP registration with chosen banks
2. Obtain sandbox API access
3. Implement basic account linking
4. Test payment initiation flows
5. Implement production-ready security measures
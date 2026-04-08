# TPP Registration Guide for Macedonia

## Third Party Provider Registration for Open Banking

This guide covers the TPP (Third Party Provider) registration process with Macedonian banks to access their APIs for the Denar money transfer application.

## Overview

As a Third Party Provider, you need to register with each bank to access their Open Banking APIs. Macedonia is implementing EU PSD2 regulations, but each bank may have specific requirements.

## Major Macedonian Banks and API Access

### 1. Stopanska Banka AD Skopje
- **API Type**: Custom REST APIs + potential PSD2 compliance
- **Contact**: digital@stb.com.mk
- **Website**: https://www.stb.com.mk/
- **Required Documents**:
  - Company registration certificate
  - Technical documentation
  - Security compliance certificates
  - Developer agreement

**Status**: Contact for TPP onboarding process

### 2. Komercijalna Banka AD Skopje
- **API Type**: Custom banking APIs
- **Contact**: info@kb.com.mk
- **Website**: https://www.kb.com.mk/
- **Developer Portal**: Contact directly for access
- **Required**:
  - Partnership agreement
  - Technical integration documentation
  - Security audit

**Status**: Active API program for partnerships

### 3. NLB Banka AD Skopje
- **API Type**: Group-wide NLB APIs (European standards)
- **Contact**: info@nlb.com.mk
- **Website**: https://www.nlb.mk/
- **Parent Company**: NLB Group (Slovenia) - has PSD2 APIs
- **Advantage**: May leverage parent company's EU PSD2 infrastructure

**Status**: Contact for Macedonian implementation

### 4. Štedilnica Bank AD Skopje (Sparkasse)
- **API Type**: Erste Group banking APIs
- **Contact**: info@sparkasse.mk
- **Website**: https://www.sparkasse.mk/
- **Parent Company**: Erste Group - established PSD2 APIs
- **Advantage**: Access to Erste Group's proven API infrastructure

**Status**: Strong candidate - Erste Group has mature API platform

### 5. Silk Road Bank AD Skopje
- **API Type**: Custom APIs
- **Contact**: info@silkroadbank.com.mk
- **Website**: https://www.silkroadbank.com.mk/
- **Focus**: Digital innovation and fintech partnerships

**Status**: Emerging digital bank with partnership opportunities

## TPP Registration Process

### Step 1: Legal Preparation

**Required Documents:**
1. **Company Registration**: Current company registration certificate
2. **Business License**: Valid business operating license
3. **Financial Services Authorization**: If required by NBRM
4. **Insurance Documentation**: Professional liability insurance
5. **AML/KYC Procedures**: Documented compliance procedures
6. **Data Protection Policy**: GDPR compliance documentation

**Regulatory Requirements:**
- National Bank of Republic of Macedonia (NBRM) notification
- Compliance with Macedonian payment services law
- Anti-Money Laundering (AML) compliance
- Know Your Customer (KYC) procedures

### Step 2: Technical Documentation

**API Integration Plan:**
```
1. Account Information Service (AIS) Access
   - Read account balances
   - Retrieve transaction history
   - Account verification

2. Payment Initiation Service (PIS) Access
   - Initiate domestic transfers
   - Inter-bank transfers
   - Real-time payment confirmations

3. Confirmation of Funds Service (CoF)
   - Verify account balance for transactions
   - Pre-authorization checks
```

**Security Requirements:**
- **Certificates**: QWAC, QSEAL (for PSD2-compliant banks)
- **Encryption**: TLS 1.3, end-to-end encryption
- **Authentication**: OAuth 2.0, Strong Customer Authentication (SCA)
- **API Security**: Rate limiting, request signing

### Step 3: Sandbox Access

**Development Environment:**
1. Request sandbox API access
2. Implement basic integration
3. Test account linking flow
4. Test payment initiation
5. Validate error handling

**Testing Checklist:**
- [ ] Account authentication flow
- [ ] Account information retrieval
- [ ] Payment initiation
- [ ] Transaction status checking
- [ ] Error scenarios
- [ ] Security compliance

### Step 4: Production Certification

**Certification Requirements:**
1. **Security Audit**: Third-party security assessment
2. **Penetration Testing**: API security testing
3. **Compliance Review**: AML/KYC procedure validation
4. **Performance Testing**: Load and stress testing
5. **Documentation Review**: Technical and business documentation

## Common TPP Registration Problems and Solutions

### Problem 1: Missing Legal Documentation

**Issue**: Banks require extensive legal documentation that may not be immediately available.

**Solution**:
- Engage local legal counsel familiar with financial services
- Prepare documentation package in advance
- Include translations for international documents
- Ensure NBRM compliance documentation

### Problem 2: Technical Requirements Unclear

**Issue**: Each bank has different technical requirements and documentation.

**Solution**:
- Request detailed technical specifications
- Join bank developer programs if available
- Use established API standards (PSD2, Open Banking)
- Implement comprehensive error logging

### Problem 3: Sandbox Environment Access

**Issue**: Limited or delayed access to sandbox environments.

**Solution**:
- Apply for sandbox access early in the process
- Demonstrate serious business intent
- Provide detailed use cases
- Show technical capability

### Problem 4: Certification Delays

**Issue**: Production certification can take months.

**Solution**:
- Start certification process early
- Engage third-party security auditors
- Prepare comprehensive documentation
- Maintain regular communication with bank teams

## Specific Bank Guidance

### For Štedilnica Bank (Sparkasse):
- **Advantage**: Erste Group has mature PSD2 APIs
- **Process**: Contact directly for Macedonian implementation
- **Timeline**: 2-4 months typical implementation
- **Best Practice**: Reference Erste Group API documentation

### For NLB Banka:
- **Advantage**: NLB Group experience with EU APIs
- **Process**: May leverage parent company infrastructure
- **Timeline**: 3-6 months depending on local implementation
- **Best Practice**: Coordinate with NLB Group API team

### For Komercijalna Banka:
- **Advantage**: Active partnership program
- **Process**: Direct partnership approach
- **Timeline**: 2-3 months for established partnerships
- **Best Practice**: Focus on mutual business benefits

## Alternative Approaches

### 1. Payment Service Providers (PSPs)
If direct bank APIs are challenging, consider partnering with established PSPs:
- **Advantages**: Faster integration, established relationships
- **Disadvantages**: Higher fees, less control
- **Examples**: Local payment processors with bank relationships

### 2. Aggregation Services
Third-party services that aggregate multiple bank APIs:
- **Advantages**: Single integration point
- **Disadvantages**: Additional fees, dependency risk
- **Considerations**: Ensure regulatory compliance

### 3. Phased Approach
Start with one or two banks and expand:
- **Benefits**: Reduce complexity, prove concept
- **Strategy**: Choose banks with best API support
- **Timeline**: 6-12 months for full implementation

## Cost Estimates

### Direct Costs
- **Legal Compliance**: $10,000 - $25,000
- **Security Audits**: $15,000 - $30,000
- **Certificates**: $2,000 - $5,000 per bank
- **Integration Development**: $20,000 - $50,000

### Ongoing Costs
- **API Usage Fees**: Variable per bank
- **Compliance Monitoring**: $2,000 - $5,000/month
- **Certificate Renewal**: $1,000 - $2,000/year
- **Support and Maintenance**: $5,000 - $10,000/month

## Timeline Expectations

### Optimistic Timeline (6 months)
- Month 1-2: Documentation and legal preparation
- Month 3-4: Sandbox implementation and testing
- Month 5-6: Production certification and launch

### Realistic Timeline (12 months)
- Month 1-3: Legal preparation and bank negotiations
- Month 4-8: Technical implementation and testing
- Month 9-12: Certification, compliance, and production launch

### Conservative Timeline (18 months)
- Allows for regulatory challenges and bank-specific requirements
- Includes time for multiple certification rounds
- Accounts for potential delays in bank approval processes

## Next Steps

1. **Immediate Actions**:
   - Contact legal counsel for regulatory compliance
   - Reach out to banks for TPP registration information
   - Prepare company documentation package

2. **Short-term (1-2 months)**:
   - Submit TPP applications to target banks
   - Begin technical documentation preparation
   - Engage security audit firms

3. **Medium-term (3-6 months)**:
   - Complete sandbox integrations
   - Conduct security testing
   - Prepare for production certification

## Support Resources

### Regulatory
- **NBRM**: https://www.nbrm.mk/ (National Bank of Republic of Macedonia)
- **EU PSD2 Guidelines**: European Banking Authority documentation

### Technical
- **Bank Developer Portals**: Contact individual banks
- **API Standards**: Open Banking Europe, Berlin Group
- **Security Standards**: OWASP API Security, PCI DSS

### Legal
- **Local Law Firms**: Specializing in financial services
- **Compliance Consultants**: AML/KYC specialists
- **Data Protection**: GDPR compliance experts
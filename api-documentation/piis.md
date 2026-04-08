openapi: 3.0.1
info:
title: Confirmation of Funds (PIIS)
version: 1.2.0_2025-03-04
description: | # Overview

    ### Confirmation of Funds (CoF)

    Confirmation of Funds (CoF) is a specific service where a Third-Party Provider (TPP), such as a Payment Initiation Service Provider (PISP) or Account Information Service Provider (AISP), requests confirmation from the Account Servicing Payment Service Provider (ASPSP, e.g., a bank) about whether sufficient funds are available in a specified account to cover a payment transaction.
    The confirmation provided is binary (True/False) and does not disclose the account balance or any other sensitive details.
    This service is used to ensure that a payment or a series of payments can be covered by the funds available in the payer's account.

    **Reference**: This specification is based on NextGenPSD2 v1.3.13.


    Example flow for successfully getting the confirmation of funds:
      ```mermaid
        sequenceDiagram
          actor PSU
          participant TPP
          participant XS2A_API
          participant IAM
          PSU->>TPP: 1. Check Available Balance <br> "account","instructedAmount"
          activate PSU
          activate TPP
          TPP->>XS2A_API: 2. Create CoF Consent <br>POST /v1/consents/confirmation-of-funds <br> "account"
          activate XS2A_API
          Note over XS2A_API: consentStatus:"received"
          XS2A_API-->>TPP: 3. Consent Received <br> "consentId","consentStatus", "_links":["startAuthorisation"]
          deactivate XS2A_API
          TPP->>XS2A_API: 4. Start Authorization <br> POST /v1/consents/confirmation-of-funds/{consentId}/authorisations
           activate XS2A_API
          Note over XS2A_API: scaStatus:"received"
          XS2A_API-->>TPP: 5. Authorization Received <br> "authorisationId", "_links":["confirmation","scaOauth"]
          deactivate XS2A_API
          TPP-->>PSU: 6. Redirect to scaOAuth link
          deactivate TPP
          PSU->>IAM: 7. PSU Authorization
          activate IAM
          Note over PSU,IAM: OAuth 2.0 SCA
          Note over IAM: scaStatus: "psuAuthenticated"
          IAM-->>PSU: 8. Redirect to Redirect-URI
          deactivate IAM
          PSU->>TPP: 9. Redirect to Redirect-URI
          activate TPP
          TPP->>XS2A_API: 10. Update Authorization <br> PUT v1/consents/confirmation-of-funds/{consentId}/authorisations/{authorisation-id} <br> "confirmationCode"
          activate XS2A_API
          Note over XS2A_API: consentStatus:"valid"
          Note over XS2A_API: scaStatus: "finalised"
          XS2A_API-->>TPP: 11. Consent Approved <br> Return scaStatus:"finalised"
          deactivate XS2A_API
          TPP->>XS2A_API: 12. Confirmation of funds request <br> POST /v1/funds-confirmations
          activate XS2A_API
          XS2A_API-->>TPP: 13. Return fundsAvailable: "true"
          deactivate XS2A_API
          TPP-->>PSU: 14. Funds are available
          deactivate TPP
          deactivate PSU
      ```



    # Version history

    ## 📝 Documentation

    ### January 16, 2025 - PSU-ID-Type
    - Added details of the supported values to the PSU-ID-Type header.

    ### March 04, 2025 - confirmationCode, header adjustments
    - *scaAuthenticationData* renamed to ***confirmationCode*** in the request body of the *Update data on the authorisation resource* endpoint.
    It is still possible to use *scaAuthenticationData* for backward compatibility.
    - Added `Date` as mandatory header for all PIS requests
    - Made `Digest`, `Signature` and `TPP-Signature-Certificate` mandatory headers
    - Adjusted the error responses schema - made `tppMessages.text` mandatory


license:
name: Creative Commons Attribution 4.0 International Public License
url: https://creativecommons.org/licenses/by/4.0/
contact:
name: The Berlin Group - A European Standards Initiative
url: https://www.berlin-group.org/
email: info@berlin-group.org
servers:

- url: https://host-sandbox
  description: Sandbox server
  security:
- {}
  tags:
- name: Confirmation of Funds (PIIS)
  description: |
  The Confirmation of Funds (CoF) API (as defined in PSD2) is used by third-party payment service providers to retrieve information about the availability of funds in the PSU's account.
  Confirmation on the availability of funds can only be retrieved when authorized by an PSD2 client through SCA.
  externalDocs:
  description: |
  Full Documentation of NextGenPSD2 Access to Account Interoperability
  Framework
  (General Introduction Paper, Operational Rules, Implementation Guidelines)
  url: https://www.berlin-group.org/nextgenpsd2-downloads
  paths:
  /v1/consents/confirmation-of-funds:
  post:
  summary: Create consent for Confirmation of Funds
  description: |
  This method creates a CoF consent resource at the ASPSP which will allow the TPPs access to confirm whether sufficient funds are available for a specific account, as specified in the request.
  operationId: createConsentConfirmationOfFund
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)' \
   --data '{
  "account": {
  "**preferredAccIdentifierKey**": "**preferredAccIdentifierValue**"
  }
  tags: - Confirmation of Funds (PIIS)
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-ID' - $ref: '#/components/parameters/PSU-ID-Type' - $ref: '#/components/parameters/PSU-Corporate-ID' - $ref: '#/components/parameters/PSU-Corporate-ID-Type' - $ref: '#/components/parameters/TPP-Redirect-Preferred' - $ref: '#/components/parameters/TPP-Redirect-URI' - $ref: '#/components/parameters/TPP-Nok-Redirect-URI' - $ref: '#/components/parameters/TPP-Explicit-Authorisation-Preferred' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  requestBody:
  $ref: '#/components/requestBodies/consentsConfirmationOfFunds'
  responses:
  '201':
  $ref: '#/components/responses/CREATED_201_ConsentsConfirmationOfFunds'
  '400':
  $ref: '#/components/responses/BAD_REQUEST_400_AIS'
  '401':
  $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
  '403':
  $ref: '#/components/responses/FORBIDDEN_403_AIS'
  '404':
  $ref: '#/components/responses/NOT_FOUND_404_AIS'
  '405':
  $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
  '406':
  $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
  '408':
  $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
  '409':
  $ref: '#/components/responses/CONFLICT_409_AIS'
  '415':
  $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
  '429':
  $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
  '500':
  $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
  '503':
  $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'
  /v1/consents/confirmation-of-funds/{consentId}/authorisation:
  post:
  summary: Create an authorisation sub-resource
  description: |
  Create an authorisation sub-resource and start the authorisation process, might in addition transmit authentication and authorisation related data.

          The ASPSP might make the usage of this access method unnecessary, since the related authorisation resource will be automatically created by the ASPSP after the submission of the consent data with the first POST consents call.
        operationId: createAuthorisationConfirmationOfFunds
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)/authorisations' \
              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Content-Type: application/json' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --header 'TPP-Redirect-Preferred: true' \
              --cert    '(INSERT CERTIFICATE.crt HERE)' \
              --key     '(INSERT CERTIFICATE.key HERE)'
        tags:
          - Confirmation of Funds (PIIS)
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/consentId_PATH'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-ID'
          - $ref: '#/components/parameters/PSU-ID-Type'
          - $ref: '#/components/parameters/PSU-Corporate-ID'
          - $ref: '#/components/parameters/PSU-Corporate-ID-Type'
          - $ref: '#/components/parameters/TPP-Redirect-Preferred'
          - $ref: '#/components/parameters/TPP-Decoupled-Preferred'
          - $ref: '#/components/parameters/TPP-Redirect-URI'
          - $ref: '#/components/parameters/TPP-Nok-Redirect-URI'
          - $ref: '#/components/parameters/TPP-Explicit-Authorisation-Preferred'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
        responses:
          '201':
            $ref: '#/components/responses/CREATED_201_ConsentsConfirmationAuthorisationStart'
          '400':
            $ref: '#/components/responses/BAD_REQUEST_400_AIS'
          '401':
            $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
          '403':
            $ref: '#/components/responses/FORBIDDEN_403_AIS'
          '404':
            $ref: '#/components/responses/NOT_FOUND_404_AIS'
          '405':
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
          '406':
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
          '408':
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
          '409':
            $ref: '#/components/responses/CONFLICT_409_AIS'
          '415':
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
          '429':
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
          '500':
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
          '503':
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'

  /v1/consents/confirmation-of-funds/{consentId}/authorisations/{authorisationId}:
  put:
  summary: Update data on the authorisation resource
  description: |
  Update data on the authorisation resource if needed.
  It may authorise a consent within the Embedded SCA Approach where needed.

          Independently from the SCA Approach it supports e.g. the selection of the authentication method and a non-SCA PSU authentication.
        operationId: updateConfirmationOfFundsConsentsPsuData
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location --request PUT '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)/authorisations/(REPLACE AUTHENTICATIONID HERE)' \
              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Content-Type: application/json' \
              --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --cert    (INSERT CERTIFICATE.crt HERE) \
              --key     (INSERT CERTIFICATE.key HERE) \
              --data '{
                "confirmationCode": "(REPLACE GENERATED TOKEN HERE)"
              }'
        tags:
          - Confirmation of Funds (PIIS)
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/consentId_PATH'
          - $ref: '#/components/parameters/authorisationId'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-ID'
          - $ref: '#/components/parameters/PSU-ID-Type'
          - $ref: '#/components/parameters/PSU-Corporate-ID'
          - $ref: '#/components/parameters/PSU-Corporate-ID-Type'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID_optional'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        requestBody:
          content:
            application/json:
              schema:
                oneOf:
                  - {}
                  - $ref: '#/components/schemas/updatePsuAuthentication'
                  - $ref: '#/components/schemas/selectPsuAuthenticationMethod'
                  - $ref: '#/components/schemas/transactionAuthorisation'
                  - $ref: '#/components/schemas/authorisationConfirmation'
              examples:
                Authorisation confirmation (Redirect Approach):
                  $ref: '#/components/examples/authorisationConfirmationExample_Redirect'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_UpdateConfirmationOfFundsConsentPsuData'
          '400':
            $ref: '#/components/responses/BAD_REQUEST_400_AIS'
          '401':
            $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
          '403':
            $ref: '#/components/responses/FORBIDDEN_403_AIS'
          '404':
            $ref: '#/components/responses/NOT_FOUND_404_AIS'
          '405':
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
          '406':
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
          '408':
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
          '409':
            $ref: '#/components/responses/CONFLICT_409_AIS'
          '415':
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
          '429':
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
          '500':
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
          '503':
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'
      get:
        summary: Read the SCA status of the authorisation
        description: |
          This method returns the SCA status of a consent initiation's authorisation sub-resource.
        operationId: getConfirmationOfFundsScaStatus
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)/authorisations/(REPLACE AUTHENTICATIONID HERE)' \
              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Content-Type: application/json' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --cert    '(INSERT CERTIFICATE.crt HERE)' \
              --key     '(INSERT CERTIFICATE.key HERE)'
        tags:
          - Confirmation of Funds (PIIS)
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/consentId_PATH'
          - $ref: '#/components/parameters/authorisationId'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-ID'
          - $ref: '#/components/parameters/PSU-ID-Type'
          - $ref: '#/components/parameters/PSU-Corporate-ID'
          - $ref: '#/components/parameters/PSU-Corporate-ID-Type'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID_optional'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_ScaStatus'
          '400':
            $ref: '#/components/responses/BAD_REQUEST_400_AIS'
          '401':
            $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
          '403':
            $ref: '#/components/responses/FORBIDDEN_403_AIS'
          '404':
            $ref: '#/components/responses/NOT_FOUND_404_AIS'
          '405':
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
          '406':
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
          '408':
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
          '409':
            $ref: '#/components/responses/CONFLICT_409_AIS'
          '415':
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
          '429':
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
          '500':
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
          '503':
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'

  /v1/funds-confirmations:
  post:
  summary: Confirmation of funds request
  description: |-
  Creates a confirmation of funds request at the ASPSP. Checks whether a
  specific amount is available at point of time of the request on an account
  linked to a given IBAN and TPP respectively.

          If the related extended services are used a conditional Consent-ID is
          contained in the header. This field is contained but commented out in this
          specification.
        operationId: checkAvailabilityOfFunds
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)/authorisations/(REPLACE AUTHENTICATIONID HERE)' \
              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Content-Type: application/json' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --cert    '(INSERT CERTIFICATE.crt HERE)' \
              --key     '(INSERT CERTIFICATE.key HERE)' \
              --data '{
                "account": {
                    "__preferredAccIdentifierKey__": "__preferredAccIdentifierValue__"
                },
                "instructedAmount": {
                  "currency": "__currency__" ,
                  "amount": "123"
              }
        tags:
          - Confirmation of Funds (PIIS)
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
        requestBody:
          $ref: '#/components/requestBodies/confirmationOfFunds'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_ConfirmationOfFunds'
          '400':
            $ref: '#/components/responses/BAD_REQUEST_400_PIIS'
          '401':
            $ref: '#/components/responses/UNAUTHORIZED_401_PIIS'
          '403':
            $ref: '#/components/responses/FORBIDDEN_403_PIIS'
          '404':
            $ref: '#/components/responses/NOT_FOUND_404_PIIS'
          '405':
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIIS'
          '406':
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIIS'
          '408':
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIIS'
          '409':
            $ref: '#/components/responses/CONFLICT_409_PIIS'
          '415':
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIIS'
          '429':
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIIS'
          '500':
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIIS'
          '503':
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIIS'

  /v1/consents/confirmation-of-funds/{consentId}/status:
  get:
  summary: Get Consent Status
  description: |
  Can check the status of an account information consent resource.
  operationId: getConsentConfirmationOfFundsStatus
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)/status' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)'
  tags: - Confirmation of Funds (PIIS)
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_ConsentConfirmationOfFundsStatus'
  '400':
  $ref: '#/components/responses/BAD_REQUEST_400_AIS'
  '401':
  $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
  '403':
  $ref: '#/components/responses/FORBIDDEN_403_AIS'
  '404':
  $ref: '#/components/responses/NOT_FOUND_404_AIS'
  '405':
  $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
  '406':
  $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
  '408':
  $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
  '409':
  $ref: '#/components/responses/CONFLICT_409_AIS'
  '415':
  $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
  '429':
  $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
  '500':
  $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
  '503':
  $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'
  /v1/consents/confirmation-of-funds/{consentId}:
  get:
  summary: Get Consent Content
  description: |
  Returns the content of an account information consent object.
  This is returning the data for the TPP especially in cases, where the consent was directly managed between
  ASPSP and PSU e.g. in a redirect SCA Approach.
  operationId: getConsentConfirmationOfFunds
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)'
  tags: - Confirmation of Funds (PIIS)
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_ConsentConfirmationOfFundsContent'
  '400':
  $ref: '#/components/responses/BAD_REQUEST_400_AIS'
  '401':
  $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
  '403':
  $ref: '#/components/responses/FORBIDDEN_403_AIS'
  '404':
  $ref: '#/components/responses/NOT_FOUND_404_AIS'
  '405':
  $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
  '406':
  $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
  '408':
  $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
  '409':
  $ref: '#/components/responses/CONFLICT_409_AIS'
  '415':
  $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
  '429':
  $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
  '500':
  $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
  '503':
  $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'
  delete:
  summary: Delete Consent Content
  description: |
  Deletes a given consent.
  operationId: deleteConsentConfirmationOfFunds
  x-codeSamples: - lang: cURL
  source: |
  curl --location --request DELETE '(REPLACE BASEURL HERE)/v1/consents/confirmation-of-funds/(REPLACE CONSENTID HERE)' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)'
  tags: - Confirmation of Funds (PIIS)
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '204':
  $ref: '#/components/responses/OK_204_ConsentConfirmationOfFundsDelete'
  '400':
  $ref: '#/components/responses/BAD_REQUEST_400_AIS'
  '401':
  $ref: '#/components/responses/UNAUTHORIZED_401_AIS'
  '403':
  $ref: '#/components/responses/FORBIDDEN_403_AIS'
  '404':
  $ref: '#/components/responses/NOT_FOUND_404_AIS'
  '405':
  $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_AIS'
  '406':
  $ref: '#/components/responses/NOT_ACCEPTABLE_406_AIS'
  '408':
  $ref: '#/components/responses/REQUEST_TIMEOUT_408_AIS'
  '409':
  $ref: '#/components/responses/CONFLICT_409_AIS'
  '415':
  $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_AIS'
  '429':
  $ref: '#/components/responses/TOO_MANY_REQUESTS_429_AIS'
  '500':
  $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_AIS'
  '503':
  $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_AIS'
  components:
  securitySchemes:
  BearerAuthOAuth:
  description: |
  Bearer Token.
  Is contained only, if an OAuth2 based authentication was performed in a
  pre-step or
  an OAuth2 based SCA was performed in a preceding AIS service in the same
  session.
  type: http
  scheme: bearer
  parameters:
  X-Request-ID:
  name: X-Request-ID
  in: header
  description: ID of the request, unique to the call, as determined by the initiating party.
  required: true
  example: 99391c7e-ad88-49ec-a2ad-99ddcb1f7721
  schema:
  type: string
  format: uuid
  Date:
  name: Date
  in: header
  description: Date and time when the request was made (RFC 7231).
  required: true
  example: Wed, 11 Sep 2024 12:34:56 GMT
  schema:
  type: string
  format: date-time
  Digest:
  name: Digest
  in: header
  description: |-
  Is contained if and only if the "Signature" element is contained in the header
  of the request.
  schema:
  type: string
  required: false
  example: SHA-256=hl1/Eps8BEQW58FJhDApwJXjGY4nr1ArGDHIT25vq6A=
  Signature:
  name: Signature
  in: header
  description: |
  A signature of the request by the TPP on application level. This might be mandated by ASPSP.
  schema:
  type: string
  required: false
  example: |
  keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=D-Trust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))"
  TPP-Signature-Certificate:
  name: TPP-Signature-Certificate
  in: header
  description: |
  The certificate used for signing the request, in base64 encoding.
  Must be contained if a signature is contained.
  schema:
  type: string
  format: byte
  required: false
  PSU-ID:
  name: PSU-ID
  in: header
  description: |
  Client ID of the PSU in the ASPSP client interface.

          The nature of the value of this header is defined in the PSU-ID-Type Header

          Might be mandated in the ASPSP's documentation. It might be contained even if an OAuth2 based authentication was performed in a pre-step or an OAuth2 based SCA was performed in an preceding AIS service in the same session.

          In this case the ASPSP might check whether PSU-ID and token match, according to ASPSP documentation.
        schema:
          type: string
        required: false
        example: PSU-1234
      PSU-ID-Type:
        name: PSU-ID-Type
        in: header
        description: |

          The PSU-ID-Type header is used to indicate the type of the PSU-ID being provided in the request.
          It is applicable in scenarios where the PSU-ID is provided as part of the request.
        schema:
          type: string
          enum:
            - username
            - phoneNumber
            - email
        required: false
      PSU-Corporate-ID:
        name: PSU-Corporate-ID
        in: header
        description: |
          Might be mandated in the ASPSP's documentation. Only used in a corporate
          context.
        schema:
          type: string
        required: false
      PSU-Corporate-ID-Type:
        name: PSU-Corporate-ID-Type
        in: header
        description: |
          Might be mandated in the ASPSP's documentation. Only used in a corporate
          context.
        schema:
          type: string
        required: false
      TPP-Redirect-Preferred:
        name: TPP-Redirect-Preferred
        in: header
        description: |
          If it equals "true", the TPP prefers a redirect SCA approach.
        schema:
          type: boolean
        required: false
      TPP-Redirect-URI:
        name: TPP-Redirect-URI
        in: header
        description: |
          URI of the TPP, where the transaction flow shall be redirected to after a Redirect.

          Mandated for the **Redirect SCA Approach**, specifically when TPP-Redirect-Preferred equals "true".
          It is recommended to always use this header field.


          *Remark for Future:*

          This field might be changed to mandatory in the next version of the
          specification.
        schema:
          type: string
          format: uri
        required: false
      TPP-Nok-Redirect-URI:
        name: TPP-Nok-Redirect-URI
        in: header
        description: |
          If this URI is contained, the TPP is asking to redirect the transaction flow
          to this address instead of the TPP-Redirect-URI in case of a negative result of the redirect SCA method. This might be ignored by the ASPSP.
        schema:
          type: string
          format: uri
        required: false
      TPP-Explicit-Authorisation-Preferred:
        name: TPP-Explicit-Authorisation-Preferred
        in: header
        description: |
          If it equals "true", the TPP prefers to start the authorisation process
          separately,

          This preference might be ignored by the ASPSP.

          If it equals "false" or if the parameter is not used, there is no preference
          of the TPP.

          This especially indicates that the TPP assumes a direct authorisation of the
          transaction in the next step.
        schema:
          type: boolean
        required: false
      PSU-IP-Address_conditionalForAis:
        name: PSU-IP-Address
        in: header
        description: |
          The forwarded IP Address header field consists of the corresponding HTTP
          request

          IP Address field between PSU and TPP.

          It shall be contained if and only if this request was actively initiated by
          the PSU.
        schema:
          type: string
          format: ipv4
        required: false
        example: 192.168.8.78
      PSU-IP-Port:
        name: PSU-IP-Port
        in: header
        description: |
          The forwarded IP Port header field consists of the corresponding HTTP request
          IP Port field between PSU and TPP, if available.
        schema:
          type: string
        required: false
        example: '1234'
      PSU-Accept:
        name: PSU-Accept
        in: header
        description: |
          The forwarded IP Accept header fields consist of the corresponding HTTP
          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Charset:
        name: PSU-Accept-Charset
        in: header
        description: |
          The forwarded IP Accept header fields consist of the corresponding HTTP
          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Encoding:
        name: PSU-Accept-Encoding
        in: header
        description: |
          The forwarded IP Accept header fields consist of the corresponding HTTP
          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Language:
        name: PSU-Accept-Language
        in: header
        description: |
          The forwarded IP Accept header fields consist of the corresponding HTTP
          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-User-Agent:
        name: PSU-User-Agent
        in: header
        description: |
          The forwarded Agent header field of the HTTP request between PSU and TPP, if
          available.
        schema:
          type: string
        required: false
      PSU-Http-Method:
        name: PSU-Http-Method
        in: header
        description: |
          HTTP method used at the PSU ? TPP interface, if available.
          Valid values are:
          * GET
          * POST
          * PUT
          * PATCH
          * DELETE
        schema:
          type: string
          enum:
            - GET
            - POST
            - PUT
            - PATCH
            - DELETE
        required: false
      PSU-Device-ID:
        name: PSU-Device-ID
        in: header
        description: |
          UUID (Universally Unique Identifier) for a device, which is used by the PSU,
          if available.

          UUID identifies either a device or a device dependant application
          installation.

          In case of an installation identification this ID needs to be unaltered until
          removal from device.

          In case of a call without PSU's presence, the TPP shall use the value ***no-psu-involved***.
        schema:
          type: string
          format: uuid
        required: false
        example: 99435c7e-ad88-49ec-a2ad-99ddcb1f5555
      PSU-Device-Name:
        name: PSU-Device-Name
        in: header
        description: |
          Generic name/model of the device from which the PSU connects.
          In case of a call without PSU's presence, the TPP shall use the value ***no-psu-involved***.
        schema:
          type: string
        required: false
        example: Samsung A32
      PSU-Geo-Location:
        name: PSU-Geo-Location
        in: header
        description: |
          The forwarded Geo Location of the corresponding http request between PSU and
          TPP if available.
        schema:
          type: string
          pattern: GEO:-?[0-9]{1,2}\.[0-9]{6};-?[0-9]{1,3}\.[0-9]{6}
        required: false
        example: GEO:52.506931;13.144558
      consentId_PATH:
        name: consentId
        in: path
        description: |
          ID of the corresponding consent object as returned by an account information
          consent request.
        required: true
        schema:
          $ref: '#/components/schemas/consentId'
      TPP-Decoupled-Preferred:
        name: TPP-Decoupled-Preferred
        in: header
        description: |
          If it equals "true", the TPP prefers a decoupled SCA approach.
        schema:
          type: boolean
        required: false
      authorisationId:
        name: authorisationId
        in: path
        description: Resource identification of the related SCA.
        required: true
        schema:
          $ref: '#/components/schemas/authorisationId'
      PSU-Device-ID_optional:
        name: PSU-Device-ID
        in: header
        description: |
          UUID (Universally Unique Identifier) for a device, which is used by the PSU,
          if available.

          UUID identifies either a device or a device dependant application
          installation.

          In case of an installation identification this ID needs to be unaltered until
          removal from device.
        schema:
          type: string
          format: uuid
        required: false
        example: 99435c7e-ad88-49ec-a2ad-99ddcb1f5555

  schemas:
  iban:
  type: string
  description: IBAN of an account.
  pattern: '[A-Z]{2,2}[0-9]{2,2}[a-zA-Z0-9]{1,30}'
  example: FR7612345987650123456789014
  bban:
  description: |
  Basic Bank Account Number (BBAN) Identifier.

          This data element can be used in the body of the consent request.
            Message for retrieving account access consent from this account. This
            data elements is used for payment accounts which have no IBAN.
            ISO20022: Basic Bank Account Number (BBAN).

            Identifier used nationally by financial institutions, i.e., in individual countries,
            generally as part of a National Account Numbering Scheme(s),
            which uniquely identifies the account of a customer.
        type: string
        pattern: '[a-zA-Z0-9]{1,30}'
        example: BARC12345612345678
      msisdn:
        type: string
        maxLength: 35
        description: Mobile phone number.
        example: +49 170 1234567
      otherType:
        description: |-
          In cases where the specifically defined criteria (IBAN, BBAN, MSISDN) are not
          provided to identify an instance of the respective account type (e.g. a
          savings account), the ASPSP shall include a proprietary ID of the respective
          account that uniquely identifies the account for this ASPSP.
        type: object
        required:
          - identification
        properties:
          identification:
            description: Proprietary identification of the account.
            type: string
            maxLength: 35
          schemeNameCode:
            description: An entry provided by an external ISO code list.
            type: string
            maxLength: 35
          schemeNameProprietary:
            description: A scheme name defined in a proprietary way.
            type: string
            maxLength: 35
          issuer:
            description: Issuer of the identification.
            type: string
            maxLength: 35
      currencyCode:
        description: |
          ISO 4217 Alpha 3 currency code.
        type: string
        pattern: '[A-Z]{3}'
        example: EUR
      cashAccountType:
        description: |
          ExternalCashAccountType1Code from ISO 20022.
        type: string
      accountReference:
        description: |
          Reference to an account by either
            * IBAN, of a payment accounts, or
            * BBAN, for payment accounts if there is no IBAN, or
            * an alias to access a payment account via a registered mobile phone number (MSISDN), or
            * a proprietary ID of the  respective account that uniquely identifies the account for this ASPSP.
        type: object
        properties:
          iban:
            $ref: '#/components/schemas/iban'
          bban:
            $ref: '#/components/schemas/bban'
          msisdn:
            $ref: '#/components/schemas/msisdn'
          other:
            $ref: '#/components/schemas/otherType'
          currency:
            $ref: '#/components/schemas/currencyCode'
          cashAccountType:
            $ref: '#/components/schemas/cashAccountType'
      confirmationOfFundsConsent:
        description: |
          JSON Request body for the "Confirmation of funds service".

          <table>
          <tr>
            <td>account</td>
            <td> Account Reference</td>
            <td>Mandatory</td>
            <td>PSU's account number.</td>
          </tr>
          </table>
        type: object
        required:
          - account
        properties:
          account:
            $ref: '#/components/schemas/accountReference'
      consentStatus:
        description: |
          This is the overall lifecycle status of the consent.


          Valid values are:
            - 'received': The consent data have been received and are technically correct.
              The data is not authorised yet.
            - 'rejected': The consent data have been rejected e.g. since no successful authorisation has taken place.
            - 'valid': The consent is accepted and valid for GET account data calls and others as specified in the consent object.
            - 'revokedByPsu': The consent has been revoked by the PSU towards the ASPSP.
            - 'expired': The consent expired.
            - 'terminatedByTpp': The corresponding TPP has terminated the consent by applying the DELETE method to the consent resource.
            - 'partiallyAuthorised': The consent is due to a multi-level authorisation, some but not all mandated authorisations have been performed yet.

          The ASPSP might add further codes. These codes then shall be contained in the
          ASPSP's documentation of the XS2A interface

          and has to be added to this API definition as well.
        type: string
        enum:
          - received
          - rejected
          - valid
          - revokedByPsu
          - expired
          - terminatedByTpp
          - partiallyAuthorised
      consentId:
        description: |
          ID of the corresponding consent object as returned by an account information
          consent request.
        type: string
      authenticationType:
        description: |
          Type of the authentication method.


          More authentication types might be added during implementation projects and
          documented in the ASPSP documentation.

            - 'SMS_OTP': An SCA method, where an OTP linked to the transaction to be authorised is sent to the PSU through a SMS channel.
            - 'CHIP_OTP': An SCA method, where an OTP is generated by a chip card, e.g. a TOP derived from an EMV cryptogram.
              To contact the card, the PSU normally needs a (handheld) device.
              With this device, the PSU either reads the challenging data through a visual interface like flickering or
              the PSU types in the challenge through the device key pad.
              The device then derives an OTP from the challenge data and displays the OTP to the PSU.
            - 'PHOTO_OTP': An SCA method, where the challenge is a QR code or similar encoded visual data
              which can be read in by a consumer device or specific mobile app.
              The device resp. the specific app than derives an OTP from the visual challenge data and displays
              the OTP to the PSU.
            - 'PUSH_OTP': An OTP is pushed to a dedicated authentication APP and displayed to the PSU.
            - 'SMTP_OTP': An OTP is sent via email to the PSU.
        type: string
        enum:
          - SMS_OTP
          - CHIP_OTP
          - PHOTO_OTP
          - PUSH_OTP
          - SMTP_OTP
      authenticationMethodId:
        description: |
          An identification provided by the ASPSP for the later identification of the
          authentication method selection.
        type: string
        maxLength: 35
        example: myAuthenticationID
      authenticationObject:
        description: |
          Authentication object.
        type: object
        required:
          - authenticationType
          - authenticationMethodId
        properties:
          authenticationType:
            $ref: '#/components/schemas/authenticationType'
          authenticationVersion:
            description: |
              Depending on the "authenticationType".

              This version can be used by differentiating authentication tools used
              within performing OTP generation in the same authentication type.

              This version can be referred to in the ASPSP?s documentation.
            type: string
          authenticationMethodId:
            $ref: '#/components/schemas/authenticationMethodId'
          name:
            description: |
              This is the name of the authentication method defined by the PSU in the
              Online Banking frontend of the ASPSP.

              Alternatively this could be a description provided by the ASPSP like "SMS
              OTP on phone +49160 xxxxx 28".

              This name shall be used by the TPP when presenting a list of
              authentication methods to the PSU, if available.
            type: string
            example: SMS OTP on phone +49160 xxxxx 28
          explanation:
            description: |
              Detailed information about the SCA method for the PSU.
            type: string
            example: Detailed information about the SCA method for the PSU.
      scaMethods:
        description: |
          This data element might be contained, if SCA is required and if the PSU has a
          choice between different

          authentication methods.


          Depending on the risk management of the ASPSP this choice might be offered
          before or after the PSU

          has been identified with the first relevant factor, or if an access token is
          transported.


          If this data element is contained, then there is also a hyperlink of type
          'startAuthorisationWithAuthenticationMethodSelection'

          contained in the response body.


          These methods shall be presented towards the PSU for selection by the TPP.
        type: array
        items:
          $ref: '#/components/schemas/authenticationObject'
      challengeData:
        description: |
          It is contained in addition to the data element 'chosenScaMethod' if challenge
          data is needed for SCA.

          In rare cases this attribute is also used in the context of the
          'startAuthorisationWithPsuAuthentication' link.
        type: object
        properties:
          image:
            type: string
            format: byte
            description: |
              PNG data (max. 512 kilobyte) to be displayed to the PSU,
              Base64 encoding, cp. [RFC4648].
              This attribute is used only, when PHOTO_OTP or CHIP_OTP
              is the selected SCA method.
          data:
            type: array
            items:
              type: string
            description: A collection of strings as challenge data.
          imageLink:
            type: string
            format: url
            description: A link where the ASPSP will provides the challenge image for the TPP.
          otpMaxLength:
            type: integer
            description: The maximal length for the OTP to be typed in by the PSU.
          otpFormat:
            type: string
            description: |-
              The format type of the OTP to be typed in. The admitted values are
              "characters" or "integer".
            enum:
              - characters
              - integer
          additionalInformation:
            type: string
            description: |
              Additional explanation for the PSU to explain
              e.g. fallback mechanism for the chosen SCA method.
              The TPP is obliged to show this to the PSU.
      hrefEntry:
        description: Link to a resource.
        type: string
        example: /v1/payments/domestic-transfer/9629301ef15943b6b74499c9eb2071c5
      hrefType:
        description: Link to a resource.
        type: object
        properties:
          href:
            $ref: '#/components/schemas/hrefEntry'
      _linksConsents:
        description: |
          A list of hyperlinks to be recognised by the TPP.


          Type of links admitted in this response (which might be extended by single
          ASPSPs as indicated in its XS2A

          documentation):
            * 'scaRedirect':
              In case of an SCA Redirect Approach, the ASPSP is transmitting the link to which to redirect the
              PSU browser.
            * 'scaOAuth':
              In case of an OAuth2 based Redirect Approach, the ASPSP is transmitting the link where the configuration
              of the OAuth2 Server is defined.
              The configuration follows the OAuth 2.0 Authorisation Server Metadata specification.
          * 'confirmation':
            Might be added by the ASPSP if either the "scaRedirect" or "scaOAuth" hyperlink is returned
            in the same response message.
            This hyperlink defines the URL to the resource which needs to be updated with
              * a confirmation code as retrieved after the plain redirect authentication process with the ASPSP authentication server or
              * an access token as retrieved by submitting an authorization code after the integrated OAuth based authentication process with the ASPSP authentication server.
            * 'startAuthorisation':
              In case, where an explicit start of the transaction authorisation is needed,
              but no more data needs to be updated (no authentication method to be selected,
              no PSU identification nor PSU authentication data to be uploaded).
            * 'startAuthorisationWithPsuIdentification':
              The link to the authorisation end-point, where the authorisation sub-resource has to be generated
              while uploading the PSU identification data.
            * 'startAuthorisationWithPsuAuthentication':
              The link to the authorisation end-point, where the authorisation sub-resource has to be generated
              while uploading the PSU authentication data.
            * 'startAuthorisationWithEncryptedPsuAuthentication':
              Same as startAuthorisactionWithPsuAuthentication where the authentication data need to be encrypted on
              application layer in uploading.
            * 'startAuthorisationWithAuthenticationMethodSelection':
              The link to the authorisation end-point, where the authorisation sub-resource has to be generated
              while selecting the authentication method. This link is contained under exactly the same conditions
              as the data element 'scaMethods'
            * 'startAuthorisationWithTransactionAuthorisation':
              The link to the authorisation end-point, where the authorisation sub-resource has to be generated
              while authorising the transaction e.g. by uploading an OTP received by SMS.
            * 'self':
              The link to the Establish Account Information Consent resource created by this request.
              This link can be used to retrieve the resource data.
            * 'status':
              The link to retrieve the status of the account information consent.
            * 'scaStatus': The link to retrieve the scaStatus of the corresponding authorisation sub-resource.
              This link is only contained, if an authorisation sub-resource has been already created.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaRedirect:
            $ref: '#/components/schemas/hrefType'
          scaOAuth:
            $ref: '#/components/schemas/hrefType'
          confirmation:
            $ref: '#/components/schemas/hrefType'
          startAuthorisation:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithPsuIdentification:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithAuthenticationMethodSelection:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithTransactionAuthorisation:
            $ref: '#/components/schemas/hrefType'
          self:
            $ref: '#/components/schemas/hrefType'
          status:
            $ref: '#/components/schemas/hrefType'
          scaStatus:
            $ref: '#/components/schemas/hrefType'
      psuMessageText:
        description: Text to be displayed to the PSU.
        type: string
        maxLength: 500
      consentsResponse-201:
        description: Body of the JSON response for a successful consent request.
        type: object
        required:
          - consentStatus
          - consentId
          - _links
        properties:
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
          consentId:
            $ref: '#/components/schemas/consentId'
          scaMethods:
            $ref: '#/components/schemas/scaMethods'
          chosenScaMethod:
            $ref: '#/components/schemas/authenticationObject'
          challengeData:
            $ref: '#/components/schemas/challengeData'
          _links:
            $ref: '#/components/schemas/_linksConsents'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      tppMessageCategory:
        description: Category of the TPP message category.
        type: string
        enum:
          - ERROR
          - WARNING
      MessageCode2XX:
        description: Message codes for HTTP Error codes 2XX.
        type: string
        enum:
          - WARNING
      tppMessageText:
        description: Additional explaining text to the TPP.
        type: string
        maxLength: 500
      tppMessage2XX:
        type: object
        required:
          - category
          - code
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode2XX'
          path:
            type: string
          text:
            $ref: '#/components/schemas/tppMessageText'
      ConsentsConfirmationOfFundsMultilevelSCAResponse:
        description: Body of the JSON response for a Start Multilevel SCA authorisation request.
        type: object
        required:
          - consentStatus
          - consentId
          - _links
        properties:
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
          consentId:
            $ref: '#/components/schemas/consentId'
          _links:
            $ref: '#/components/schemas/_linksConsents'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage2XX'
      MessageCode400_AIS:
        description: Message codes defined for AIS for HTTP Error code 400 (BAD_REQUEST).
        type: string
        enum:
          - FORMAT_ERROR
          - PARAMETER_NOT_CONSISTENT
          - PARAMETER_NOT_SUPPORTED
          - SERVICE_INVALID
          - RESOURCE_UNKNOWN
          - RESOURCE_EXPIRED
          - RESOURCE_BLOCKED
          - TIMESTAMP_INVALID
          - PERIOD_INVALID
          - SCA_METHOD_UNKNOWN
          - SCA_INVALID
          - CONSENT_UNKNOWN
          - SESSIONS_NOT_SUPPORTED
      tppMessagePath:
        description: Exact error location
        type: string
      tppMessage400_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode400_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      _linksAll:
        description: |
          A _link object with all available link types.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaRedirect:
            $ref: '#/components/schemas/hrefType'
          scaOAuth:
            $ref: '#/components/schemas/hrefType'
          confirmation:
            $ref: '#/components/schemas/hrefType'
          startAuthorisation:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithPsuIdentification:
            $ref: '#/components/schemas/hrefType'
          updatePsuIdentification:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithProprietaryData:
            $ref: '#/components/schemas/hrefType'
          updateProprietaryData:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updatePsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateAdditionalPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateAdditionalEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithAuthenticationMethodSelection:
            $ref: '#/components/schemas/hrefType'
          selectAuthenticationMethod:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithTransactionAuthorisation:
            $ref: '#/components/schemas/hrefType'
          authoriseTransaction:
            $ref: '#/components/schemas/hrefType'
          self:
            $ref: '#/components/schemas/hrefType'
          status:
            $ref: '#/components/schemas/hrefType'
          scaStatus:
            $ref: '#/components/schemas/hrefType'
          account:
            $ref: '#/components/schemas/hrefType'
          balances:
            $ref: '#/components/schemas/hrefType'
          transactions:
            $ref: '#/components/schemas/hrefType'
          transactionDetails:
            $ref: '#/components/schemas/hrefType'
          first:
            $ref: '#/components/schemas/hrefType'
          next:
            $ref: '#/components/schemas/hrefType'
          previous:
            $ref: '#/components/schemas/hrefType'
          last:
            $ref: '#/components/schemas/hrefType'
          download:
            $ref: '#/components/schemas/hrefType'
      Error400_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 400.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage400_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppErrorTitle:
        description: |
          Short human readable description of error type.
          Could be in local language.
          To be provided by ASPSPs.
        type: string
        maxLength: 70
      tppErrorDetail:
        description: |
          Detailed human readable text specific to this instance of the error.

          XPath might be used to point to the issue generating the error in addition.

          Remark for Future: In future, a dedicated field might be introduced for the
          XPath.
        type: string
        maxLength: 500
      Error400_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 400 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode400_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode400_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode401_AIS:
        description: Message codes defined for AIS for HTTP Error code 401 (UNAUTHORIZED).
        type: string
        enum:
          - CERTIFICATE_INVALID
          - ROLE_INVALID
          - CERTIFICATE_EXPIRED
          - CERTIFICATE_BLOCKED
          - CERTIFICATE_REVOKE
          - CERTIFICATE_MISSING
          - SIGNATURE_INVALID
          - SIGNATURE_MISSING
          - CORPORATE_ID_INVALID
          - PSU_CREDENTIALS_INVALID
          - CONSENT_INVALID
          - CONSENT_EXPIRED
          - TOKEN_UNKNOWN
          - TOKEN_INVALID
          - TOKEN_EXPIRED
      tppMessage401_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode401_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error401_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage401_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error401_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 401 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode401_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode401_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode403_AIS:
        description: Message codes defined for AIS for HTTP Error code 403 (FORBIDDEN).
        type: string
        enum:
          - CONSENT_UNKNOWN
          - SERVICE_BLOCKED
          - RESOURCE_UNKNOWN
          - RESOURCE_EXPIRED
      tppMessage403_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode403_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error403_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 403.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage403_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error403_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 403 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode403_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode403_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode404_AIS:
        description: Message codes defined for AIS for HTTP Error code 404 (NOT FOUND).
        type: string
        enum:
          - RESOURCE_UNKNOWN
      tppMessage404_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode404_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error404_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 404.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage404_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error404_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 404 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode404_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode404_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode405_AIS:
        description: Message codes defined for AIS for HTTP Error code 405 (METHOD NOT ALLOWED).
        type: string
        enum:
          - SERVICE_INVALID
      tppMessage405_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode405_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error405_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage405_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error405_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 405 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode405_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode405_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode406_AIS:
        description: Message codes defined for AIS for HTTP Error code 406 (NOT ACCEPTABLE).
        type: string
        enum:
          - REQUESTED_FORMATS_INVALID
      tppMessage406_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode406_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error406_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 406.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage406_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error406_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 406 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode406_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode406_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode409_AIS:
        description: Message codes defined for AIS for HTTP Error code 409 (CONFLICT).
        type: string
        enum:
          - STATUS_INVALID
      tppMessage409_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode409_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error409_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 409.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage409_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
        example:
          - category: ERROR
            code: STATUS_INVALID
            text: additional text information of the ASPSP up to 500 characters
      Error409_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 409 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode409_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode409_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode429_AIS:
        description: Message codes for HTTP Error code 429 (TOO MANY REQUESTS).
        type: string
        enum:
          - ACCESS_EXCEEDED
      tppMessage429_AIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode429_AIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error429_NG_AIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 429.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage429_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
        example:
          - category: ERROR
            code: ACCESS_EXCEEDED
            text: additional text information of the ASPSP up to 500 characters
      Error429_AIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 429 for AIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode429_AIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807]

                in case of a HTTP error code 429 for.
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode429_AIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      scaStatus:
        description: |
          This data element is containing information about the status of the SCA method
          applied.


          The following codes are defined for this data type.

            * 'received':
              An authorisation or cancellation-authorisation resource has been created successfully.
            * 'psuIdentified':
              The PSU related to the authorisation or cancellation-authorisation resource has been identified.
            * 'psuAuthenticated':
              The PSU related to the authorisation or cancellation-authorisation resource has been identified and authenticated e.g. by a password or by an access token.
            * 'scaMethodSelected':
              The PSU/TPP has selected the related SCA routine.
              If the SCA method is chosen implicitly since only one SCA method is available,
              then this is the first status to be reported instead of 'received'.
            * 'unconfirmed':
              SCA is technically successfully finalised by the PSU, but the authorisation resource needs a confirmation command by the TPP yet.
            * 'started':
              The addressed SCA routine has been started.
            * 'finalised':
              The SCA routine has been finalised successfully (including a potential confirmation command).
              This is a final status of the authorisation resource.
            * 'failed':
              The SCA routine failed.
              This is a final status of the authorisation resource.
            * 'exempted':
              SCA was exempted for the related transaction, the related authorisation is successful.
              This is a final status of the authorisation resource.
        type: string
        enum:
          - received
          - psuIdentified
          - psuAuthenticated
          - scaMethodSelected
          - started
          - unconfirmed
          - finalised
          - failed
          - exempted
        example: psuAuthenticated
      authorisationId:
        description: Resource identification of the related SCA.
        type: string
        example: 123auth456
      _linksStartScaProcess:
        description: |
          A list of hyperlinks to be recognised by the TPP. The actual hyperlinks used
          in the

          response depend on the dynamical decisions of the ASPSP when processing the
          request.


          **Remark:** All links can be relative or full links, to be decided by the
          ASPSP.


          Type of links admitted in this response, (further links might be added for
          ASPSP defined

          extensions):


          - 'scaRedirect':
            In case of an SCA Redirect Approach, the ASPSP is transmitting the link to which to
            redirect the PSU browser.
          - 'scaOAuth':
            In case of a SCA OAuth2 Approach, the ASPSP is transmitting the URI where the configuration of the Authorisation Server can be retrieved. The configuration follows the OAuth 2.0 Authorisation Server Metadata specification.
          * 'confirmation':
            Might be added by the ASPSP if either the "scaRedirect" or "scaOAuth" hyperlink is returned
            in the same response message.
            This hyperlink defines the URL to the resource which needs to be updated with
              * a confirmation code as retrieved after the plain redirect authentication process with the ASPSP authentication server or
              * an access token as retrieved by submitting an authorization code after the integrated OAuth based authentication process with the ASPSP authentication server.
          - 'updatePsuIdentification':
            The link to the authorisation or cancellation authorisation sub-resource,
            where PSU identification data needs to be uploaded.
          - 'startAuthorisationWithPsuAuthentication':
            The link to the authorisation or cancellation authorisation sub-resource,
            where PSU authentication data needs to be uploaded.
          - 'startAuthorisationWithEncryptedPsuAuthentication':
              Same as startAuthorisactionWithPsuAuthentication where the authentication data need to be encrypted on
              application layer in uploading.
          - 'selectAuthenticationMethod':
            The link to the authorisation or cancellation authorisation sub-resource,
            where the selected authentication method needs to be uploaded.
            This link is contained under exactly the same conditions as the data element 'scaMethods'.
          - 'authoriseTransaction':
            The link to the authorisation or cancellation authorisation sub-resource,
            where the authorisation data has to be uploaded, e.g. the TOP received by SMS.
          - 'scaStatus':
            The link to retrieve the scaStatus of the corresponding authorisation sub-resource.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaRedirect:
            $ref: '#/components/schemas/hrefType'
          scaOAuth:
            $ref: '#/components/schemas/hrefType'
          confirmation:
            $ref: '#/components/schemas/hrefType'
          updatePsuIdentification:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          startAuthorisationWithEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          selectAuthenticationMethod:
            $ref: '#/components/schemas/hrefType'
          authoriseTransaction:
            $ref: '#/components/schemas/hrefType'
          scaStatus:
            $ref: '#/components/schemas/hrefType'
      ConsentsConfirmationOfFundsAuthorisationResponse:
        description: Body of the JSON response for a Start SCA authorisation request.
        type: object
        required:
          - scaStatus
          - authorisationId
          - _links
        properties:
          scaStatus:
            $ref: '#/components/schemas/scaStatus'
          authorisationId:
            $ref: '#/components/schemas/authorisationId'
          scaMethods:
            $ref: '#/components/schemas/scaMethods'
          chosenScaMethod:
            $ref: '#/components/schemas/authenticationObject'
          _links:
            $ref: '#/components/schemas/_linksStartScaProcess'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      tppMessageCodeGeneric:
        description: Code of the TPP message category.
        type: string
      tppMessageGeneric:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/tppMessageCodeGeneric'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      scaStatusResponse:
        description: Body of the JSON response with SCA Status.
        required:
          - scaStatus
        type: object
        properties:
          scaStatus:
            $ref: '#/components/schemas/scaStatus'
          psuName:
            description: |
              Name of the PSU. In case of a corporate account, this might be the person
              acting on behalf of the corporate.
            type: string
            maxLength: 140
          _links:
            $ref: '#/components/schemas/_linksAll'
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessageGeneric'
            description: Messages to the TPP on operational issues.
      psuData:
        description: PSU Data for Update PSU authentication.
        type: object
        minProperties: 1
        properties:
          password:
            description: Password.
            type: string
          encryptedPassword:
            description: Encrypted password.
            type: string
          additionalPassword:
            description: Additional password in plaintext.
            type: string
          additionalEncryptedPassword:
            description: Additional encrypted password.
            type: string
      updatePsuAuthentication:
        description: |
          Content of the body of a Update PSU authentication request

          Password subfield is used.
        type: object
        required:
          - psuData
        properties:
          psuData:
            $ref: '#/components/schemas/psuData'
      selectPsuAuthenticationMethod:
        description: |
          Content of the body of a Select PSU authentication method request
        type: object
        required:
          - authenticationMethodId
        properties:
          authenticationMethodId:
            $ref: '#/components/schemas/authenticationMethodId'
      confirmationCode:
        description: |
          SCA authentication data, depending on the chosen authentication method.
          If the data is binary, then it is base64 encoded.
        type: string
      transactionAuthorisation:
        description: |
          Content of the body of a transaction authorisation request
        type: object
        required:
          - confirmationCode
        properties:
          confirmationCode:
            $ref: '#/components/schemas/confirmationCode'
      authorisationConfirmation:
        description: |
          Content of the body of an authorisation confirmation request
        type: object
        required:
          - confirmationCode
        properties:
          confirmationCode:
            description: |-
              Confirmation code provided by the TPP to complete the redirect-based
              SCA process.

              In case of an OAuth2-based redirect approach, this field contains the
              access token (JWT or reference token) issued by the ASPSP's authorisation
              server after the PSU has successfully authenticated.

              This access token serves as proof of SCA completion and is used to
              confirm the authorisation sub-resource.
            type: string
      amountValue:
        description: |
          The amount given with fractional digits, where fractions must be compliant to
          the currency definition.

          Up to 14 significant figures. Negative amounts are signed by minus.

          The decimal separator is a dot.


          **Example:**

          Valid representations for EUR with up to two decimals are:

            * 1056
            * 5768.2
            * -1.50
            * 5877.78
        type: string
        pattern: '-?[0-9]{1,14}(\.[0-9]{1,3})?'
        example: '5877.78'
      amount:
        type: object
        required:
          - currency
          - amount
        properties:
          currency:
            $ref: '#/components/schemas/currencyCode'
          amount:
            $ref: '#/components/schemas/amountValue'
        example:
          currency: EUR
          amount: '123'
      _linksUpdatePsuIdentification:
        description: |
          A list of hyperlinks to be recognised by the TPP. The actual hyperlinks used
          in the response depend on the dynamical decisions of the ASPSP when processing
          the request.


          **Remark:** All links can be relative or full links, to be decided by the
          ASPSP.


          Type of links admitted in this response, (further links might be added for
          ASPSP

          defined extensions):


          - 'scaStatus': The link to retrieve the scaStatus of the corresponding
          authorisation sub-resource.

          - 'selectAuthenticationMethod': This is a link to a resource, where the TPP
          can select the applicable second factor authentication methods for the PSU, if
          there are several available authentication methods and if the PSU is already
          sufficiently authenticated.. If this link is contained, then there is also the
          data element "scaMethods" contained in the response body.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaStatus:
            $ref: '#/components/schemas/hrefType'
          selectAuthenticationMethod:
            $ref: '#/components/schemas/hrefType'
      updatePsuIdentificationResponse:
        description: Body of the JSON response for a successful update PSU identification request.
        type: object
        required:
          - _links
          - scaStatus
        properties:
          transactionFees:
            $ref: '#/components/schemas/amount'
          currencyConversionFees:
            $ref: '#/components/schemas/amount'
          estimatedTotalAmount:
            $ref: '#/components/schemas/amount'
          estimatedInterbankSettlementAmount:
            $ref: '#/components/schemas/amount'
          scaMethods:
            $ref: '#/components/schemas/scaMethods'
          _links:
            $ref: '#/components/schemas/_linksUpdatePsuIdentification'
          scaStatus:
            $ref: '#/components/schemas/scaStatus'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      _linksUpdatePsuAuthentication:
        description: |
          A list of hyperlinks to be recognised by the TPP. Might be contained, if
          several authentication methods

          are available for the PSU.

          Type of links admitted in this response:
            * 'updateAdditionalPsuAuthentication':
              The link to the payment initiation or account information resource,
              which needs to be updated by an additional PSU password.
              This link is only contained in rare cases,
              where such additional passwords are needed for PSU authentications.
            * 'updateAdditionalEncryptedPsuAuthentication':
              The link to the payment initiation or account information resource,
              which needs to be updated by an additional encrypted PSU password.
              This link is only contained in rare cases, where such additional passwords are needed for PSU authentications.
            * 'selectAuthenticationMethod':
              This is a link to a resource, where the TPP can select the applicable second factor authentication
              methods for the PSU, if there were several available authentication methods.
              This link is only contained, if the PSU is already identified or authenticated with the first relevant
              factor or alternatively an access token, if SCA is required and if the PSU has a choice between different
              authentication methods.
              If this link is contained, then there is also the data element 'scaMethods' contained in the response body.
            * 'authoriseTransaction':
              The link to the resource, where the "Transaction authorisation request" is sent to.
              This is the link to the resource which will authorise the transaction by checking the SCA authentication
              data within the Embedded SCA approach.
            * 'scaStatus':
              The link to retrieve the scaStatus of the corresponding authorisation sub-resource.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          updateAdditionalPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateAdditionalEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          selectAuthenticationMethod:
            $ref: '#/components/schemas/hrefType'
          authoriseTransaction:
            $ref: '#/components/schemas/hrefType'
          scaStatus:
            $ref: '#/components/schemas/hrefType'
      updatePsuAuthenticationResponse:
        description: Body of the JSON response for a successful update PSU authentication request.
        type: object
        required:
          - scaStatus
        properties:
          transactionFees:
            $ref: '#/components/schemas/amount'
          currencyConversionFees:
            $ref: '#/components/schemas/amount'
          estimatedTotalAmount:
            $ref: '#/components/schemas/amount'
          estimatedInterbankSettlementAmount:
            $ref: '#/components/schemas/amount'
          chosenScaMethod:
            $ref: '#/components/schemas/authenticationObject'
          challengeData:
            $ref: '#/components/schemas/challengeData'
          scaMethods:
            $ref: '#/components/schemas/scaMethods'
          _links:
            $ref: '#/components/schemas/_linksUpdatePsuAuthentication'
          scaStatus:
            $ref: '#/components/schemas/scaStatus'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
          authorisationId:
            $ref: '#/components/schemas/authorisationId'
      _linksSelectPsuAuthenticationMethod:
        description: |
          A list of hyperlinks to be recognised by the TPP. The actual hyperlinks used
          in

          the response depend on the dynamical decisions of the ASPSP when processing
          the request.


          **Remark:** All links can be relative or full links, to be decided by the
          ASPSP.


          **Remark:** This method can be applied before or after PSU identification.

          This leads to many possible hyperlink responses.

          Type of links admitted in this response, (further links might be added for
          ASPSP defined

          extensions):


          - 'scaRedirect':
            In case of an SCA Redirect Approach, the ASPSP is transmitting the link to which to
            redirect the PSU browser.
          - 'scaOAuth':
            In case of a SCA OAuth2 Approach, the ASPSP is transmitting the URI where the
            configuration of the Authorisation Server can be retrieved.
            The configuration follows the OAuth 2.0 Authorisation Server Metadata specification.
          * 'confirmation':
            Might be added by the ASPSP if either the "scaRedirect" or "scaOAuth" hyperlink is returned
            in the same response message.
            This hyperlink defines the URL to the resource which needs to be updated with
              * a confirmation code as retrieved after the plain redirect authentication process with the ASPSP authentication server or
              * an access token as retrieved by submitting an authorization code after the integrated OAuth based authentication process with the ASPSP authentication server.
          - 'updatePsuIdentification':
            The link to the authorisation or cancellation authorisation sub-resource,
            where PSU identification data needs to be uploaded.
          - 'updatePsuAuthentication':
            The link to the authorisation or cancellation authorisation sub-resource,
            where PSU authentication data needs to be uploaded.
            - 'updateEncryptedPsuAuthentication':
            The link to the authorisation or cancellation authorisation sub-resource,
            where PSU authentication encrypted data needs to be uploaded.
          - 'updateAdditionalPsuAuthentication':
              The link to the payment initiation or account information resource,
              which needs to be updated by an additional PSU password.
          - 'updateAdditionalEncryptedPsuAuthentication':
              The link to the payment initiation or account information resource,
              which needs to be updated by an additional encrypted PSU password.
          - 'authoriseTransaction':
            The link to the authorisation or cancellation authorisation sub-resource,
            where the authorisation data has to be uploaded, e.g. the TOP received by SMS.
          - 'scaStatus':
            The link to retrieve the scaStatus of the corresponding authorisation sub-resource.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaRedirect:
            $ref: '#/components/schemas/hrefType'
          scaOAuth:
            $ref: '#/components/schemas/hrefType'
          confirmation:
            $ref: '#/components/schemas/hrefType'
          updatePsuIdentification:
            $ref: '#/components/schemas/hrefType'
          updatePsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateAdditionalPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          updateAdditionalEncryptedPsuAuthentication:
            $ref: '#/components/schemas/hrefType'
          authoriseTransaction:
            $ref: '#/components/schemas/hrefType'
          scaStatus:
            $ref: '#/components/schemas/hrefType'
      selectPsuAuthenticationMethodResponse:
        description: |-
          Body of the JSON response for a successful select PSU authentication method
          request.
        type: object
        required:
          - scaStatus
        properties:
          transactionFees:
            $ref: '#/components/schemas/amount'
          currencyConversionFees:
            $ref: '#/components/schemas/amount'
          estimatedTotalAmount:
            $ref: '#/components/schemas/amount'
          estimatedInterbankSettlementAmount:
            $ref: '#/components/schemas/amount'
          chosenScaMethod:
            $ref: '#/components/schemas/authenticationObject'
          challengeData:
            $ref: '#/components/schemas/challengeData'
          _links:
            $ref: '#/components/schemas/_linksSelectPsuAuthenticationMethod'
          scaStatus:
            $ref: '#/components/schemas/scaStatus'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      scaStatusAuthorisationConfirmation:
        description: |
          This data element is containing information about the status of the SCA method
          in an authorisation confirmation response.


          The following codes are defined for this data type.

            * 'finalised': if the transaction authorisation and confirmation was successful.
            * 'failed': if the transaction authorisation or confirmation was not successful.
        type: string
        enum:
          - finalised
          - failed
      _linksAuthorisationConfirmation:
        description: |
          A list of hyperlinks to be recognised by the TPP. The actual hyperlinks used
          in the response depend on the dynamical decisions of the ASPSP when processing
          the request.


          **Remark:** All links can be relative or full links, to be decided by the
          ASPSP.


          Type of links admitted in this response, (further links might be added for
          ASPSP

          defined extensions):


          - 'scaStatus': The link to retrieve the status of the corresponding
          transaction resource.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          scaStatus:
            $ref: '#/components/schemas/hrefType'
      authorisationConfirmationResponse:
        description: Body of the JSON response for an authorisation confirmation request.
        type: object
        required:
          - scaStatus
          - _links
        properties:
          scaStatus:
            $ref: '#/components/schemas/scaStatusAuthorisationConfirmation'
          _links:
            $ref: '#/components/schemas/_linksAuthorisationConfirmation'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      confirmationOfFunds:
        description: |
          JSON Request body for the "Confirmation of funds service".

          <table>
          <tr>
            <td>account</td>
            <td> Account Reference</td>
            <td>Mandatory</td>
            <td>PSU's account number.</td>
          </tr>
          <tr>
            <td>instructedAmount</td>
            <td>Amount</td>
            <td>Mandatory</td>
            <td>Transaction amount to be checked within the funds check mechanism.</td>
          </tr>
          </table>
        type: object
        required:
          - account
          - instructedAmount
        properties:
          account:
            $ref: '#/components/schemas/accountReference'
          instructedAmount:
            $ref: '#/components/schemas/amount'
      fundsAvailable:
        description: |
          Equals true if sufficient funds are available at the time of the request,
          false otherwise.


          This data element is allways contained in a confirmation of funds response.


          This data element is contained in a payment status response,

          if supported by the ASPSP, if a funds check has been performed and

          if the transactionStatus is "ACTC", "ACWC" or "ACCP".
        type: boolean
      MessageCode401_PIIS:
        description: Message codes defined for PIIS for HTTP Error code 401 (UNAUTHORIZED).
        type: string
        enum:
          - CERTIFICATE_INVALID
          - ROLE_INVALID
          - CERTIFICATE_EXPIRED
          - CERTIFICATE_BLOCKED
          - CERTIFICATE_REVOKE
          - CERTIFICATE_MISSING
          - SIGNATURE_INVALID
          - SIGNATURE_MISSING
          - CORPORATE_ID_INVALID
          - PSU_CREDENTIALS_INVALID
          - CONSENT_INVALID
          - CONSENT_EXPIRED
          - TOKEN_UNKNOWN
          - TOKEN_INVALID
          - TOKEN_EXPIRED
      tppMessage401_PIIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode401_PIIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error401_NG_PIIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage401_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode401_PIS:
        description: Message codes defined for PIS for HTTP Error code 401 (UNAUTHORIZED).
        type: string
        enum:
          - CERTIFICATE_INVALID
          - ROLE_INVALID
          - CERTIFICATE_EXPIRED
          - CERTIFICATE_BLOCKED
          - CERTIFICATE_REVOKE
          - CERTIFICATE_MISSING
          - SIGNATURE_INVALID
          - SIGNATURE_MISSING
          - CORPORATE_ID_INVALID
          - PSU_CREDENTIALS_INVALID
          - CONSENT_INVALID
          - CONSENT_EXPIRED
          - TOKEN_UNKNOWN
          - TOKEN_INVALID
          - TOKEN_EXPIRED
          - KID_MISSING
      Error401_PIIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 401 for PIIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode401_PIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode401_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode403_PIIS:
        description: Message codes defined for PIIS for HTTP Error code 403 (FORBIDDEN).
        type: string
        enum:
          - CONSENT_UNKNOWN
          - SERVICE_BLOCKED
          - RESOURCE_UNKNOWN
          - RESOURCE_EXPIRED
      tppMessage403_PIIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode403_PIIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error403_NG_PIIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 403.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage403_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error403_PIIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 403 for PIIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode403_PIIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode403_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode404_PIIS:
        description: Message codes defined for PIIS for HTTP Error code 404 (NOT FOUND).
        type: string
        enum:
          - RESOURCE_UNKNOWN
      tppMessage404_PIIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode404_PIIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error404_NG_PIIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 404.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage404_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error404_PIIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 404 for PIIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode404_PIIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode404_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode405_PIIS:
        description: Message codes defined for PIIS for HTTP Error code 405 (METHOD NOT ALLOWED).
        type: string
        enum:
          - SERVICE_INVALID
      tppMessage405_PIIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode405_PIIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error405_NG_PIIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage405_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error405_PIIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 405 for PIIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode405_PIIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode405_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode409_PIIS:
        description: Message codes defined for PIIS for HTTP Error code 409 (CONFLICT).
        type: string
        enum:
          - STATUS_INVALID
      tppMessage409_PIIS:
        type: object
        required:
          - category
          - code
          - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode409_PIIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error409_NG_PIIS:
        description: |
          NextGenPSD2 specific definition of reporting error information in case of a
          HTTP error code 409.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage409_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
        example:
          - category: ERROR
            code: STATUS_INVALID
            text: additional text information of the ASPSP up to 500 characters
      Error409_PIIS:
        description: |
          Standardised definition of reporting error information according to [RFC7807]
          in case of a HTTP error code 409 for PIIS.
        type: object
        required:
          - type
          - code
        properties:
          type:
            description: |
              A URI reference [RFC3986] that identifies the problem type.
              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: |
              Short human readable description of error type.
              Could be in local language.
              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: |
              Detailed human readable text specific to this instance of the error.

              XPath might be used to point to the issue generating the error in
              addition.

              Remark for Future: In future, a dedicated field might be introduced for
              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode409_PIIS'
          additionalErrors:
            description: |
              Array of Error Information Blocks.

              Might be used if more than one error is to be communicated
            type: array
            items:
              description: |-
                This is a data element to support the declaration of additional errors
                in the context of [RFC7807].
              type: object
              required:
                - code
              properties:
                title:
                  $ref: '#/components/schemas/tppErrorTitle'
                detail:
                  $ref: '#/components/schemas/tppErrorDetail'
                code:
                  $ref: '#/components/schemas/MessageCode409_PIIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      consentConfirmationOfFundsStatusResponse:
        description: Body of the JSON response.
        type: object
        required:
          - consentStatus
        properties:
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
      ConsentConfirmationOfFundsContentResponse:
        description: Body of the JSON response for a confirmation of funds content request.
        type: object
        required:
          - account
          - consentStatus
        properties:
          account:
            $ref: '#/components/schemas/accountReference'
          consentStatus:
            $ref: '#/components/schemas/consentStatus'

  examples:
  confirmationOfFundsConsentExample:
  description: Request body for a confirmation of funds.
  value:
  account:
  iban: **preferredAccIdentifierValue**
  cofConsentResponseExampleRedirect:
  description: Response in case of a redirect approach.
  value:
  consentStatus: received
  consentId: ff12171e-695d-4715-9d7e-8071f6086f6e
  \_links:
  scaRedirect:
  href: https://auth.sandbox.open-bank.io/v1/authentication/tenants/{{tenant-id}}/sca/redirect?messageId=dfead4d8-e4b7-4391-8x7b-2f6se231adfd
  self:
  href: /v1/consents/cofirmation-of-funds/ff12171e-695d-4715-9d7e-8071f6086f6e
  status:
  href: /v1/consents/cofirmation-of-funds/ff12171e-695d-4715-9d7e-8071f6086f6e/status
  scaStatus:
  href: /v1/consents/cofirmation-of-funds/ff12171e-695d-4715-9d7e-8071f6086f6e/authorisations/7b1cdbfa6bcv4234b724edese5h66f8d
  cofConsentResponseExampleOAuth2:
  description: |-
  Response in case of the OAuth2 approach with an implicit generated
  authorisation resource.
  value:
  consentStatus: received
  consentId: ff12171e-695d-4715-9d7e-8071f6086f6e
  scaMethods: - authenticationType: CHIP_OTP
  authenticationMethodId: '1'
  authenticationVersion: '1.0'
  name: Redirect SCA Approach
  explanation: N/A
  \_links:
  self:
  href: /v1/consents/confirmation-of-funds/ff12171e-695d-4715-9d7e-8071f6086f6e
  status:
  href: /v1/consents/confirmation-of-funds/ff12171e-695d-4715-9d7e-8071f6086f6e/status
  confirmationOfFundsAuthorisationExample:
  description: Response in case of Redirect approach.
  value:
  scaStatus: psuIdentified
  authorisationId: ff12171e-695d-4715-9d7e-8071f6086f6e
  scaMethods: - authenticationType: CHIP_OTP
  authenticationMethodId: '1'
  authenticationVersion: '1.0'
  name: Redirect SCA Approach
  explanation: N/A
  chosenScaMethod:
  authenticationType: CHIP_OTP
  authenticationMethodId: '1'
  authenticationVersion: '1.0'
  name: Redirect SCA Approach
  explanation: N/A
  \_links:
  scaStatus:
  href: /v1/consents/04b401af-b364-4549-8c1a-fac34de942d7/authorisations/298b9fdb0b8845e8b1fffb4576809592
  confirmation:
  href: /v1/consents/04b401af-b364-4549-8c1a-fac34de942d7/authorisations/298b9fdb0b8845e8b1fffb4576809592
  readScaStatusOfTheConsentAuthorisation:
  description: SCA status of the consent authorisation.
  value:
  scaStatus: finalised
  authorisationConfirmationExample_Redirect:
  description: Authorisation confirmation request body for the redirect approach.
  value:
  confirmationCode: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  confirmationOfFundsUpdateAuthorisationExample:
  description: Response of an authorisation confirmation request.
  value:
  scaStatus: finalised
  confirmationOfFundsExample:
  description: Request body for a confirmation of funds.
  value:
  account:
  iban: **preferredAccIdentifierValue**
  instructedAmount:
  currency: **currency**
  amount: '123.00'
  confirmationOfFundsResponseExample:
  description: Response for a confirmation of funds request.
  value:
  fundsAvailable: 'true'
  consentDeleteResponseExample:
  summary: Example of No Content Response
  value: {}
  requestBodies:
  consentsConfirmationOfFunds:
  description: |
  Request body for a consents request.
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/confirmationOfFundsConsent'
  examples:
  Consent Request for Confirmation of Funds:
  $ref: '#/components/examples/confirmationOfFundsConsentExample'
  confirmationOfFunds:
  description: |
  Request body for a confirmation of funds request.
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/confirmationOfFunds'
  examples:
  Example:
  $ref: '#/components/examples/confirmationOfFundsExample'
  required: true
  headers:
  Location:
  description: |
  Location of the created resource (if created).
  schema:
  type: string
  format: url
  required: true
  X-Request-ID:
  description: ID of the request, unique to the call, as determined by the initiating party.
  required: true
  example: 99391c7e-ad88-49ec-a2ad-99ddcb1f7721
  schema:
  type: string
  format: uuid
  ASPSP-SCA-Approach:
  description: |
  This data element must be contained, if the SCA Approach is already fixed.
  Possible values are
  _ DECOUPLED
  _ REDIRECT
  The OAuth SCA approach will be subsumed by REDIRECT.
  schema:
  type: string
  enum: - DECOUPLED - REDIRECT
  example: DECOUPLED
  required: false
  responses:
  CREATED_201_ConsentsConfirmationOfFunds:
  description: Created
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  ASPSP-SCA-Approach:
  $ref: '#/components/headers/ASPSP-SCA-Approach'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/consentsResponse-201' - $ref: '#/components/schemas/ConsentsConfirmationOfFundsMultilevelSCAResponse'
  examples:
  Response in case of a redirect approach:
  $ref: '#/components/examples/cofConsentResponseExampleRedirect'
  Response in case of the OAuth2 approach with an implicit generated authorisation resource.:
  $ref: '#/components/examples/cofConsentResponseExampleOAuth2'
  BAD_REQUEST_400_AIS:
  description: Bad Request
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error400_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error400_AIS'
  UNAUTHORIZED_401_AIS:
  description: Unauthorized
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error401_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error401_AIS'
  FORBIDDEN_403_AIS:
  description: Forbidden
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error403_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error403_AIS'
  NOT_FOUND_404_AIS:
  description: Not found
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error404_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error404_AIS'
  METHOD_NOT_ALLOWED_405_AIS:
  description: Method Not Allowed
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error405_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error405_AIS'
  NOT_ACCEPTABLE_406_AIS:
  description: Not Acceptable
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error406_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error406_AIS'
  REQUEST_TIMEOUT_408_AIS:
  description: Request Timeout
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  CONFLICT_409_AIS:
  description: Conflict
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error409_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error409_AIS'
  UNSUPPORTED_MEDIA_TYPE_415_AIS:
  description: Unsupported Media Type
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  TOO_MANY_REQUESTS_429_AIS:
  description: Too Many Requests
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error429_NG_AIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error429_AIS'
  INTERNAL_SERVER_ERROR_500_AIS:
  description: Internal Server Error
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  SERVICE_UNAVAILABLE_503_AIS:
  description: Service Unavailable
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  CREATED_201_ConsentsConfirmationAuthorisationStart:
  description: Created
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/ConsentsConfirmationOfFundsAuthorisationResponse'
  examples:
  Example with explicit authorisation flow:
  $ref: '#/components/examples/confirmationOfFundsAuthorisationExample'
  OK_200_ScaStatus:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/scaStatusResponse'
  examples:
  Example:
  $ref: '#/components/examples/readScaStatusOfTheConsentAuthorisation'
  OK_200_UpdateConfirmationOfFundsConsentPsuData:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/updatePsuIdentificationResponse' - $ref: '#/components/schemas/updatePsuAuthenticationResponse' - $ref: '#/components/schemas/selectPsuAuthenticationMethodResponse' - $ref: '#/components/schemas/scaStatusResponse' - $ref: '#/components/schemas/authorisationConfirmationResponse'
  examples:
  Authorisation confirmation:
  $ref: '#/components/examples/confirmationOfFundsUpdateAuthorisationExample'
  OK_200_ConfirmationOfFunds:
  description: OK
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  description: |
  Equals "true" if sufficient funds are available at the time of the
  request,

                "false" otherwise.
              type: object
              required:
                - fundsAvailable
              properties:
                fundsAvailable:
                  $ref: '#/components/schemas/fundsAvailable'
            examples:
              Example:
                $ref: '#/components/examples/confirmationOfFundsResponseExample'
      BAD_REQUEST_400_PIIS:
        description: Bad Request
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error400_NG_AIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error400_AIS'
      UNAUTHORIZED_401_PIIS:
        description: Unauthorized
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error401_NG_PIIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error401_PIIS'
      FORBIDDEN_403_PIIS:
        description: Forbidden
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error403_NG_PIIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error403_PIIS'
      NOT_FOUND_404_PIIS:
        description: Not found
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error404_NG_PIIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error404_PIIS'
      METHOD_NOT_ALLOWED_405_PIIS:
        description: Method Not Allowed
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error405_NG_PIIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error405_PIIS'
      NOT_ACCEPTABLE_406_PIIS:
        description: Not Acceptable
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      REQUEST_TIMEOUT_408_PIIS:
        description: Request Timeout
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      CONFLICT_409_PIIS:
        description: Conflict
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error409_NG_PIIS'
          application/problem+json:
            schema:
              $ref: '#/components/schemas/Error409_PIIS'
      UNSUPPORTED_MEDIA_TYPE_415_PIIS:
        description: Unsupported Media Type
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      TOO_MANY_REQUESTS_429_PIIS:
        description: Too Many Requests
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      INTERNAL_SERVER_ERROR_500_PIIS:
        description: Internal Server Error
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      SERVICE_UNAVAILABLE_503_PIIS:
        description: Service Unavailable
        headers:
          Location:
            $ref: '#/components/headers/Location'
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
      OK_200_ConsentConfirmationOfFundsStatus:
        description: OK
        headers:
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/consentConfirmationOfFundsStatusResponse'
      OK_200_ConsentConfirmationOfFundsContent:
        description: OK
        headers:
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConsentConfirmationOfFundsContentResponse'
      OK_204_ConsentConfirmationOfFundsDelete:
        description: Deletes a given consent.
        headers:
          X-Request-ID:
            $ref: '#/components/headers/X-Request-ID'
        content:
          application/json:
            examples:
              Example:
                $ref: '#/components/examples/consentDeleteResponseExample'

openapi: 3.0.1
info:
title: Account Information Service (AIS)
version: 1.3.0_2025-03-04
description: |

    # Overview

    Access Account Information (AIS)

    To access any account information, you must first establish an account information consent, which involves running the PSU through [Strong Customer Authentication](/apidocumentation/getstarted#section/Welcome-to-the-OpenBanking-Developer-Portal/Strong-Customer-Authentication-(SCA)) and obtaining a valid `consentId`. This consentId is then used as a header in subsequent AIS use cases (e.g., reading the account list, account details, account balances, and transactions) and grants access to the information authorized by the PSU.

    **Reference**: This specification is based on NextGenPSD2 v1.3.13.

    # Version history

    ## 📝 Documentation

    ### October 18, 2024 - frequencyPerDay
    - explained how the `frequencyperDay` counter works


    ### January 16, 2025 - PSU-ID-Type
    - Added details of the supported values to the PSU-ID-Type header.

    ### March 04, 2025 - confirmationCode, header adjustments
    - *scaAuthenticationData* renamed to ***confirmationCode*** in the request body of the *Update PSU Data for consents* endpoint.
    It is still possible to use *scaAuthenticationData* for backward compatibility.
    - Added `Date` as mandatory header for all AIS requests
    - Made `Digest`, `Signature` and `TPP-Signature-Certificate` mandatory headers
    - Adjusted the error responses schema - made `tppMessages.text` mandatory


    # Consent Management (AIS)

    To manage AIS consents, this section provides detailed information about the available API endpoints, including their functionalities, request and response structures, and supported operations. These endpoints enable third-party providers to create, update, retrieve, or revoke account information consents, ensuring secure and seamless access to the PSU's authorized data. Additionally, the section outlines the necessary parameters, authentication requirements, and error handling mechanisms to facilitate proper integration and compliance with PSD2 regulations.

    ### Establish Consent (AIS)

    [POST /v1/consents](#tag/Account-Information-Service-(AIS)/operation/createConsent)

    For an overview of the consent establishment flow, please have a look to the diagram shown in the Getting Started section with the [Strong Customer Authentication](/apidocumentation/getstarted#section/Welcome-to-the-OpenBanking-Developer-Portal/Strong-Customer-Authentication-(SCA)).

    The following types of consent access is supported:
      |  Access | Supported  |
      |---|---|
      |  Dedicated accounts | Yes  |
      |  Account list of available accounts |  Yes |
      |  Global consent (allPsd2) | Yes  |
      |  Bank offered consent | Yes |

    Recurring consents are allowed with up to 90 days validity.

    Read Consent
    [GET /v1/consents/{consent-id}](#tag/Account-Information-Service-(AIS)/operation/getConsentInformation)

    Read Consent Status
    [GET /v1/consents/{consent-id}/status](#tag/Account-Information-Service-(AIS)/operation/getConsentStatus)

    Delete Consent
    [DELETE /v1/consents/{consent-id}](#tag/Account-Information-Service-(AIS)/operation/deleteConsent)

    ### Read Account Data

    To read data from the online accessible bank accounts this section provides the information of the available API endpoints and if there is something that needs to be mentioned as Berlin Group provides optional features or because of specific changes that were made.

    Example flow for available use cases to read account data (be aware that a valid consent exists and has been established before):

    ```mermaid
    sequenceDiagram
      actor PSU
      participant TPP
      participant XS2A_API
      Note over PSU,XS2A_API: Read account list
      PSU->>TPP: 1 initiate account information
      Note over PSU,XS2A_API: [..] AIS Establish Consent [..]

      TPP->>XS2A_API: 2 GET /accounts?withBalance=true <br/> consentId <br/> certificate
      activate TPP
      activate XS2A_API
      XS2A_API-->>TPP: 3 account list
      deactivate XS2A_API
      TPP-->>PSU: 4 show result page
      deactivate TPP
    ```
    #### Read Account List

    [GET /v1/accounts](#tag/Account-Information-Service-(AIS)/operation/getAccountList)

    The response will contain the accessible accounts (based on the consent) where for each account, a resourceId will be returned. This needs to be used in subsequent requests to read specific account data as account-id as the use of IBANs, BBANs etc. as part of the endpoint path is not supported.

    If the consent allows to read balances then you can add the query parameter withBalance=true which will return the booking balance of the accounts where balance access is granted.

    #### Read Account Details

    [GET /v1/accounts/{account-id}](#tag/Account-Information-Service-(AIS)/operation/readAccountDetails)

    If the consent allows to read balances then you can add the query parameter withBalance=true which will return the booking balance of the account.

    #### Read Account Balances

    [GET /v1/accounts/{account-id}/balances](#tag/Account-Information-Service-(AIS)/operation/getBalances)

    #### Read Account Transactions

    [GET /v1/accounts/{account-id}/transactions](#tag/Account-Information-Service-(AIS)/operation/getTransactionList)

    If the consent allows to read balances then you can add the query parameter withBalance=true which will return the booking balance of the account.

    Delta access is not supported for this endpoint which means entryReferenceFrom and deltaList cannot be used.

    The bookingStatus supports booked, pending and both as value.

    The returned format of the transaction list is always JSON.

    #### Read Account Transaction Details

    [GET /v1/accounts/{account-id}/transactions/{resourceId}](#tag/Account-Information-Service-(AIS)/operation/getTransactionDetails)

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
- name: Account Consent Service
  description: |
  Within this phase of the Account Information Service, the PSU is giving the consent to the AISP on:
  _ the type of Account Information Service to grant an access to (see list at the beginning of this section),
  _ the multiplicity of the Account Information Service, i.e. a one-off or recurring access, \* in the latter case on the duration of the consent in days or the maximum offered by the ASPSP and optionally the frequency of a recurring request.

  This consent is then authorised by the PSU towards the ASPSP with the SCA.
  The result of this process is a consent resource. A link to this resource is returned to the AISP within this process.
  The TPP can retrieve the consent object by submitting a GET method on this resource. This object contains the detailed access rights, the current validity and a Consent-ID token.

- name: Account Information Service
  description: |
  The Account Information Service (AIS) offers the following services:
  _ Transaction reports for a given account including balances if applicable
  _ Balances of a given account
  _ A list of available accounts
  _ Account details of a given account or of the list of all accessible accounts relative to a granted consent

          To access any of the above information, a valid Consent needs to be created first, and the respective Consent-ID needs to be passed through the headers of the desired request.
          When a request is sent, if it was initialized by the PSU, then either the header `PSU-IP-Address` or a `Bearer Token` needs to be sent in the request. Otherwise, the PSU is considered not present in the request and the frequencyPerDay counter will increase. If the counter is already at the allowed maximum, the request will not go through.

  externalDocs:
  description: |
  Full Documentation of NextGenPSD2 Access to Account Interoperability
  Framework
  (General Introduction Paper, Operational Rules, Implementation Guidelines)
  url: https://www.berlin-group.org/nextgenpsd2-downloads
  paths:
  /v1/consents:
  post:
  summary: Create consent
  description: |
  This method creates a consent resource, defining access rights to dedicated accounts of a given PSU-ID.
  These accounts are addressed explicitly in the method as parameters as a core function.

          **Side Effects**

          When this consent request is a request where the "recurringIndicator" equals "true", and if it exists already a former consent for recurring access on account information
          for the addressed PSU, then the former consent automatically expires as soon as the new consent request is authorised by the PSU.

          Optional Extension:

          As an option, an ASPSP might optionally accept a specific access right on the access on all PSD2 related services for all available accounts.

          As another option an ASPSP might optionally also accept a command, where only access rights are inserted without mentioning the addressed account.
          The relation to accounts is then handled afterwards between PSU and ASPSP.

          As a last option, an ASPSP might in addition accept a command with access rights
            * to see the list of available payment accounts or
            * to see the list of available payment accounts with balances or
            * to see the list of available payment accounts with balances and transactions
        operationId: createConsent
        x-codeSamples:
          - lang: cURL All accounts
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents' \

              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --data '{
                "access": {
                    "availableAccounts": "allAccounts"
                },
                "recurringIndicator": true,
                "validUntil": "2024-04-13",
                "frequencyPerDay": 30,
                "combinedServiceIndicator": false
              }'
              --cert    (INSERT CERTIFICATE.crt HERE) \
              --key     (INSERT CERTIFICATE.key HERE)
          - lang: cURL Dedicated account
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents' \

              --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --data '{
                "access": {
                    "accounts": [
                        {
                            "__preferredAccIdentifierKey__": "__preferredAccIdentifierValue__"
                        }
                    ],
                    "balances": [
                        {
                            "__preferredAccIdentifierKey__": "__preferredAccIdentifierValue__"
                        }
                    ],
                    "transactions": [
                        {
                            "__preferredAccIdentifierKey__": "__preferredAccIdentifierValue__"
                        }
                    ]
                },
                "recurringIndicator": true,
                "validUntil": "2024-04-13",
                "frequencyPerDay": 30,
                "combinedServiceIndicator": false
              }'
              --cert    (INSERT CERTIFICATE.crt HERE) \
              --key     (INSERT CERTIFICATE.key HERE)
          - lang: cURL Bank offered
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents' \
              --header 'X-Request-ID: cfa080b1-0dbf-4f2b-aaee-4350524fbccc' \
              --header 'PSU-IP-Address: 10.150.15.1' \
              --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
              --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
              --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
              --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
              --data '{
                  "access": {
                      "balances": [],
                      "transactions": []
                  },
                  "recurringIndicator": "true",
                  "validUntil": "2025-07-26",
                  "frequencyPerDay": "4",
                  "combinedServiceIndicator": false
              }'
              --cert    (INSERT CERTIFICATE.crt HERE) \
              --key     (INSERT CERTIFICATE.key HERE)
        tags:
          - Account Consent Service
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/PSU-IP-Address_mandatory'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
          - $ref: '#/components/parameters/Content-Type'
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
          - $ref: '#/components/parameters/TPP-Brand-Logging-Information'
          - $ref: '#/components/parameters/TPP-Notification-URI'
          - $ref: '#/components/parameters/TPP-Notification-Content-Preferred'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        requestBody:
          $ref: '#/components/requestBodies/consents'
        responses:
          '201':
            $ref: '#/components/responses/CREATED_201_Consents'
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

  /v1/consents/{consentId}/authorisations:
  post:
  summary: Start the authorisation process for a consent
  description: |
  Create an authorisation sub-resource and start the authorisation process of a consent.
  The message might in addition transmit authentication and authorisation related data.
  his method is iterated n times for a n times SCA authorisation in a corporate context, each creating an own authorisation sub-endpoint for the corresponding PSU authorising the consent.
  The ASPSP might make the usage of this access method unnecessary, since the related authorisation resource will be automatically created by the ASPSP after the submission of the consent data with the first POST consents call.
  The start authorisation process is a process which is needed for creating a new authorisation or cancellation sub-resource.
  operationId: startConsentAuthorisation
  x-codeSamples: - lang: cURL
  source: |
  curl --location --request POST '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)/authorisations' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'TPP-Redirect-Preferred: true' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert (INSERT CERTIFICATE.crt HERE) \
   --key (INSERT CERTIFICATE.key HERE)
  tags: - Account Consent Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-ID' - $ref: '#/components/parameters/PSU-ID-Type' - $ref: '#/components/parameters/PSU-Corporate-ID' - $ref: '#/components/parameters/PSU-Corporate-ID-Type' - $ref: '#/components/parameters/TPP-Redirect-Preferred' - $ref: '#/components/parameters/TPP-Decoupled-Preferred' - $ref: '#/components/parameters/TPP-Redirect-URI' - $ref: '#/components/parameters/TPP-Nok-Redirect-URI' - $ref: '#/components/parameters/TPP-Explicit-Authorisation-Preferred' - $ref: '#/components/parameters/TPP-Brand-Logging-Information' - $ref: '#/components/parameters/TPP-Notification-URI' - $ref: '#/components/parameters/TPP-Notification-Content-Preferred' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '201':
  $ref: '#/components/responses/CREATED_201_StartScaProcessAIS'
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
  summary: Get consent authorisation sub-resources request
  description: |
  Return a list of all authorisation subresources IDs which have been created.
  This function returns an array of hyperlinks to all generated authorisationsub-resources.
  operationId: getConsentAuthorisation
  x-codeSamples: - lang: cURL
  source: |
  curl --location --request GET '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)/authorisations' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Content-Type: application/json' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)'
  tags: - Account Consent Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_Authorisations'
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
  /v1/consents/{consentId}/authorisations/{authorisationId}:
  put:
  summary: Update PSU Data for consents
  description: |
  This method update PSU data on the consents resource if needed.
  Independently from the SCA Approach it supports e.g. the selection of the authentication method and a non-SCA PSU authentication.
  This methods updates PSU data on the cancellation authorisation resource if needed.
  There are several possible update PSU data requests in the context of a consent request if needed,
  which depends on the SCA approach:
  _ Redirect SCA Approach:
  A specific Update PSU data request is applicable for
  _ the selection of authentication methods, before choosing the actual SCA approach.
  _ Decoupled SCA Approach:
  A specific update PSU data request is only applicable for
  _ adding the PSU Identification, if not provided yet in the payment initiation request or the Account Information Consent Request, or if no OAuth2 access token is used, or \* the selection of authentication methods.

          The SCA Approach might depend on the chosen SCA method.
          For that reason, the following possible update PSU data request can apply to all SCA approaches:
          * Select an SCA method in case of several SCA methods are available for the
          customer.
        operationId: updateConsentsPsuData
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location --request PUT '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)/authorisations/(REPLACE AUTHENTICATIONID HERE)' \
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
          - Account Consent Service
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
            $ref: '#/components/responses/OK_200_UpdateConsentPsuData'
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
        summary: Read the SCA status of the consent authorisation
        description: |
          This method returns the SCA status of a consent initiation's authorisation sub-resource.
        operationId: getConsentScaStatus
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)/authorisations/(REPLACE AUTHENTICATIONID HERE)' \
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
          - Account Consent Service
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
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID'
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

  /v1/consents/{consentId}/status:
  get:
  summary: Consent status request
  description: Read the status of an account information consent resource.
  operationId: getConsentStatus
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert '(INSERT CERTIFICATE.crt HERE)' \
   --key '(INSERT CERTIFICATE.key HERE)'
  tags: - Account Consent Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_ConsentStatus'
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
  /v1/consents/{consentId}:
  get:
  summary: Get consent request
  description: |
  Returns the content of an account information consent object.
  This is returning the data for the TPP especially in cases, where the consent was directly managed between ASPSP and PSU e.g. in a redirect SCA Approach.
  operationId: getConsentInformation
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert (INSERT CERTIFICATE.crt HERE) \
   --key (INSERT CERTIFICATE.key HERE)
  tags: - Account Consent Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_ConsentInformation'
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
  summary: Delete consent
  description: The TPP can delete an account information consent object if needed.
  operationId: deleteConsent
  x-codeSamples: - lang: cURL
  source: |
  curl --location --request DELETE '(REPLACE BASEURL HERE)/v1/consents/(REPLACE CONSENTID HERE)' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --cert (INSERT CERTIFICATE.crt HERE) \
   --key (INSERT CERTIFICATE.key HERE)
  tags: - Account Consent Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/consentId_PATH' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '204':
  $ref: '#/components/responses/NO_CONTENT_204_Consents'
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
  /v1/accounts:
  get:
  summary: Read account list
  description: |
  Read the identifiers of the available payment account together with booking balance information, depending on the consent granted.
  It is assumed that a consent of the PSU to this access is already given and stored on the ASPSP system.
  The addressed list of accounts depends then on the PSU ID and the stored consent addressed by consentId, respectively the OAuth2 access token.
  Returns all identifiers of the accounts, to which an account access has been granted to through the /consents endpoint by the PSU.
  In addition, relevant information about the accounts and hyperlinks to corresponding account information resources are provided if a related consent has been already granted. >Note: Note that the /consents endpoint optionally offers to grant an access on all available payment accounts of a PSU.
  In this case, this endpoint will deliver the information about all available payment accounts of the PSU at this ASPSP.
  operationId: getAccountList
  x-codeSamples: - lang: cURL
  source: |
  curl --location '(REPLACE BASEURL HERE)/v1/accounts' \
   --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
   --header 'Consent-ID: (REPLACE CONSENTID HERE)' \
   --header 'PSU-IP-Address: 10.150.15.1' \
   --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
   --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
   --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
   --header 'TPP-Signature-Certificate: (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
   --key client.key \
   --cert client.crt \
   --insecure \
   --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)'
  tags: - Account Information Service
  security: - {} - BearerAuthOAuth: []
  parameters: - $ref: '#/components/parameters/withBalanceQuery' - $ref: '#/components/parameters/X-Request-ID' - $ref: '#/components/parameters/Date' - $ref: '#/components/parameters/consentId_HEADER_mandatory' - $ref: '#/components/parameters/Digest' - $ref: '#/components/parameters/Signature' - $ref: '#/components/parameters/TPP-Signature-Certificate' - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis' - $ref: '#/components/parameters/PSU-IP-Port' - $ref: '#/components/parameters/PSU-Accept' - $ref: '#/components/parameters/PSU-Accept-Charset' - $ref: '#/components/parameters/PSU-Accept-Encoding' - $ref: '#/components/parameters/PSU-Accept-Language' - $ref: '#/components/parameters/PSU-User-Agent' - $ref: '#/components/parameters/PSU-Http-Method' - $ref: '#/components/parameters/PSU-Device-ID' - $ref: '#/components/parameters/PSU-Device-Name' - $ref: '#/components/parameters/PSU-Geo-Location'
  responses:
  '200':
  $ref: '#/components/responses/OK_200_AccountList'
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
  /v1/accounts/{account-id}:
  get:
  summary: Read account details
  description: |
  Reads details about an account, with balances where required.
  It is assumed that a consent of the PSU to this access is already given and stored on the ASPSP system.
  The addressed details of this account depends then on the stored consent
  addressed by consentId, respectively the OAuth2 access token.

          **NOTE:** The account-id can represent a multicurrency account.
          In this case the currency code is set to "XXX".
          Give detailed information about the addressed account.
          Give detailed information about the addressed account together with balance information
        operationId: readAccountDetails
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/accounts/(REPLACE ACCOUNTID HERE)' \
                --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
                --header 'Consent-ID: (REPLACE CONSENTID HERE)' \
                --header 'PSU-IP-Address: 10.150.15.1' \
                --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
                --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
                --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
                --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
                --cert    (INSERT CERTIFICATE.crt HERE) \
                --key     (INSERT CERTIFICATE.key HERE) \
                --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)'
        tags:
          - Account Information Service
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/accountId'
          - $ref: '#/components/parameters/withBalanceQuery'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/consentId_HEADER_mandatory'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_AccountDetails'
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

  /v1/accounts/{account-id}/balances:
  get:
  summary: Read balance
  description: |
  Reads account data from a given account addressed by "account-id".

          **Remark:** This account-id can be a tokenised identification due to data protection reason since the path information might be logged on intermediary servers within the ASPSP sphere.

          This account-id then can be retrieved by the "Get account list" call.
          The account-id is constant at least throughout the lifecycle of a given consent.
        operationId: getBalances
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/accounts/(REPLACE ACCOUNTID HERE)/balances' \
                --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
                --header 'Consent-ID: (REPLACE CONSENTID HERE)' \
                --header 'PSU-IP-Address: 10.150.15.1' \
                --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
                --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
                --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
                --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
                --cert    (INSERT CERTIFICATE.crt HERE) \
                --key     (INSERT CERTIFICATE.key HERE) \
                --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)'
        tags:
          - Account Information Service
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/accountId'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/consentId_HEADER_mandatory'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-Device-ID_optional'
          - $ref: '#/components/parameters/PSU-Device-Name'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_Balances'
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

  /v1/accounts/{account-id}/transactions:
  get:
  summary: Read transaction list of an account
  description: |
  Read transaction reports or transaction lists of a given account addressed by "account-id", depending on the steering parameter "bookingStatus" together with balances.

          For a given account, additional parameters are e.g. the attributes "dateFrom" and "dateTo".
          The ASPSP might add balance information, if transaction lists without balances are not supported.
        operationId: getTransactionList
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/accounts/(REPLACE ACCOUNTID HERE)/transactions' \
                --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
                --header 'Consent-ID: (REPLACE CONSENTID HERE)' \
                --header 'PSU-IP-Address: 10.150.15.1' \
                --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
                --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
                --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
                --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
                --cert    (INSERT CERTIFICATE.crt HERE) \
                --key     (INSERT CERTIFICATE.key HERE) \
                --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)'
        tags:
          - Account Information Service
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/accountId'
          - $ref: '#/components/parameters/dateFrom'
          - $ref: '#/components/parameters/dateTo'
          - $ref: '#/components/parameters/entryReferenceFrom'
          - $ref: '#/components/parameters/bookingStatusGeneric'
          - $ref: '#/components/parameters/deltaList'
          - $ref: '#/components/parameters/withBalanceQuery'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/consentId_HEADER_mandatory'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_AccountsTransactions'
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

  /v1/accounts/{account-id}/transactions/{transactionId}:
  get:
  summary: Read transaction details
  description: |
  Reads transaction details from a given transaction addressed by
  "transactionId" on a given account addressed by "account-id".

          This call is only available on transactions as reported in a JSON format.


          **Remark:** Please note that the PATH might be already given in detail by
          the corresponding entry of the response of the "Read Transaction List" call within the _links subfield.
        operationId: getTransactionDetails
        x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(REPLACE BASEURL HERE)/v1/accounts/(REPLACE ACCOUNTID HERE)/transactions/(REPLACE TRANSACTIONID HERE)' \
                --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \
                --header 'Consent-ID: (REPLACE CONSENTID HERE)' \
                --header 'PSU-IP-Address: 10.150.15.1' \
                --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \
                --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \
                --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \
                --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \
                --cert    '(INSERT CERTIFICATE.crt HERE) \
                --key     '(INSERT CERTIFICATE.key HERE) \
                --header 'Authorization: Bearer (REPLACE GENERATED TOKEN HERE)'
        tags:
          - Account Information Service
        security:
          - {}
          - BearerAuthOAuth: []
        parameters:
          - $ref: '#/components/parameters/accountId'
          - $ref: '#/components/parameters/transactionId'
          - $ref: '#/components/parameters/X-Request-ID'
          - $ref: '#/components/parameters/Date'
          - $ref: '#/components/parameters/consentId_HEADER_mandatory'
          - $ref: '#/components/parameters/Digest'
          - $ref: '#/components/parameters/Signature'
          - $ref: '#/components/parameters/TPP-Signature-Certificate'
          - $ref: '#/components/parameters/PSU-IP-Address_conditionalForAis'
          - $ref: '#/components/parameters/PSU-IP-Port'
          - $ref: '#/components/parameters/PSU-Accept'
          - $ref: '#/components/parameters/PSU-Accept-Charset'
          - $ref: '#/components/parameters/PSU-Accept-Encoding'
          - $ref: '#/components/parameters/PSU-Accept-Language'
          - $ref: '#/components/parameters/PSU-User-Agent'
          - $ref: '#/components/parameters/PSU-Http-Method'
          - $ref: '#/components/parameters/PSU-Device-ID'
          - $ref: '#/components/parameters/PSU-Device-Name'
          - $ref: '#/components/parameters/PSU-Geo-Location'
        responses:
          '200':
            $ref: '#/components/responses/OK_200_TransactionDetails'
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
  PSU-IP-Address_mandatory:
  name: PSU-IP-Address
  in: header
  description: |
  The forwarded IP Address header field consists of the corresponding http
  request IP Address field between PSU and TPP.

          In case of a call without PSU's presence, the TPP fills in 0.0.0.0.
        schema:
          type: string
          format: ipv4
        required: true
        example: 192.168.8.78
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
      Content-Type:
        name: Content-Type
        in: header
        schema:
          type: string
        required: false
        example: application/json
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
      TPP-Decoupled-Preferred:
        name: TPP-Decoupled-Preferred
        in: header
        description: |
          If it equals "true", the TPP prefers a decoupled SCA approach.
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
      TPP-Brand-Logging-Information:
        name: TPP-Brand-Logging-Information
        in: header
        description: |
          This header might be used by TPPs to inform the ASPSP about the brand used by
          the TPP towards the PSU.

          This information is meant for logging entries to enhance communication between
          ASPSP and PSU or ASPSP and TPP.

          This header might be ignored by the ASPSP.
        schema:
          type: string
        required: false
      TPP-Notification-URI:
        name: TPP-Notification-URI
        in: header
        description: |
          URI for the Endpoint of the TPP-API to which the status of the payment
          initiation should be sent.

          This header field may by ignored by the ASPSP.


          For security reasons, it shall be ensured that the TPP-Notification-URI as
          introduced above is secured by the TPP eIDAS QWAC used for identification of
          the TPP. The following applies:


          URIs which are provided by TPPs in TPP-Notification-URI shall comply with the
          domain secured by the eIDAS QWAC certificate of the TPP in the field CN or
          SubjectAltName of the certificate. Please note that in case of example-TPP.com
          as certificate entry TPP- Notification-URI like
          www.example-TPP.com/xs2a-client/v1/ASPSPidentifcation/mytransaction-
          id/notifications or
          notifications.example-TPP.com/xs2a-client/v1/ASPSPidentifcation/mytransaction-
          id/notifications would be compliant.


          Wildcard definitions shall be taken into account for compliance checks by the
          ASPSP.
           ASPSPs may respond with ASPSP-Notification-Support set to false, if the provided URIs do not comply.
        schema:
          type: string
        required: false
      TPP-Notification-Content-Preferred:
        name: TPP-Notification-Content-Preferred
        in: header
        description: |
          The string has the form


          status=X1, ..., Xn


          where Xi is one of the constants SCA, PROCESS, LAST and where constants are
          not

          repeated.

          The usage of the constants supports the of following semantics:

            SCA: A notification on every change of the scaStatus attribute for all related authorisation processes is preferred by the TPP.

            PROCESS: A notification on all changes of consentStatus or transactionStatus attributes is preferred by the TPP.
            LAST: Only a notification on the last consentStatus or transactionStatus as available in the XS2A interface is preferred by the TPP.

          This header field may be ignored, if the ASPSP does not support resource
          notification services for the related TPP.
        schema:
          type: string
        required: false
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
      withBalanceQuery:
        name: withBalance
        in: query
        description: |
          If contained, this function reads the list of accessible payment accounts
          including the booking balance,

          if granted by the PSU in the related consent and available by the ASPSP.

          This parameter might be ignored by the ASPSP.
        required: false
        schema:
          type: boolean
      consentId_HEADER_mandatory:
        name: Consent-ID
        in: header
        description: |
          This then contains the consentId of the related AIS consent, which was
          performed prior to this payment initiation.
        required: true
        schema:
          $ref: '#/components/schemas/consentId'
      accountId:
        name: account-id
        in: path
        description: |
          This identification is denoting the addressed account.
          The account-id is retrieved by using a "Read Account List" call.
          The account-id is the "resourceId" attribute of the account structure.
          Its value is constant at least throughout the lifecycle of a given consent.
        required: true
        schema:
          $ref: '#/components/schemas/accountId'
      dateFrom:
        name: dateFrom
        in: query
        description: |
          Conditional: Starting date (inclusive the date dateFrom) of the transaction
          list, mandated if no delta access is required

          and if bookingStatus does not equal "information".


          For booked transactions, the relevant date is the booking date.


          For pending transactions, the relevant date is the entry date, which may not
          be transparent

          neither in this API nor other channels of the ASPSP.
        required: false
        schema:
          type: string
          format: date
      dateTo:
        name: dateTo
        in: query
        description: |
          End date (inclusive the data dateTo) of the transaction list, default is "now"
          if not given.


          Might be ignored if a delta function is used.


          For booked transactions, the relevant date is the booking date.


          For pending transactions, the relevant date is the entry date, which may not
          be transparent

          neither in this API nor other channels of the ASPSP.
        required: false
        schema:
          type: string
          format: date
      entryReferenceFrom:
        name: entryReferenceFrom
        in: query
        description: |
          This data attribute is indicating that the AISP is in favour to get all
          transactions after

          the transaction with identification entryReferenceFrom alternatively to the
          above defined period.

          This is a implementation of a delta access.

          If this data element is contained, the entries "dateFrom" and "dateTo" might
          be ignored by the ASPSP

          if a delta report is supported.


          Optional if supported by API provider.
        required: false
        schema:
          type: string
      bookingStatusGeneric:
        name: bookingStatus
        in: query
        description: |
          Permitted codes are
            * "booked",
            * "pending",
            * "both",
            * "information" and
            * "all"

          "booked" shall be supported by the ASPSP.

          To support the "pending" and "both" feature is optional for the ASPSP, error code is returned if not supported.

          If supported, "both" means to request transaction reports of transaction of bookingStatus either "pending" or "booked".

          To support the "information" feature is optional for the ASPSP. Currently the booking status “information” only covers standing orders. Error code if not supported.

          To support the "all" feature is optional for the ASPSP, error code if not supported. If supported, "all" means to request transaction reports of transaction of any bookingStatus ("pending", "booked" or "information").
        required: true
        schema:
          type: string
          enum:
            - information
            - booked
            - pending
            - both
            - all
      deltaList:
        name: deltaList
        in: query
        description: |-
          This data attribute is indicating that the AISP is in favour to get all
          transactions after the last report access for this PSU on the addressed
          account. This is another implementation of a delta access-report.

          This delta indicator might be rejected by the ASPSP if this function is not
          supported.

          Optional if supported by API provider
        schema:
          type: boolean
      transactionId:
        name: transactionId
        in: path
        description: |
          This identification is given by the attribute transactionId of the
          corresponding entry of a transaction list.
        required: true
        schema:
          $ref: '#/components/schemas/transactionId'

  schemas:
  accountAccessGlobal:
  description: |
  Requested access services for a consent.
  type: object
  properties:
  availableAccounts:
  description: |
  The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
  This access level allows TPPs to retrieve a list of the consumer's accounts held with the ASPSP without detailed balance information and transaction history.
  type: string
  enum: - allAccounts - allAccountsWithOwnerName
  availableAccountsWithBalance:
  description: |
  The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
  TPPs with this access level can access the list of accounts along with their current balances,
  type: string
  enum: - allAccounts - allAccountsWithOwnerName
  allPsd2:
  description: |
  The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
  TPPs with this access level can access the list of accounts along with their current balances, as well as transaction history and details.
  type: string
  enum: - allAccounts - allAccountsWithOwnerName
  recurringIndicator:
  description: |
  "true", if the consent is for recurring access to the account data.

          "false", if the consent is for one access to the account data.
        type: boolean
        example: false
      validUntil:
        description: |
          This parameter is defining a valid until date (including the mentioned date)
          for the requested consent.

          The content is the local ASPSP date in ISO-Date format, e.g. 2017-10-30.


          Future dates might get adjusted by ASPSP.


          If a maximal available date is requested, a date in far future is to be used:
          "9999-12-31".


          In both cases the consent object to be retrieved by the get consent request
          will contain the adjusted date.
        type: string
        format: date
        example: '2020-12-31'
      frequencyPerDay:
        description: |
          This field indicates the requested maximum frequency for an access without PSU
          involvement per day.
          PSU involvement means if the user is the one who initiated the request.
          This is confirmed if either the headers PSU-ID and PSU-ID-Type, or if a bearer token is present in the request.
          If the request does not have a PSU present, and the request requires the Consent-ID header to be present, then
          the frequencyPerDay counter will increase, once it reaches the allowed maximum, the TPP will no longer be able
          to initiate requests without the PSU's involvement.

          For a one-off access, this attribute is set to "1".


          The frequency needs to be greater equal to one.


          If not otherwise agreed bilaterally between TPP and ASPSP, the frequency is
          less equal to 4.
        type: integer
        example: 4
        minimum: 1
        exclusiveMinimum: false
      globalConsents:
        description: |
          Content of the body of a consent request.
        type: object
        required:
          - access
          - recurringIndicator
          - validUntil
          - frequencyPerDay
          - combinedServiceIndicator
        properties:
          access:
            $ref: '#/components/schemas/accountAccessGlobal'
          recurringIndicator:
            $ref: '#/components/schemas/recurringIndicator'
          validUntil:
            $ref: '#/components/schemas/validUntil'
          frequencyPerDay:
            $ref: '#/components/schemas/frequencyPerDay'
          combinedServiceIndicator:
            description: |
              If "true" indicates that a payment initiation service will be addressed in
              the same "session".
            type: boolean
            example: false
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
      additionalInformationAccess:
        description: |
          Optional if supported by API provider.


          Is asking for additional information as added within this structured object.

          The usage of this data element requires at least one of the entries
          "accounts",

          "transactions" or "balances" also to be contained in the object.

          If detailed accounts are referenced, it is required in addition that any
          account addressed within

          the additionalInformation attribute is also addressed by at least one of the
          attributes "accounts",

          "transactions" or "balances".
        type: object
        properties:
          ownerName:
            description: |
              Is asking for account owner name of the accounts referenced within.

              If the array is empty in the request, the TPP is asking for the account

              owner name of all accessible accounts.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for accounts, balances or
              transactions shall be empty, if used.

              The ASPSP will indicate in the consent resource after a successful
              authorisation,

              whether the ownerName consent can be accepted by providing the accounts on
              which the ownerName will

              be delivered.

              This array can be empty.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
      accountAccessDedicated:
        description: |
          Requested access services for a consent.
        type: object
        properties:
          accounts:
            description: |
              Is asking for detailed account information.


              If the array is empty in a request, the TPP is asking for an accessible
              account list.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for balances, additionalInformation
              sub attributes or transactions shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          balances:
            description: |
              Is asking for balances of the addressed accounts.


              If the array is empty in the request, the TPP is asking for the balances
              of all accessible account lists.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for accounts, additionalInformation
              sub attributes or transactions shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          transactions:
            description: |
              Is asking for transactions of the addressed accounts.


              If the array is empty in the request, the TPP is asking for the
              transactions of all accessible account lists.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for accounts, additionalInformation
              sub attributes or balances shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          additionalInformation:
            $ref: '#/components/schemas/additionalInformationAccess'
      dedicatedConsents:
        description: |
          Content of the body of a consent request.
        type: object
        required:
          - access
          - recurringIndicator
          - validUntil
          - frequencyPerDay
          - combinedServiceIndicator
        properties:
          access:
            $ref: '#/components/schemas/accountAccessDedicated'
          recurringIndicator:
            $ref: '#/components/schemas/recurringIndicator'
          validUntil:
            $ref: '#/components/schemas/validUntil'
          frequencyPerDay:
            $ref: '#/components/schemas/frequencyPerDay'
          combinedServiceIndicator:
            description: |
              If "true" indicates that a payment initiation service will be addressed in
              the same "session".
            type: boolean
            example: false
      accountAccessBankOffered:
        description: |
          Requested access services for a consent.
        type: object
        properties:
          balances:
            description: |
              Requested access to account balances.
            type: array
            items: false
          transactions:
            description: |
              Requested access to account transactions.
            type: array
            items: false
      bankOfferedConsents:
        description: |
          Content of the body of a consent request.
        type: object
        required:
          - access
          - recurringIndicator
          - validUntil
          - frequencyPerDay
          - combinedServiceIndicator
        properties:
          access:
            $ref: '#/components/schemas/accountAccessBankOffered'
          recurringIndicator:
            $ref: '#/components/schemas/recurringIndicator'
          validUntil:
            $ref: '#/components/schemas/validUntil'
          frequencyPerDay:
            $ref: '#/components/schemas/frequencyPerDay'
          combinedServiceIndicator:
            description: |
              If "true" indicates that a payment initiation service will be addressed in
              the same "session".
            type: boolean
            example: false
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
      tppMessageText:
        description: Additional explaining text to the TPP.
        type: string
        maxLength: 500
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
      authorisationId:
        description: Resource identification of the related SCA.
        type: string
        example: 123auth456
      authorisationsList:
        description: An array of all authorisationIds.
        type: array
        items:
          $ref: '#/components/schemas/authorisationId'
      authorisations:
        description: An array of all authorisationIds.
        type: object
        required:
          - authorisationIds
        properties:
          authorisationIds:
            $ref: '#/components/schemas/authorisationsList'
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
      startScaprocessResponse:
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
      consentStatusResponse-200:
        description: Body of the JSON response for a successful get status request for a consent.
        type: object
        required:
          - consentStatus
        properties:
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
      accountAccess:
        description: |
          Requested access services for a consent.
        type: object
        properties:
          accounts:
            description: |
              Is asking for detailed account information.


              If the array is empty in a request, the TPP is asking for an accessible
              account list.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for balances, additionalInformation
              sub attributes or transactions shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          balances:
            description: |
              Is asking for balances of the addressed accounts.


              If the array is empty in the request, the TPP is asking for the balances
              of all accessible account lists.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for accounts, additionalInformation
              sub attributes or transactions shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          transactions:
            description: |
              Is asking for transactions of the addressed accounts.


              If the array is empty in the request, the TPP is asking for the
              transactions of all accessible account lists.

              This may be restricted in a PSU/ASPSP authorization dialogue.

              If the array is empty, also the arrays for accounts, additionalInformation
              sub attributes or balances shall be empty, if used.
            type: array
            items:
              $ref: '#/components/schemas/accountReference'
          additionalInformation:
            $ref: '#/components/schemas/additionalInformationAccess'
          availableAccounts:
            description: |
              The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
              This access level allows TPPs to retrieve a list of the consumer's accounts held with the ASPSP without detailed balance information and transaction history.
            type: string
            enum:
              - allAccounts
              - allAccountsWithOwnerName
          availableAccountsWithBalance:
            description: |
              The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
              TPPs with this access level can access the list of accounts along with their current balances,
            type: string
            enum:
              - allAccounts
              - allAccountsWithOwnerName
          allPsd2:
            description: |
              The values "allAccounts" and "allAccountsWithOwnerName" are admitted.
              TPPs with this access level can access the list of accounts along with their current balances, as well as transaction history and details.
            type: string
            enum:
              - allAccounts
              - allAccountsWithOwnerName
      lastActionDate:
        description: |
          This date is containing the date of the last action on the consent object
          either through

          the XS2A interface or the PSU/ASPSP interface having an impact on the status.
        type: string
        format: date
        example: '2018-07-01'
      _linksGetConsent:
        description: |
          A list of hyperlinks to be recognised by the TPP.


          Links of type "account", depending on the nature of the
          consent.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          account:
            $ref: '#/components/schemas/hrefType'
      consentInformationResponse-200_json:
        description: Body of the JSON response for a successfull get consent request.
        type: object
        required:
          - access
          - recurringIndicator
          - validUntil
          - frequencyPerDay
          - lastActionDate
          - consentStatus
        properties:
          access:
            $ref: '#/components/schemas/accountAccess'
          recurringIndicator:
            $ref: '#/components/schemas/recurringIndicator'
          validUntil:
            $ref: '#/components/schemas/validUntil'
          frequencyPerDay:
            $ref: '#/components/schemas/frequencyPerDay'
          lastActionDate:
            $ref: '#/components/schemas/lastActionDate'
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
          _links:
            $ref: '#/components/schemas/_linksGetConsent'
      consentInformationResponseMD-200_json:
        description: Body of the JSON response for a successfull get consent request.
        type: object
        required:
          - access
          - recurringIndicator
          - validUntil
          - frequencyPerDay
          - lastActionDate
          - consentStatus
          - consentId
        properties:
          access:
            $ref: '#/components/schemas/accountAccess'
          recurringIndicator:
            $ref: '#/components/schemas/recurringIndicator'
          validUntil:
            $ref: '#/components/schemas/validUntil'
          frequencyPerDay:
            $ref: '#/components/schemas/frequencyPerDay'
          lastActionDate:
            $ref: '#/components/schemas/lastActionDate'
          consentStatus:
            $ref: '#/components/schemas/consentStatus'
          consentId:
            $ref: '#/components/schemas/consentId'
          _links:
            $ref: '#/components/schemas/_linksGetConsent'
      ownerName:
        description: |
          Name of the legal account owner.

          If there is more than one owner, then e.g. two names might be noted here.


          For a corporate account, the corporate name is used for this attribute.

          Even if supported by the ASPSP, the provision of this field might depend on
          the fact whether an explicit consent to this specific additional account
          information has been given by the PSU.
        type: string
        maxLength: 140
        example: John Doe
      accountStatus:
        description: |
          Account status. The value is one of the following:
            - "enabled": account is available
            - "deleted": account is terminated
            - "blocked": account is blocked e.g. for legal reasons
          If this field is not used, than the account is available in the sense of this
          specification.
        type: string
        enum:
          - enabled
          - deleted
          - blocked
      bicfi:
        description: |
          BICFI
        type: string
        pattern: '[A-Z]{6,6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3,3}){0,1}'
        example: AAAADEBBXXX
      balanceType:
        description: |
          The following balance types are defined:
            - "closingBooked":
              Balance of the account at the end of the pre-agreed account reporting period.
              It is the sum of the opening booked balance at the beginning of the period and all entries booked
              to the account during the pre-agreed account reporting period.

            - "expected":
              Balance composed of booked entries and pending items known at the time of calculation,
              which projects the end of day balance if everything is booked on the account and no other entry is posted.

            - "openingBooked":
              Book balance of the account at the beginning of the account reporting period.
              It always equals the closing book balance from the previous report.
            - "interimAvailable":
              Available balance calculated in the course of the account ?servicer?s business day,
              at the time specified, and subject to further changes during the business day.
              The interim balance is calculated on the basis of booked credit and debit items during the calculation
              time/period specified.

            - "interimBooked":
              Balance calculated in the course of the account servicer's business day, at the time specified,
              and subject to further changes during the business day.
              The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period
              specified.
            - "forwardAvailable":
              Forward available balance of money that is at the disposal of the account owner on the date specified.
        type: string
        enum:
          - closingBooked
          - expected
          - openingBooked
          - interimAvailable
          - interimBooked
          - forwardAvailable
      balance:
        description: |
          A single balance element.
        type: object
        required:
          - balanceAmount
          - balanceType
        properties:
          balanceAmount:
            $ref: '#/components/schemas/amount'
          balanceType:
            $ref: '#/components/schemas/balanceType'
          lastChangeDateTime:
            description: |
              This data element might be used to indicate e.g. with the expected or
              booked balance that no action is known

              on the account, which is not yet booked.
            type: string
            format: date-time
          lastCommittedTransaction:
            description: |
              "entryReference" of the last committed transaction to support the TPP in
              identifying whether all

              PSU transactions are already known.
            type: string
            maxLength: 35
          referenceDate:
            description: |
              indicates the date of the balance
            type: string
            format: date
      balanceList:
        description: |
          A list of balances regarding this account, e.g. the current balance, the last
          booked balance.

          The list might be restricted to the current balance.
        type: array
        items:
          $ref: '#/components/schemas/balance'
      _linksAccountDetails:
        description: |
          Links to the account, which can be directly used for retrieving account
          information from this dedicated account.


          Links to "balances" and/or "transactions"


          These links are only supported, when the corresponding consent has been
          already granted.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        properties:
          balances:
            $ref: '#/components/schemas/hrefType'
          transactions:
            $ref: '#/components/schemas/hrefType'
      accountDetails:
        description: |
          The ASPSP shall give at least one of the account reference identifiers:
            - iban
            - bban
            - msisdn
          If the account is a multicurrency account currency code in "currency" is set
          to "XXX".
        type: object
        required:
          - currency
          - resourceId
        properties:
          resourceId:
            description: This is filled by the resource id created by the ASPSP on the /accounts endpoint.
            type: string
          iban:
            $ref: '#/components/schemas/iban'
          bban:
            $ref: '#/components/schemas/bban'
          msisdn:
            $ref: '#/components/schemas/msisdn'
          currency:
            $ref: '#/components/schemas/currencyCode'
          ownerName:
            $ref: '#/components/schemas/ownerName'
          name:
            description: |-
              Name of the account, as assigned by the ASPSP, in agreement with the
              account owner in order to provide an additional means of identification of
              the account.
            type: string
            maxLength: 70
          displayName:
            description: Name of the account as defined by the user within online channels.
            type: string
            maxLength: 70
          product:
            description: Product name of the bank for this account, proprietary definition.
            type: string
            maxLength: 35
          cashAccountType:
            $ref: '#/components/schemas/cashAccountType'
          status:
            $ref: '#/components/schemas/accountStatus'
          bic:
            $ref: '#/components/schemas/bicfi'
          usage:
            description: |
              Specifies the usage of the account:
                * PRIV: private personal account
                * ORGA: professional account
            type: string
            maxLength: 4
            enum:
              - PRIV
              - ORGA
          details:
            description: |
              Specifications that might be provided by the ASPSP such as the characteristics of the account.
            type: string
            maxLength: 500
          balances:
            $ref: '#/components/schemas/balanceList'
          _links:
            $ref: '#/components/schemas/_linksAccountDetails'
      accountList:
        description: |
          List of accounts with details.
        type: object
        required:
          - accounts
        properties:
          accounts:
            type: array
            items:
              $ref: '#/components/schemas/accountDetails'
      accountId:
        description: |-
          This identification is denoting the addressed account, where the transaction
          has been performed.
        type: string
        example: 1350382300
      readAccountBalanceResponse-200:
        description: Body of the response for a successful read balance for an account request.
        type: object
        required:
          - balances
          - account
        properties:
          account:
            $ref: '#/components/schemas/accountReference'
          balances:
            $ref: '#/components/schemas/balanceList'
      transactionId:
        description: |
          This identification is given by the attribute transactionId of the
          corresponding entry of a transaction list.
        type: string
        example: 3dc3d5b3-7023-4848-9853-f5400a64e80f
      entryReference:
        description: |
          Is the identification of the transaction as used e.g. for reference for
          deltafunction on application level.
        type: string
        maxLength: 35
      bookingDate:
        description: |
          The date when an entry is posted to an account on the ASPSPs books.
        type: string
        format: date
      creditorName:
        description: Creditor name.
        type: string
        maxLength: 70
        example: Creditor Name
      debtorName:
        description: Debtor name.
        type: string
        maxLength: 70
        example: Debtor Name
      remittanceInformationUnstructured:
        description: |
          Unstructured remittance information.
        type: string
        maxLength: 140
        example: Ref Number Merchant
      remittanceInformationStructured:
        description: |
          Structured remittance information.
        type: object
        required:
          - reference
        properties:
          reference:
            type: string
            maxLength: 35
          referenceType:
            type: string
            maxLength: 35
          referenceModel:
            type: string
          referenceIssuer:
            type: string
            maxLength: 35
      remittanceInformationStructuredArray:
        description: |
          Array of structured remittance information.
        type: array
        items:
          $ref: '#/components/schemas/remittanceInformationStructured'
      additionalInformation:
        description: |
          Might be used by the ASPSP to transport additional transaction related
          information to the PSU
        type: string
        maxLength: 500
        example: Some additional transaction related information.
      purposeCode:
        description: |
          **The complete list of available purpose codes must be obtained from the bank.**


          Purpose codes are unique identifiers assigned to various international transactions, enabling banks and financial institutions to classify and process remittances accurately.
        type: number
      bankTransactionCode:
        description: |
          Bank transaction code as used by the ASPSP and using the sub elements of this
          structured code defined by ISO 20022.


          This code type is concatenating the three ISO20022 Codes
             * Domain Code,
             * Family Code, and
             * SubFamily Code
           by hyphens, resulting in 'DomainCode'-'FamilyCode'-'SubFamilyCode'.

           For standing order reports the following codes are applicable:
             * "PMNT-ICDT-STDO" for credit transfers,
             * "PMNT-IRCT-STDO"  for instant credit transfers
             * "PMNT-ICDT-XBST" for cross-border credit transfers
             * "PMNT-IRCT-XBST" for cross-border real time credit transfers and
             * "PMNT-MCOP-OTHR" for specific standing orders which have a dynamical amount to move left funds e.g. on month end to a saving account
        type: string
        example: PUB-NP-4999
      _linksTransactionDetails:
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        required:
          - transactionDetails
        properties:
          transactionDetails:
            $ref: '#/components/schemas/hrefType'
      transactions:
        description: Transaction details.
        type: object
        required:
          - transactionAmount
        properties:
          transactionId:
            $ref: '#/components/schemas/transactionId'
          entryReference:
            $ref: '#/components/schemas/entryReference'
          bookingDate:
            $ref: '#/components/schemas/bookingDate'
          valueDate:
            description: |-
              The Date at which assets become available to the account owner in case of
              a credit, or cease to be available to the account owner in case of a debit
              entry. **Usage:** If entry status is pending and value date is present,
              then the value date refers to an expected/requested value date.
            type: string
            format: date
          transactionAmount:
            $ref: '#/components/schemas/amount'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAccount:
            $ref: '#/components/schemas/accountReference'
          creditorAgent:
            $ref: '#/components/schemas/bicfi'
          debtorName:
            $ref: '#/components/schemas/debtorName'
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          debtorAgent:
            $ref: '#/components/schemas/bicfi'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          remittanceInformationStructuredArray:
            $ref: '#/components/schemas/remittanceInformationStructuredArray'
          additionalInformation:
            $ref: '#/components/schemas/additionalInformation'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          bankTransactionCode:
            $ref: '#/components/schemas/bankTransactionCode'
          balanceAfterTransaction:
            $ref: '#/components/schemas/balance'
          _links:
            $ref: '#/components/schemas/_linksTransactionDetails'
      transactionList:
        description: Array of transaction details.
        type: array
        items:
          $ref: '#/components/schemas/transactions'
      _linksAccountReport:
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        required:
          - account
        properties:
          account:
            $ref: '#/components/schemas/hrefType'
          first:
            $ref: '#/components/schemas/hrefType'
          next:
            $ref: '#/components/schemas/hrefType'
          previous:
            $ref: '#/components/schemas/hrefType'
          last:
            $ref: '#/components/schemas/hrefType'
      accountReport:
        description: |
          JSON based account report.

          This account report contains transactions resulting from the query parameters.


          'booked' shall be contained if bookingStatus parameter is set to "booked" or
          "both".


          'pending' is not contained if the bookingStatus parameter is set to "booked"
          or "information".


          'information' Only contained if the bookingStatus is set to "information" and
          if supported by ASPSP.
        type: object
        required:
          - _links
        properties:
          booked:
            $ref: '#/components/schemas/transactionList'
          pending:
            $ref: '#/components/schemas/transactionList'
          information:
            $ref: '#/components/schemas/transactionList'
          _links:
            $ref: '#/components/schemas/_linksAccountReport'
      transactionsResponse-200_json:
        description: |
          Body of the JSON response for a successful read transaction list request.
          This account report contains transactions resulting from the query parameters.
        type: object
        required:
          - account
        properties:
          account:
            $ref: '#/components/schemas/accountReference'
          transactions:
            $ref: '#/components/schemas/accountReport'
          balances:
            $ref: '#/components/schemas/balanceList'
      trsListAccountReferenceMD:
        description: |
          IBAN of the payment account
        type: object
        required:
          - iban
          - currency
        properties:
          iban:
            type: string
            description: IBAN of an account.
            example: MD21AAA000000022553456789
          currency:
            $ref: '#/components/schemas/currencyCode'
          balances:
            $ref: '#/components/schemas/balanceList'
      creditorNameAIS:
        description: Creditor name. Conditional, depending on the type of the transaction. Will be present for ***debit*** payments (outgoing payment, the money goes to the creditor, the PSU is the debtor).
        type: string
        maxLength: 70
        example: Creditor Name
      creditorAccountMD:
        description: |
          IBAN of the payment account. Conditional, depending on the type of the transaction. Will be present for ***debit*** payments (outgoing payment, the money goes to the creditor, the PSU is the debtor).
        type: object
        required:
          - iban
        properties:
          iban:
            type: string
            description: IBAN of an account.
            example: MD21AAA000000022553456789
      debtorNameAIS:
        description: Debtor name. Conditional, depending on the type of the transaction. Will be present for ***credit*** payments (incoming payment, the money comes from the debtor, the PSU is the creditor).
        type: string
        maxLength: 70
        example: Debtor Name
      debtorAccountMD:
        description: |
          IBAN of the payment account. Conditional, depending on the type of the transaction. Will be present for ***credit*** payments (incoming payment, the money comes from the debtor, the PSU is the creditor).
        type: object
        required:
          - iban
        properties:
          iban:
            type: string
            description: IBAN of an account.
            example: MD21AAA000000022553456789
      transactionsMD:
        description: Transaction details.
        type: object
        required:
          - transactionId
          - bookingDate
          - valueDate
          - transactionAmount
        properties:
          transactionId:
            $ref: '#/components/schemas/transactionId'
          bookingDate:
            $ref: '#/components/schemas/bookingDate'
          valueDate:
            description: |-
              The Date at which assets become available to the account owner in case of
              a credit, or cease to be available to the account owner in case of a debit
              entry. **Usage:** If entry status is pending and value date is present,
              then the value date refers to an expected/requested value date.
            type: string
            format: date
          transactionAmount:
            $ref: '#/components/schemas/amount'
          creditorName:
            $ref: '#/components/schemas/creditorNameAIS'
          creditorAccount:
            $ref: '#/components/schemas/creditorAccountMD'
          debtorName:
            $ref: '#/components/schemas/debtorNameAIS'
          debtorAccount:
            $ref: '#/components/schemas/debtorAccountMD'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          bankTransactionCode:
            $ref: '#/components/schemas/bankTransactionCode'
          _links:
            $ref: '#/components/schemas/_linksTransactionDetails'
      transactionListMD:
        description: Array of transaction details.
        type: array
        items:
          $ref: '#/components/schemas/transactionsMD'
      transactionsReportMD:
        description: |
          JSON based account report.

          This account report contains transactions resulting from the query parameters.

          'booked' shall be contained if bookingStatus parameter is set to "booked" or
          "both".

          'pending' is not contained if the bookingStatus parameter is set to "booked"
          or "information".

          'information' Only contained if the bookingStatus is set to "information" and
          if supported by ASPSP.
        type: object
        required:
          - booked
          - pending
          - _links
        properties:
          booked:
            $ref: '#/components/schemas/transactionListMD'
          pending:
            $ref: '#/components/schemas/transactionListMD'
          information:
            $ref: '#/components/schemas/transactionListMD'
          _links:
            $ref: '#/components/schemas/_linksAccountReport'
      transactionsResponse-200-md_json:
        description: |
          Body of the JSON response for a successful read transaction list request.
          This account report contains transactions resulting from the query parameters.
        type: object
        required:
          - account
          - transactions
        properties:
          account:
            $ref: '#/components/schemas/trsListAccountReferenceMD'
          transactions:
            $ref: '#/components/schemas/transactionsReportMD'

  examples:
  consentsExample_DedicatedAccounts:
  description: Consent request on dedicated accounts.
  value:
  access:
  accounts:
  iban: (XXXX)(XXX)221370464600
  currency: USD
  balances:
  iban: (XXXX)(XXX)221370464600
  currency: USD
  transactions:
  iban: (XXXX)(XXX)221370464600
  currency: USD
  recurringIndicator: true
  validUntil: '2024-03-10'
  frequencyPerDay: 4
  combinedServiceIndicator: false
  consentsExample_AccountList:
  description: Consent on account list of available accounts.
  value:
  access:
  availableAccounts: allAccounts
  recurringIndicator: true
  validUntil: '2024-03-10'
  frequencyPerDay: 4
  combinedServiceIndicator: false
  consentsExample_without_Accounts:
  description: Consent request on account list or without indication of accounts.
  value:
  access:
  balances: []
  transactions: []
  recurringIndicator: 'true'
  validUntil: '2025-06-10'
  frequencyPerDay: 4
  combinedServiceIndicator: false
  consentResponseExampleRedirect:
  description: Response in case of a redirect approach.
  value:
  consentStatus: received
  consentId: ff12171e-695d-4715-9d7e-8071f6086f6e
  \_links:
  scaRedirect:
  href: https://auth.sandbox.open-bank.io/v1/authentication/tenants/{{tenant-id}}/sca/redirect?messageId=dfead4d8-e4b7-4391-8x7b-2f6se231adfd
  self:
  href: /v1/consents/ff12171e-695d-4715-9d7e-8071f6086f6e
  status:
  href: /v1/consents/ff12171e-695d-4715-9d7e-8071f6086f6e/status
  scaStatus:
  href: /v1/consents/ff12171e-695d-4715-9d7e-8071f6086f6e/authorisations/7b1cdbfa6bcv4234b724edese5h66f8d
  consentResponseExample2_OAuth2:
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
  href: /v1/consents/ff12171e-695d-4715-9d7e-8071f6086f6e
  status:
  href: /v1/consents/ff12171e-695d-4715-9d7e-8071f6086f6e/status
  authorisationListExample:
  value:
  authorisationIds: - 4a6b838066834db4bebeace9fee04119
  startScaProcessResponseExampleRedirect:
  description: Response in case of Redirect approach.
  value:
  scaStatus: received
  authorisationId: ff12171e-695d-4715-9d7e-8071f6086f6e
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
  authorisationConfirmationResponseExample:
  description: Response of an authorisation confirmation request.
  value:
  scaStatus: finalised
  \_links:
  status:
  href: /v1/payments/domestic-transfer/65ccd26eb0904d8eb802b9ac3ca06fc4/status
  consentStatusResponseExample1:
  description: Response for a consent status request.
  value:
  consentStatus: valid
  consentsInformationResponseExample:
  description: Consent request on all account consent.
  value:
  access:
  availableAccounts: allAccounts
  recurringIndicator: true
  validUntil: '2023-12-15'
  frequencyPerDay: 4
  lastActionDate: '2024-01-15'
  consentStatus: valid
  consentsInformationResponseExampleDedicated:
  description: Consent request on dedicated account consent.
  value:
  access:
  accounts:
  iban: (XXXX)(XXX)143364354232
  bban: (XXX)143364354232
  msisdn: 3562540500
  currency: **currency**
  balances:
  iban: (XXXX)(XXX)143364354232
  bban: (XXX)143364354232
  msisdn: 3562540500
  currency: **currency**
  transactions:
  iban: (XXXX)(XXX)143364354232
  bban: (XXX)143364354232
  msisdn: 3562540500
  currency: **currency**
  additionalInformation:
  ownerName:
  iban: (XXXX)(XXX)143364354232
  bban: (XXX)143364354232
  msisdn: 3562540500
  currency: **currency**
  recurringIndicator: true
  validUntil: '2024-03-13'
  frequencyPerDay: 4
  lastActionDate: '2024-01-15'
  consentStatus: valid
  accountListExampleAllAccess:
  summary: Account list With Consent For Full Access
  description: Response in case of an example, where the consent has been given for all accounts with full access.
  value:
  accounts: - resourceId: 1350382300
  iban: (XXXX)(XXX)273965927769
  bban: (XXX)273965927769
  msisdn: 3562540500
  currency: **currency**
  ownerName: Placeholder Owner Name
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350382300
  balances:
  href: /v1/accounts/1350382300/balances
  transactions:
  href: /v1/accounts/1350382300/transactions - resourceId: 1350381300
  iban: (XXXX)(XXX)622656191562
  bban: (XXX)622656191562
  msisdn: 3562540500
  currency: **currency**
  ownerName: Placeholder Owner Name
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350381300
  balances:
  href: /v1/accounts/1350381300/balances
  transactions:
  href: /v1/accounts/1350381300/transactions
  accountListExampleNoBalanceNoTransactionNoOwnerName:
  summary: Account list With Consent With Limited Access
  description: Response in case of an example, where the consent has been given for all accounts without balance or transactions.
  value:
  accounts: - resourceId: 1350382300
  iban: (XXXX)(XXX)273965927769
  bban: (XXX)273965927769
  msisdn: 3562540500
  currency: **currency**
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350382300 - resourceId: 1350381300
  iban: (XXXX)(XXX)622656191562
  bban: (XXX)622656191562
  msisdn: 3562540500
  currency: **currency**
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350381300
  accountListExampleForDedicatedAccountAccess:
  summary: Account list With Consent For Dedicated Account Access
  description: Response in case of an example, where the consent has been given for a dedicated account.
  value:
  accounts: - resourceId: 1350382300
  iban: (XXXX)(XXX)273965927769
  bban: (XXX)273965927769
  msisdn: 3562540500
  currency: **currency**
  ownerName: Placeholder Owner Name
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350382300
  balances:
  href: /v1/accounts/1350382300/balances
  transactions:
  href: /v1/accounts/1350382300/transactions
  accountDetailsRegularAccount:
  description: Account details for a regular Account.
  value:
  account:
  resourceId: 1350382300
  iban: (XXXX)(XXX)273965927769
  bban: (XXX)273965927769
  msisdn: 3562540500
  currency: **currency**
  ownerName: Placeholder Owner Name
  name: Placeholder Name
  product: Placeholder Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Details
  \_links:
  account:
  href: /v1/accounts/1350382300
  balances:
  href: /v1/accounts/1350382300/balances
  transactions:
  href: /v1/accounts/1350382300/transactions
  accountDetailsMulticurrencyAccount:
  description: Account details for a multicurrency account.
  value:
  account:
  resourceId: 1350382300
  iban: (XXXX)(XXX)273965927769
  bban: (XXX)273965927769
  msisdn: 3562540600
  currency: XXX
  ownerName: Placeholder Owner Name
  name: Placeholder Name
  product: Placeholder Multicurrency Product
  cashAccountType: CACC
  status: enabled
  bic: Placeholder BIC
  details: Placeholder Multicurrency Details
  \_links:
  account:
  href: /v1/accounts/1350382300
  balances:
  href: /v1/accounts/1350382300/balances
  transactions:
  href: /v1/accounts/1350382300/transactions
  balancesExample1_RegularAccount:
  description: Response for a read balance request in case of a regular account.
  value:
  account:
  iban: (XXXX)(XXX)273965927769
  balances: - balanceAmount:
  currency: **currency**
  amount: '37355.83'
  balanceType: expected
  lastChangeDateTime: '2023-12-14T00:00:00Z'
  referenceDate: '2023-12-14' - balanceAmount:
  currency: **currency**
  amount: '25525.25'
  balanceType: interimAvailable
  lastChangeDateTime: '2023-12-14T00:00:00Z'

      balancesExample2_MulticurrencyAccount:
        description: |
          Response in case of a multicurrency account, where the ASPSP has delivered a link to the balance endpoint relative to the aggregated

          multicurrency account (aggregation level).
        value:
          account:
            iban: (XXXX)(XXX)736592739269
          balances:
            - balanceAmount:
                currency: USD
                amount: '37355.83'
              balanceType: expected
              lastChangeDateTime: '2023-12-14T00:00:00Z'
            - balanceAmount:
                currency: EUR
                amount: '1500.00'
              balanceType: interimAvailable
              referenceDate: '2023-12-14'
              lastChangeDateTime: '2023-12-14T00:00:00Z'
      transactionsExample1_RegularAccount_json:
        description: Response for a regular account transaction list.
        value:
          account:
            iban: 123253455697826
          transactions:
            booked:
              - transactionId: tr-142141
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '256.67'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                purposeCode: __purposeCode__
                bankTransactionCode: PMNT-IRCT-XBCT
                proprietaryBankTransactionCode: TRD1025
                remittanceInformationUnstructured: Purpose of Remittance
                remittanceInformationStructuredArray:
                  - reference: debtor reference
                    referenceType: DINV
                    referenceModel: '123'
                  - reference: creditor reference
                    referenceType: CDTR
                    referenceModel: '123'
              - transactionId: tr-141227
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '1250.00'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                purposeCode: __purposeCode__
                bankTransactionCode: PMNT-IRCT-XBCT
                proprietaryBankTransactionCode: TRD1025
                remittanceInformationUnstructured: Purpose of Remittance
            pending:
              - transactionId: tr-142140
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '-100.00'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                remittanceInformationUnstructured: Purpose of Remittance
            _links:
              account:
                href: /v1/accounts/1350381300
      transactionsExample2_RegularAccountWithBalance_json:
        description: Response for a regular account transaction list with balances.
        value:
          account:
            iban: 123253455697826
            balances:
              - balanceAmount:
                  amount: 25000
                  currency: __currency__
                balanceType: expected
                lastChangeDateTime: '2023-12-14T00:00:00Z'
              - balanceAmount:
                  amount: 50000
                  currency: __currency__
                balanceType: interimAvailable
                lastChangeDateTime: '2023-12-14T00:00:00Z'
          transactions:
            booked:
              - transactionId: tr-142141
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '256.67'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                purposeCode: __purposeCode__
                bankTransactionCode: PMNT-IRCT-XBCT
                proprietaryBankTransactionCode: TRD1025
                remittanceInformationUnstructured: Purpose of Remittance
                remittanceInformationStructuredArray:
                  - reference: debtor reference
                    referenceType: DINV
                    referenceModel: '123'
                  - reference: creditor reference
                    referenceType: CDTR
                    referenceModel: '123'
              - transactionId: tr-141227
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '1250.00'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                purposeCode: __purposeCode__
                bankTransactionCode: PMNT-IRCT-XBCT
                proprietaryBankTransactionCode: TRD1025
                remittanceInformationUnstructured: Purpose of Remittance
            pending:
              - transactionId: tr-142140
                creditorName: Placeholder Name
                creditorAccount:
                  iban: __preferredAccIdentifierAdditionalValue__
                debtorName: Placeholder Name
                debtorAccount:
                  iban: __preferredAccIdentifierValue__
                transactionAmount:
                  currency: __currency__
                  amount: '-100.00'
                bookingDate: __bookingDate__
                valueDate: __valueDate__
                remittanceInformationUnstructured: Purpose of Remittance
            _links:
              account:
                href: /v1/accounts/1350381300
      transactionsExample1_RegularAccount_json_MD:
        description: Response for a regular account transaction list.
        value:
          account:
            iban: MD21AAA000000022553456789
            currency: MDL
          transactions:
            booked:
              - transactionId: tr-142141
                creditorName: Jane Doe
                creditorAccount:
                  iban: MD21AAA000000022553456799
                transactionAmount:
                  currency: MDL
                  amount: '250.00'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: Purpose of Remittance
              - transactionId: tr-141227
                debtorName: John Smith
                debtorAccount:
                  iban: MD21AAA000000022553456739
                transactionAmount:
                  currency: MDL
                  amount: '1250.00'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: P2P
            pending:
              - transactionId: tr-142141
                creditorName: Jane Doe
                creditorAccount:
                  iban: MD21AAA000000022553456799
                transactionAmount:
                  currency: MDL
                  amount: '2800.00'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: Purpose of Remittance
            _links:
              account:
                href: /v1/accounts/1350381300
      transactionsExample2_RegularAccountWithBalance_json_MD:
        description: Response for a regular account transaction list with balances.
        value:
          account:
            iban: MD21AAA000000022553456789
            currency: MDL
            balances:
              - balanceAmount:
                  amount: '25000'
                  currency: MDL
                balanceType: expected
                lastChangeDateTime: '2024-12-14T00:00:00Z'
              - balanceAmount:
                  amount: '50000'
                  currency: MDL
                balanceType: interimAvailable
                lastChangeDateTime: '2024-12-14T00:00:00Z'
          transactions:
            booked:
              - transactionId: tr-142141
                creditorName: Jane Doe
                creditorAccount:
                  iban: MD21AAA000000022553456799
                transactionAmount:
                  currency: MDL
                  amount: '256.67'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: Purpose of Remittance
              - transactionId: tr-141227
                debtorName: John Smith
                debtorAccount:
                  iban: MD21AAA000000022553456739
                transactionAmount:
                  currency: MDL
                  amount: '1250.00'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: P2P
            pending:
              - transactionId: tr-142141
                creditorName: Jane Doe
                creditorAccount:
                  iban: MD21AAA000000022553456799
                transactionAmount:
                  currency: MDL
                  amount: '256.67'
                bookingDate: '2024-10-01'
                valueDate: '2024-10-01'
                remittanceInformationUnstructured: Purpose of Remittance
            _links:
              account:
                href: /v1/accounts/1350381300
      transactionDetailsExample:
        description: Example for transaction details.
        value:
          transactionsDetails:
            transactionId: tr-142141
            creditorName: Placeholder Name
            creditorAccount:
              iban: __preferredAccIdentifierAdditionalValue__
            debtorName: Placeholder Name
            debtorAccount:
              iban: __preferredAccIdentifierValue__
            transactionAmount:
              currency: __currency__
              amount: '256.67'
            bookingDate: __bookingDate__
            valueDate: __valueDate__
            purposeCode: __purposeCode__
            bankTransactionCode: PMNT-IRCT-XBCT
            proprietaryBankTransactionCode: TRD1025
            remittanceInformationUnstructured: Purpose of Remittance
            remittanceInformationStructuredArray:
              - reference: debtor reference
                referenceType: DINV
                referenceModel: '123'
              - reference: creditor reference
                referenceType: CDTR
                referenceModel: '123'

  requestBodies:
  consents:
  description: |
  Request body for a consents request.
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/globalConsents' - $ref: '#/components/schemas/dedicatedConsents' - $ref: '#/components/schemas/bankOfferedConsents'
  examples:
  Consent Request on Dedicated Accounts:
  $ref: '#/components/examples/consentsExample_DedicatedAccounts'
  Consent on Account List of Available Accounts:
  $ref: '#/components/examples/consentsExample_AccountList'
  Bank Offered Consent:
  $ref: '#/components/examples/consentsExample_without_Accounts'
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
  ASPSP-Notification-Support:
  description: |
  true if the ASPSP supports resource status notification services.

          false if the ASPSP supports resource status notification in general, but not
          for the current request.


          Not used, if resource status notification services are generally not supported
          by the ASPSP.


          Shall be supported if the ASPSP supports resource status notification
          services.
        schema:
          type: boolean
        required: false
      ASPSP-Notification-Content:
        description: |
          The string has the form

          status=X1, …, Xn

          where Xi is one of the constants SCA, PROCESS, LAST and where constants are
          not repeated.

          The usage of the constants supports the following semantics

          SCA - Notification on every change of the scaStatus attribute for all related
          authorisation processes is provided by the ASPSP for the related resource.

          PROCESS - Notification on all changes of consentStatus or transactionStatus
          attributes is provided by the ASPSP for the related resource

          LAST - Notification on the last consentStatus or transactionStatus as
          available in the XS2A interface is provided by the ASPSP for the related
          resource.

          This field must be provided if the ASPSP-Notification-Support=true. The ASPSP
          might consider the notification content as preferred by the TPP, but can also
          respond independently of the preferred request
        schema:
          type: string
        required: false
      Content-Type:
        schema:
          type: string
        required: false
        example: application/json
      Date:
        description: Date and time when the request was made (RFC 7231).
        required: true
        example: Wed, 11 Sep 2024 12:34:56 GMT
        schema:
          type: string
          format: date-time
      Content-Type_required:
        schema:
          type: string
        required: true
        example: application/json

  responses:
  CREATED_201_Consents:
  description: Created
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  ASPSP-SCA-Approach:
  $ref: '#/components/headers/ASPSP-SCA-Approach'
  ASPSP-Notification-Support:
  $ref: '#/components/headers/ASPSP-Notification-Support'
  ASPSP-Notification-Content:
  $ref: '#/components/headers/ASPSP-Notification-Content'
  Content-Type:
  $ref: '#/components/headers/Content-Type'
  Date:
  $ref: '#/components/headers/Date'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/consentsResponse-201'
  examples:
  Response in case of a redirect approach:
  $ref: '#/components/examples/consentResponseExampleRedirect'
  Response in case of the OAuth2 approach with an implicit generated authorisation resource:
  $ref: '#/components/examples/consentResponseExample2_OAuth2'
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
  OK_200_Authorisations:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/authorisations'
  examples:
  Example:
  $ref: '#/components/examples/authorisationListExample'
  CREATED_201_StartScaProcessAIS:
  description: Created
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  ASPSP-SCA-Approach:
  $ref: '#/components/headers/ASPSP-SCA-Approach'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/startScaprocessResponse'
  examples:
  Response in case of the Redirect approach:
  $ref: '#/components/examples/startScaProcessResponseExampleRedirect'
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
  OK_200_UpdateConsentPsuData:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  ASPSP-SCA-Approach:
  $ref: '#/components/headers/ASPSP-SCA-Approach'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/updatePsuIdentificationResponse' - $ref: '#/components/schemas/updatePsuAuthenticationResponse' - $ref: '#/components/schemas/selectPsuAuthenticationMethodResponse' - $ref: '#/components/schemas/scaStatusResponse' - $ref: '#/components/schemas/authorisationConfirmationResponse'
  examples:
  Authorisation confirmation:
  $ref: '#/components/examples/authorisationConfirmationResponseExample'
  OK_200_ConsentStatus:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/consentStatusResponse-200'
  examples:
  Example:
  $ref: '#/components/examples/consentStatusResponseExample1'
  OK_200_ConsentInformation:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/consentInformationResponse-200_json' - $ref: '#/components/schemas/consentInformationResponseMD-200_json'
  examples:
  Example with all account consent:
  $ref: '#/components/examples/consentsInformationResponseExample'
  Example with dedicated account consent:
  $ref: '#/components/examples/consentsInformationResponseExampleDedicated'
  NO_CONTENT_204_Consents:
  description: No Content
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content: {}
  OK_200_AccountList:
  description: |-
  OK. In case, no account is accessible, the ASPSP shall return an empty array.
  As this is also considered a positive response, the Response code must still
  be 200.
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/accountList'
  examples:
  Example 1:
  $ref: '#/components/examples/accountListExampleAllAccess'
  Example 2:
  $ref: '#/components/examples/accountListExampleNoBalanceNoTransactionNoOwnerName'
  Example 3:
  $ref: '#/components/examples/accountListExampleForDedicatedAccountAccess'
  OK_200_AccountDetails:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  type: object
  required: - account
  properties:
  account:
  $ref: '#/components/schemas/accountDetails'
  examples:
  Regular Account:
  $ref: '#/components/examples/accountDetailsRegularAccount'
  Multicurrency Account:
  $ref: '#/components/examples/accountDetailsMulticurrencyAccount'
  OK_200_Balances:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/readAccountBalanceResponse-200'
  examples:
  'Example 1: Regular Account':
  $ref: '#/components/examples/balancesExample1_RegularAccount'
  'Example 2: Multicurrency Account':
  $ref: '#/components/examples/balancesExample2_MulticurrencyAccount'
  OK_200_AccountsTransactions:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  Content-Type:
  $ref: '#/components/headers/Content-Type_required'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/transactionsResponse-200_json' - $ref: '#/components/schemas/transactionsResponse-200-md_json'
  examples:
  Example_1:
  $ref: '#/components/examples/transactionsExample1_RegularAccount_json'
  Example_2:
  $ref: '#/components/examples/transactionsExample2_RegularAccountWithBalance_json'
  Example_a:
  $ref: '#/components/examples/transactionsExample1_RegularAccount_json_MD'
  Example_b:
  $ref: '#/components/examples/transactionsExample2_RegularAccountWithBalance_json_MD'
  OK_200_TransactionDetails:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  type: object
  required: - transactionsDetails
  properties:
  transactionsDetails:
  $ref: '#/components/schemas/transactions'
  examples:
  Example:
  $ref: '#/components/examples/transactionDetailsExample'

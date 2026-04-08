openapi: 3.0.1
info:
title: Payment Initiation Service (PIS)
version: 1.4.0_2025-09-04
description: "# Overview\n\nInitiate a Payment (PIS)\n\nTo initiate a payment you need to initiate this by calling the respective endpoint. The next step is that the PSU needs to authorize the payment and a SCA process is started. After successfully finishing the SCA, the payment will be initiated through us and no further steps are necessary through you. The only remaining thing is to read the status of the payment initiation.\n\n**Reference**: This specification is based on NextGenPSD2 v1.3.13.\n\nExample flow for successfully initiating a payment:\n `mermaid\n  sequenceDiagram\n      actor PSU\n      participant TPP\n      participant XS2A_API\n      participant IAM\n      PSU->>TPP: 1. Request payment\n      activate PSU\n      activate TPP\n      TPP->>XS2A_API: 2. Initiates Payment <br> POST /v1/{payment-service}/{payment-product} <br> \"paymentDetails\"\n      activate XS2A_API\n      Note over XS2A_API: transactionStatus:\"RCVD\"\n      XS2A_API-->>TPP: 3. Payment Received <br> \"paymentId\", \"_links\":[\"startAuthorisation\"]\n      deactivate XS2A_API\n      TPP->>XS2A_API: 4. Start Authorization <br> POST /v1/{payment-service}/{payment-product}/{paymentId}/authorisations \n      activate XS2A_API\n      Note over XS2A_API: scaStatus:\"received\"\n      XS2A_API-->>TPP: 5. Authorization Received <br> \"authorisationId\", \"_links\":[\"confirmation\",\"scaOauth\"]\n      deactivate XS2A_API\n      TPP-->>PSU: 6. Redirect to scaOAuth link\n      deactivate TPP\n      PSU->>IAM: 7. PSU Authorization\n      activate IAM\n      Note over PSU,IAM: OAuth 2.0 SCA\n      Note over IAM: scaStatus: \"psuAuthenticated\"\n      IAM-->>PSU: 8. Redirect to Redirect-URI\n      deactivate IAM\n      PSU->>TPP: 9. Redirect to Redirect-URI\n      activate TPP\n      TPP->>XS2A_API: 10. Update Authorization <br> PUT v1/{payment-service}/{payment-product}/{paymentId}/authorisations/ {authorisation-id} <br> \"confirmationCode\"\n      activate XS2A_API\n      Note over XS2A_API: Execution of Payment \n      Note over XS2A_API: scaStatus: \"finalised\"\n      XS2A_API-->>TPP: 11. Payment Executed <br> Return scaStatus:\"finalised\"\n      deactivate XS2A_API\n      TPP-->>PSU: 12. Show success page\n      deactivate PSU\n      deactivate TPP\n      PSU->>TPP: 13. Get Payment details\n      activate TPP\n      activate PSU\n      TPP->>XS2A_API: 14. GET v1/{payment-service}/{payment-product}/{paymentId}/status \n      activate XS2A_API\n      XS2A_API-->>TPP: 15. Return transactionStatus:\"ACCC\"\n      deactivate XS2A_API\n      TPP->>XS2A_API: 16. GET v1/{payment-service}/{payment-product}/{paymentId} \n      activate XS2A_API\n      XS2A_API-->>TPP: 17. Return paymentDetails, transactionStatus\n      deactivate XS2A_API\n      TPP-->>PSU: 18. Show result page\n      deactivate TPP\n      deactivate PSU\n  `\n \n\n# Version history \n\n## \U0001F4DD Documentation \n\n### September 25, 2024 - Payment initiation improvements\n- for cross-border payments, **_chargeBearer_** and **_creditorAgent_** are set as `required` properties, while **_priorityFlag_** is removed (this payment type does not consider this property) \n- improved cross-border payment example: **_payments/cross-border-credit-transfer_** \n- added example for bulk payments: **_bulk-payments/domestic-transfer_** \n \n### January 16, 2025 - PSU-ID-Type\n- Added details of the supported values to the PSU-ID-Type header.\n\n### March 04, 2025 - confirmationCode, header adjustments\n- _scaAuthenticationData_ renamed to **_confirmationCode_** in the request body of the _Update PSU data for payment initiation_ endpoint.\nIt is still possible to use _scaAuthenticationData_ for backward compatibility.\n- Added `Date` as mandatory header for all PIS requests\n- Made `Digest`, `Signature` and `TPP-Signature-Certificate` mandatory headers\n- Adjusted the error responses schema:\n - made `tppMessages.text` mandatory \n - made `tppMessages.path` mandatory for POST Payment Initiate, GET Payment Dtails and GET Payment Status\n \n\n\n## \U0001F4BB API\n\n### September 30, 2024 - version 1.7.1\n- for _Get payment information_ request, the use of **_BearerAuthOAuth_** header is set to optional\n"
license:
name: Creative Commons Attribution 4.0 International Public License
url: https://creativecommons.org/licenses/by/4.0/
contact:
name: The Berlin Group - A European Standards Initiative
url: https://www.berlin-group.org/
email: info@berlin-group.org
servers:

- url: https://sandbox-host
  description: Sandbox server
  security:
- {}
  tags:
- name: Payment Initiation Service (PIS)
  description: >
  The component for Payment Initiation Service (PIS) offers the following

      services:
        * Initiation and update of a payment request
        * Status information of a payment

  externalDocs:
  description: >
  Full Documentation of NextGenPSD2 Access to Account Interoperability

      Framework

      (General Introduction Paper, Operational Rules, Implementation Guidelines)

  url: https://www.berlin-group.org/nextgenpsd2-downloads
  paths:
  /v1/{payment-service}/{payment-product}:
  post:
  summary: Payment initiation request
  description: "This method is used to initiate a payment at the ASPSP.\n\n\nThere are the following **payment products**:\n\n - Payment products with payment information in _JSON_ format:\n - **_domestic-transfer_**\n - **_cross-border-credit-transfers_**\n\nFurthermore the request body depends on the **payment-service**:\n \* **_payments_**: A single payment initiation request.\n \* **_bulk-payments_**: A collection of several payment initiation requests. \n\nThis is the first step in the API to initiate the related payment.\n \n## Single and multilevel SCA Processes\n\nThe payment initiation requests are independent from the need of one or\nmultilevel SCA processing, i.e. independent from the number of authorisations needed\nfor the execution of payments. But the response messages are specific to either one SCA processing or multilevel SCA processing. \n\n\nFor payment initiation with multilevel SCA, this specification requires an\nexplicit start of the authorisation, i.e. links directly associated with SCA processing like 'scaRedirect' or 'scaOAuth' cannot be contained in the response message of a Payment Initiation Request for a payment, where multiple authorisations are needed. \n\nAlso if any data is needed for the next action, like selecting an SCA method is not supported in the response, since all starts of the multiple authorisations are fully equal. \n\nIn these cases, first an authorisation sub-resource has to be generated following the 'startAuthorisation' link.\n"
  x-codeSamples: - lang: cURL
  label: domestic-transfer cURL
  source: >
  curl --location '(ENTER BASEURL HERE)/v1/payments/domestic-transfer' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --header 'Content-Type: application/json' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE) \

            --data '{
              "endToEndIdentification": "d14c3e75-8a2f-4e93-b3ca-ec4fd2128b9e",
              "debtorName": "Placeholder",
              "debtorAccount": {
                "__preferredAccIdentifierKey__": '__preferredAccIdentifierValue__'
              },
              debtorAddress{
                "streetName": "My address"
                "townName": "__city__"
                "country": "__country__"
              },
              "instructedAmount": {
                "currency": "__currency__",
                "amount": "123.00"
              },
              "creditorAccount": {
                "__preferredAccIdentifierKey__": '__preferredAccIdentifierAdditionalValue__'
              },
              "creditorName": "Merchant123",
              "creditorAddress": {
                "streetName": "My address"
                "townName": "__city__"
              },
              "purposeCode": "__purposeCode__",
              "remittanceInformationUnstructured": "Purpose of remittance",
              "remittanceInformationStructuredArray": [
                {
                  "reference": "debtor reference",
                  "referenceType": "DINV",
                  "referenceModel": "123"
                },
                {
                  "reference": "creditor reference",
                  "referenceType": "CDTR",
                  "referenceModel": "123"
                }
              ],
              "requestedExecutionDate": __requestedExecutionDate__,
              "priorityFlag": "NORM"
            }'
        operationId: initiatePayment
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/Content-Type'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_mandatory'
        - $ref: '#/components/parameters/PSU-Device-ID'
        - $ref: '#/components/parameters/PSU-Device-Name'
        - $ref: '#/components/parameters/PSU-Geo-Location_optional'
        - $ref: '#/components/parameters/PSU-ID'
        - $ref: '#/components/parameters/PSU-ID-Type'
        - $ref: '#/components/parameters/PSU-Corporate-ID'
        - $ref: '#/components/parameters/PSU-Corporate-ID-Type'
        - $ref: '#/components/parameters/consentId_HEADER_optional'
        - $ref: '#/components/parameters/TPP-Redirect-Preferred'
        - $ref: '#/components/parameters/TPP-Decoupled-Preferred'
        - $ref: '#/components/parameters/TPP-Redirect-URI'
        - $ref: '#/components/parameters/TPP-Nok-Redirect-URI'
        - $ref: '#/components/parameters/TPP-Explicit-Authorisation-Preferred'
        - $ref: '#/components/parameters/TPP-Rejection-NoFunds-Preferred'
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
        requestBody:
          $ref: '#/components/requestBodies/paymentInitiation'
        responses:
          201:
            $ref: '#/components/responses/CREATED_201_PaymentInitiation'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS_PATH'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS_PATH'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS_PATH'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS_PATH'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS_PATH'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS_PATH'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'

  /v1/{payment-service}/{payment-product}/{paymentId}/authorisations:
  post:
  summary: Start the authorisation process for a payment initiation
  description: >
  Create an authorisation sub-resource and start the authorisation process.

          The message might in addition transmit authentication and authorisation related data.

          This method is iterated n times for a n times SCA authorisation in a corporate context, each creating an own authorisation sub-endpoint for the corresponding PSU authorising the transaction.

          The ASPSP might make the usage of this access method unnecessary in case of only one SCA process needed, since the related authorisation resource might be automatically created by the ASPSP after the submission of the payment data with the first POST payments/{payment-product} call.

          The start authorisation process is a process which is needed for creating a new authorisation or cancellation sub-resource.


          This applies in the following scenarios:

            * The ASPSP has indicated with a 'startAuthorisation' hyperlink in the preceding Payment
              initiation response that an explicit start of the authorisation process is needed by the TPP.
              The 'startAuthorisation' hyperlink can transport more information about data which needs to be
              uploaded by using the extended forms:
              * 'startAuthorisationWithPsuIdentification'
              * 'startAuthorisationWithPsuAuthentication'
              * 'startAuthorisationWithEncryptedPsuAuthentication'
              * 'startAuthorisationWithAuthentciationMethodSelection'
            * The related payment initiation cannot yet be executed since a multilevel SCA is mandated.
            * The ASPSP has indicated with a 'startAuthorisation' hyperlink in the preceding
              Payment cancellation response that an explicit start of the authorisation process is needed by the TPP.
              The 'startAuthorisation' hyperlink can transport more information about data which needs to be uploaded
              by using the extended forms as indicated above.
            * The related payment cancellation request cannot be applied yet since a multilevel SCA is mandate for
              executing the cancellation.
        operationId: startPaymentAuthorisation
        x-codeSamples:
        - lang: cURL
          label: domestic-transfer cURL
          source: >
            curl --location '(REPLACE BASEURL HERE)/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)/authorisations' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'TPP-Redirect-Preferred: true' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/PSU-ID'
        - $ref: '#/components/parameters/PSU-ID-Type'
        - $ref: '#/components/parameters/PSU-Corporate-ID'
        - $ref: '#/components/parameters/PSU-Corporate-ID-Type'
        - $ref: '#/components/parameters/TPP-Redirect-Preferred'
        - $ref: '#/components/parameters/TPP-Decoupled-Preferred'
        - $ref: '#/components/parameters/TPP-Redirect-URI'
        - $ref: '#/components/parameters/TPP-Nok-Redirect-URI'
        - $ref: '#/components/parameters/TPP-Notification-URI'
        - $ref: '#/components/parameters/TPP-Notification-Content-Preferred'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_optional'
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
          201:
            $ref: '#/components/responses/CREATED_201_StartScaProcessPIS'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'
      get:
        summary: Get payment initiation authorisation sub-resources request
        description: >
          Read a list of all authorisation subresources IDs which have been created.

          This function returns an array of hyperlinks to all generated authorisation

          sub-resources.
        operationId: getPaymentInitiationAuthorisation
        x-codeSamples:
        - lang: cURL
          label: domestic-transfer cURL
          source: >
            curl --location '(REPLACE BASEURL HERE)/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)/authorisations' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_optional'
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
          200:
            $ref: '#/components/responses/OK_200_Authorisations'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'

  /v1/{payment-service}/{payment-product}/{paymentId}/authorisations/{authorisationId}:
  put:
  summary: Update PSU data for payment initiation
  description: >
  This methods updates PSU data on the authorisation resource if needed.

          Independently from the SCA Approach it supports e.g. the selection of the authentication method and a non-SCA PSU authentication.



          There are several possible update PSU data requests in the context of

          payment initiation services needed, which depends on the SCA approach:



          * Redirect SCA Approach:
            A specific update PSU data request is applicable for
              * the selection of authentication methods, before choosing the actual SCA approach.
          * Decoupled SCA Approach:
            A specific update PSU data request is only applicable for
            * adding the PSU identification, if not provided yet in the payment initiation request or the account information consent request, or if no OAuth2 access token is used, or
            * the selection of authentication methods.

          The SCA Approach might depend on the chosen SCA method.

          For that reason, the following possible Update PSU data request can apply to all SCA approaches:



          * Select an SCA method in case of several SCA methods are available for the

          customer.



          There are the following request types on this access path:
            * Update PSU identification
            * Update PSU authentication
            * Select PSU authorization method
              WARNING: This method needs a reduced header,
              therefore many optional elements are not present.
              Maybe in a later version the access path will change.
            * Transaction authorisation
              WARNING: This method needs a reduced header,
              therefore many optional elements are not present.
              Maybe in a later version the access path will change.
        x-codeSamples:
        - lang: cURL
          label: domestic-transfer cURL
          source: >
            curl

            --location --request PUT '(REPLACE BASEURL HERE)/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)/authorisations/REPLACE AUTHORISATIONID HERE' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --header 'Content-Type: application/json' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE) \

            --data '{
              "confirmationCode": "(REPLACE GENERATED TOKEN HERE)"
            }'
        operationId: updatePaymentPsuData
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
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
        - $ref: '#/components/parameters/PSU-IP-Address_optional'
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
          200:
            $ref: '#/components/responses/OK_200_UpdatePsuData'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'
      get:
        summary: Read the SCA status of the payment authorisation
        description: >
          This method returns the SCA status of a payment initiation's authorisation sub-resource.
        operationId: getPaymentInitiationScaStatus
        x-codeSamples:
        - lang: cURL
          label: domestic-transfer cURL
          source: >
            curl --location '(REPLACE BASEURL HERE)/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)/authorisations/(REPLACE AUTHORISATIONID HERE)' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
        - $ref: '#/components/parameters/authorisationId'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_optional'
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
          200:
            $ref: '#/components/responses/OK_200_ScaStatus'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'

  /v1/{payment-service}/{payment-product}/{paymentId}/status:
  get:
  summary: Payment initiation status request
  description: Check the transaction status of a payment initiation.
  operationId: getPaymentInitiationStatus
  x-codeSamples: - lang: cURL
  label: domestic-transfer cURL
  source: >
  curl --location '(REPLACE BASEURL HERE)/apis/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)/status' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_dynamic'
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
          200:
            $ref: '#/components/responses/OK_200_PaymentInitiationStatus'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS_PATH'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS_PATH'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS_PATH'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS_PATH'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS_PATH'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS_PATH'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'

  /v1/{payment-service}/{payment-product}/{paymentId}:
  get:
  summary: Get payment information
  description: Returns the content of a payment object
  operationId: getPaymentInformation
  x-codeSamples: - lang: cURL
  label: domestic-transfer cURL
  source: >
  curl --location '(REPLACE BASEURL HERE)/v1/payments/domestic-transfer/(REPLACE PAYMENTID HERE)' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        - lang: cURL
          label: cross-border-credit-transfer cURL
          source: >
            curl --location '(REPLACE BASEURL HERE)/v1/payments/cross-border-credit-transfer/(REPLACE PAYMENTID HERE)' \

            --header 'X-Request-ID: 4fb90a0a-ccf9-45f5-b3bb-0a027ab11187' \

            --header 'PSU-IP-Address: 10.150.15.1' \

            --header 'Date: Wed, 11 Sep 2024 12:34:56 GMT' \

            --header 'Digest: SHA256=KDUgmV/H0usna3yHPoXYteCFd1l32SWhOI45NTD0Ri4=' \

            --header 'Signature: keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=DTrust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))' \

            --header 'TPP-Signature-Certificate:  (INSERT eIDAS CERTIFICATE OF TPP HERE)' \

            --cert    (INSERT CERTIFICATE.crt HERE) \

            --key     (INSERT CERTIFICATE.key HERE)
        tags:
        - Payment Initiation Service (PIS)
        security:
        - {}
        - BearerAuthOAuth: []
        parameters:
        - $ref: '#/components/parameters/paymentService'
        - $ref: '#/components/parameters/paymentProduct'
        - $ref: '#/components/parameters/paymentId'
        - $ref: '#/components/parameters/X-Request-ID'
        - $ref: '#/components/parameters/Date'
        - $ref: '#/components/parameters/Digest'
        - $ref: '#/components/parameters/Signature'
        - $ref: '#/components/parameters/TPP-Signature-Certificate'
        - $ref: '#/components/parameters/PSU-IP-Address_dynamic'
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
          200:
            $ref: '#/components/responses/OK_200_PaymentInitiationInformation'
          400:
            $ref: '#/components/responses/BAD_REQUEST_400_PIS_PATH'
          401:
            $ref: '#/components/responses/UNAUTHORIZED_401_PIS_PATH'
          403:
            $ref: '#/components/responses/FORBIDDEN_403_PIS_PATH'
          404:
            $ref: '#/components/responses/NOT_FOUND_404_PIS_PATH'
          405:
            $ref: '#/components/responses/METHOD_NOT_ALLOWED_405_PIS_PATH'
          406:
            $ref: '#/components/responses/NOT_ACCEPTABLE_406_PIS'
          408:
            $ref: '#/components/responses/REQUEST_TIMEOUT_408_PIS'
          409:
            $ref: '#/components/responses/CONFLICT_409_PIS_PATH'
          415:
            $ref: '#/components/responses/UNSUPPORTED_MEDIA_TYPE_415_PIS'
          429:
            $ref: '#/components/responses/TOO_MANY_REQUESTS_429_PIS'
          500:
            $ref: '#/components/responses/INTERNAL_SERVER_ERROR_500_PIS'
          503:
            $ref: '#/components/responses/SERVICE_UNAVAILABLE_503_PIS'

  components:
  securitySchemes:
  BearerAuthOAuth:
  description: >
  Bearer Token.

          Is contained only, if an OAuth2 based authentication was performed in a

          pre-step or

          an OAuth2 based SCA was performed in a preceding AIS service in the same

          session.
        type: http
        scheme: bearer

  parameters:
  paymentService:
  name: payment-service
  in: path
  description: >
  Payment service:

          Possible values are:

          * payments

          * bulk-payments
        required: true
        schema:
          type: string
          enum:
          - payments
          - bulk-payments
      paymentProduct:
        name: payment-product
        in: path
        description: >
          The ASPSP will publish which of the payment products/endpoints will be

          supported.



          The following payment products are supported:
            - domestic-transfer
            - cross-border-credit-transfers
        required: true
        schema:
          type: string
          enum:
          - domestic-transfer
          - cross-border-credit-transfers
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
        description: >-
          Is contained if and only if the "Signature" element is contained in the header

          of the request.
        schema:
          type: string
        required: false
        example: SHA-256=hl1/Eps8BEQW58FJhDApwJXjGY4nr1ArGDHIT25vq6A=
      Signature:
        name: Signature
        in: header
        description: >
          A signature of the request by the TPP on application level. This might be mandated by ASPSP.
        schema:
          type: string
        required: false
        example: >
          keyId="SN=9FA1,CA=CN=D-TRUST%20CA%202-1%202015,O=D-Trust%20GmbH,C=DE",algorithm="rsa-sha256", headers="digest date x-request-id", signature="Base64(RSA-SHA256(signing string))"
      TPP-Signature-Certificate:
        name: TPP-Signature-Certificate
        in: header
        description: >
          The certificate used for signing the request, in base64 encoding.

          Must be contained if a signature is contained.
        schema:
          type: string
          format: byte
        required: false
      PSU-IP-Address_mandatory:
        name: PSU-IP-Address
        in: header
        description: >
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
        description: >
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
        description: >
          Generic name/model of the device from which the PSU connects.

          In case of a call without PSU's presence, the TPP shall use the value ***no-psu-involved***.
        schema:
          type: string
        required: false
        example: Samsung A32
      PSU-Geo-Location_optional:
        name: PSU-Geo-Location
        in: header
        description: >
          The forwarded Geo Location of the corresponding http request between PSU and

          TPP if available.
        schema:
          type: string
          pattern: GEO:-?[0-9]{1,2}\.[0-9]{6};-?[0-9]{1,3}\.[0-9]{6}
        required: false
        example: GEO:52.506931;13.144558
      PSU-ID:
        name: PSU-ID
        in: header
        description: >
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
        description: >2

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
        description: >
          Might be mandated in the ASPSP's documentation. Only used in a corporate

          context.
        schema:
          type: string
        required: false
      PSU-Corporate-ID-Type:
        name: PSU-Corporate-ID-Type
        in: header
        description: >
          Might be mandated in the ASPSP's documentation. Only used in a corporate

          context.
        schema:
          type: string
        required: false
      consentId_HEADER_optional:
        name: Consent-ID
        in: header
        description: >
          This data element may be contained, if the payment initiation transaction is

          part of a session, i.e. combined AIS/PIS service.


          This then contains the consentId of the related AIS consent, which was

          performed prior to this payment initiation.
        required: false
        schema:
          $ref: '#/components/schemas/consentId'
      TPP-Redirect-Preferred:
        name: TPP-Redirect-Preferred
        in: header
        description: >
          If it equals "true", the TPP prefers a redirect SCA approach.
        schema:
          type: boolean
        required: false
      TPP-Decoupled-Preferred:
        name: TPP-Decoupled-Preferred
        in: header
        description: >
          If it equals "true", the TPP prefers a decoupled SCA approach.
        schema:
          type: boolean
        required: false
      TPP-Redirect-URI:
        name: TPP-Redirect-URI
        in: header
        description: >
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
        description: >
          If this URI is contained, the TPP is asking to redirect the transaction flow

          to this address instead of the TPP-Redirect-URI in case of a negative result of the redirect SCA method. This might be ignored by the ASPSP.
        schema:
          type: string
          format: uri
        required: false
      TPP-Explicit-Authorisation-Preferred:
        name: TPP-Explicit-Authorisation-Preferred
        in: header
        description: >
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
      TPP-Rejection-NoFunds-Preferred:
        name: TPP-Rejection-NoFunds-Preferred
        in: header
        description: >
          If it equals "true" then the TPP prefers a rejection of the payment initiation

          in case the ASPSP is


          providing an integrated confirmation of funds request an the result of this is

          that not sufficient


          funds are available.



          If it equals "false" then the TPP prefers that the ASPSP is dealing with the

          payment initiation like


          in the ASPSPs online channel, potentially waiting for a certain time period

          for funds to arrive to initiate the payment.



          This parameter might be ignored by the ASPSP.
        schema:
          type: boolean
        required: false
      TPP-Brand-Logging-Information:
        name: TPP-Brand-Logging-Information
        in: header
        description: >
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
        description: >
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
        description: >
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
        description: >
          The forwarded IP Port header field consists of the corresponding HTTP request

          IP Port field between PSU and TPP, if available.
        schema:
          type: string
        required: false
        example: 1234
      PSU-Accept:
        name: PSU-Accept
        in: header
        description: >
          The forwarded IP Accept header fields consist of the corresponding HTTP

          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Charset:
        name: PSU-Accept-Charset
        in: header
        description: >
          The forwarded IP Accept header fields consist of the corresponding HTTP

          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Encoding:
        name: PSU-Accept-Encoding
        in: header
        description: >
          The forwarded IP Accept header fields consist of the corresponding HTTP

          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-Accept-Language:
        name: PSU-Accept-Language
        in: header
        description: >
          The forwarded IP Accept header fields consist of the corresponding HTTP

          request Accept header fields between PSU and TPP, if available.
        schema:
          type: string
        required: false
      PSU-User-Agent:
        name: PSU-User-Agent
        in: header
        description: >
          The forwarded Agent header field of the HTTP request between PSU and TPP, if

          available.
        schema:
          type: string
        required: false
      PSU-Http-Method:
        name: PSU-Http-Method
        in: header
        description: >
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
      paymentId:
        name: paymentId
        in: path
        description: Resource identification of the generated payment initiation resource.
        required: true
        schema:
          $ref: '#/components/schemas/paymentId'
      PSU-IP-Address_optional:
        name: PSU-IP-Address
        in: header
        description: >
          The forwarded IP Address header field consists of the corresponding http

          request IP Address field between PSU and TPP.
        schema:
          type: string
          format: ipv4
        required: false
        example: 192.168.8.78
      PSU-Device-ID_optional:
        name: PSU-Device-ID
        in: header
        description: >
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
      PSU-Geo-Location:
        name: PSU-Geo-Location
        in: header
        description: >
          The forwarded Geo Location of the corresponding http request between PSU and

          TPP if available.
        schema:
          type: string
          pattern: GEO:-?[0-9]{1,2}\.[0-9]{6};-?[0-9]{1,3}\.[0-9]{6}
        required: false
        example: GEO:52.506931;13.144558
      authorisationId:
        name: authorisationId
        in: path
        description: Resource identification of the related SCA.
        required: true
        schema:
          $ref: '#/components/schemas/authorisationId'
      PSU-IP-Address_dynamic:
        name: PSU-IP-Address
        in: header
        description: >
          The forwarded IP Address header field consists of the corresponding http

          request IP Address field between PSU and TPP.
        schema:
          type: string
          format: ipv4
        required: false
        example: 192.168.8.78
      paymentServiceCancellation:
        name: payment-service
        in: path
        description: >
          Payment service:


          Possible values are:

          * payments

          * periodic-payments
        required: true
        schema:
          type: string
          enum:
          - payments
          - periodic-payments

  schemas:
  consentId:
  description: >
  ID of the corresponding consent object as returned by an account information

          consent request.
        type: string
      endToEndIdentification:
        description: >
          A unique reference assigned by the initiating party to a specific payment transaction.


          This identifier is passed unchanged throughout the entire payment chain and can be used for tracking and reconciliation purposes by all involved parties.


          It also serves as a way of detecting duplicate payments.
        type: string
        maxLength: 35
        example: d14c3e75-8a2f-4e93-b3ca-ec4fd7128b9e
      iban:
        type: string
        description: IBAN of an account.
        pattern: '[A-Z]{2,2}[0-9]{2,2}[a-zA-Z0-9]{1,30}'
        example: FR7612345987650123456789014
      bban:
        description: "Basic Bank Account Number (BBAN) Identifier.\n\nThis data element can be used in the body of the consent request.\n  Message for retrieving account access consent from this account. This\n  data elements is used for payment accounts which have no IBAN.\n  ISO20022: Basic Bank Account Number (BBAN). \n  \n  Identifier used nationally by financial institutions, i.e., in individual countries, \n  generally as part of a National Account Numbering Scheme(s), \n  which uniquely identifies the account of a customer.\n"
        type: string
        pattern: '[a-zA-Z0-9]{1,30}'
        example: BARC12345612345678
      msisdn:
        type: string
        maxLength: 35
        description: Mobile phone number.
        example: +49 170 1234567
      otherType:
        description: >-
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
        description: >
          ISO 4217 Alpha 3 currency code.
        type: string
        pattern: '[A-Z]{3}'
        example: EUR
      cashAccountType:
        description: >
          ExternalCashAccountType1Code from ISO 20022.
        type: string
      accountReference:
        description: >
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
      amountValue:
        description: >
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
        pattern: -?[0-9]{1,14}(\.[0-9]{1,3})?
        example: 5877.78
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
          amount: 123
      bicfi:
        description: >
          BICFI
        type: string
        pattern: '[A-Z]{6,6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3,3}){0,1}'
        example: AAAADEBBXXX
      creditorAgentName:
        description: Creditor agent name.
        type: string
        maxLength: 140
        example: Creditor Agent Name
      creditorName:
        description: Creditor name.
        type: string
        maxLength: 70
        example: Creditor Name
      countryCode:
        description: ISO 3166 ALPHA2 country code.
        type: string
        pattern: '[A-Z]{2}'
        example: SE
      address:
        type: object
        properties:
          streetName:
            type: string
            maxLength: 70
          buildingNumber:
            type: string
          townName:
            type: string
          postCode:
            type: string
          country:
            $ref: '#/components/schemas/countryCode'
        example:
          streetName: rue blue
          buildingnNumber: 89
          townName: Denars
          postCode: 75000
          country: FR
      purposeCode:
        description: >
          **The complete list of available purpose codes must be obtained from the bank.**



          Purpose codes are unique identifiers assigned to various international transactions, enabling banks and financial institutions to classify and process remittances accurately.
        type: number
      remittanceInformationUnstructured:
        description: >
          Unstructured remittance information.
        type: string
        maxLength: 140
        example: Ref Number Merchant
      remittanceInformationStructured:
        description: >
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
        description: >
          Array of structured remittance information.
        type: array
        items:
          $ref: '#/components/schemas/remittanceInformationStructured'
      priorityFlag:
        description: >
          This data element is containing information about the priority of the payment and when it will be processed.

            - NORM is a standard payment with normal priority
            - HIGH is a standard Payment with high priority
            - ICT is an urgent Payment (Instant payment)
        type: string
        enum:
        - NORM
        - HIGH
        - ICT
        example: NORM
      paymentInitiation_json:
        description: "Generic Body for a payment initiation via JSON.\n\n\nThis generic JSON body can be used to represent valid payment initiations for\nthe following JSON based payment product, \n\nwhich where defined in the Implementation Guidelines:\n\n  * domestic-transfers\n  * cross-border-credit-transfers\n\nFor the convenience of the implementer additional which are already predefined\nin the Implementation Guidelines \n\nare included (but commented in source code), such that an ASPSP may add them\neasily.\n\n\nTake care: Since the format is intended to fit for all payment products \n\nthere are additional conditions which are NOT covered by this specification.\n\nPlease check the Implementation Guidelines for details.\n\n\n\nThe following data element are depending on the actual payment product\navailable (in source code):\n          \n <table style=\"width:100%\">\n <tr><th>Data Element</th><th>SCT EU Core</th><th>SCT INST EU Core</th><th>Target2 Paym. Core</th><th>Cross Border CT Core</th></tr>\n <tr><td> optional</td> <td>optional</td> <td>optional</td> <td>n.a.</td> </tr>\n <tr><td>instructionIdentification</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>debtorName</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>debtorAccount</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>debtorId</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>ultimateDebtor</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>instructedAmount</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>currencyOfTransfer</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>exchangeRateInformation</td> <td>n.a.</td> <td>n.a.</td><td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorAccount</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>creditorAgent</td> <td>optional</td> <td>optional</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>creditorAgentName</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorName</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>creditorId</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorAddress</td>optional</td> <td>optional</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>creditorNameAndAddress</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>ultimateCreditor</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>purposeCode</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>chargeBearer</td> <td>n.a.</td> <td>n.a.</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>serviceLevel</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a. </td> </tr>\n <tr><td>remittanceInformationUnstructured</td> <td>optional</td> <td>optional</td> <td> optional</td> <td>optional</td> </tr>\n <tr><td>remittanceInformationUnstructuredArray</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>remittanceInformationStructured</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>remittanceInformationStructuredArray</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>requestedExecutionDate</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>requestedExecutionTime</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n    </td></tr>\n  </table>\n  \nIMPORTANT: In this API definition the following holds:\n  *  All data elements mentioned above are defined, but some of them are commented, \n    i.e. they are only visible in the source code and can be used by uncommenting them.\n  * Data elements which are mandatory in the table above for all payment products \n    are set to be mandatory in this specification.\n  * Data elements which are indicated in the table above as n.a. for all payment products are commented in the source code.\n  * Data elements which are indicated to be option, conditional or mandatory for at least one payment product \n    in the table above are set to be optional in the s specification except the case where all are defined to be mandatory. \n  * Data element which are indicated to be n.a. can be used by the ASPS if needed. \n    In this case uncomment the the related lines in the source code.\n  * If one uses this data types for some payment products he has to ensure that the used data type is \n    valid according to the underlying payment product, e.g. by some appropriate validations.\n"
        type: object
        required:
        - endToEndIdentification
        - debtorAccount
        - instructedAmount
        - creditorAccount
        - creditorName
        - priorityFlag
        properties:
          endToEndIdentification:
            $ref: '#/components/schemas/endToEndIdentification'
          debtorName:
            type: string
            maxLength: 35
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          instructedAmount:
            $ref: '#/components/schemas/amount'
          creditorAccount:
            $ref: '#/components/schemas/accountReference'
          creditorAgent:
            $ref: '#/components/schemas/bicfi'
          creditorAgentName:
            $ref: '#/components/schemas/creditorAgentName'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAddress:
            $ref: '#/components/schemas/address'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          remittanceInformationStructuredArray:
            $ref: '#/components/schemas/remittanceInformationStructuredArray'
          requestedExecutionDate:
            type: string
            maxLength: 35
          priorityFlag:
            $ref: '#/components/schemas/priorityFlag'
      paymentInitiationAccountReferenceMD:
        description: >
          IBAN of the payment account
        type: object
        properties:
          iban:
            type: string
            description: IBAN of an account.
            example: MD21AAA000000022553456789
      creditorId:
        description: Identification of Creditors, e.g. a SEPA Creditor ID.
        type: string
        maxLength: 35
        example: Creditor Id 5678
      creditorCtryOfRes:
        description: >
          Beneficiary’s  country of residence code
        type: string
        pattern: '[A-Z]{2,2}'
        example: MD
      accountReferenceMD:
        description: >
          IBAN of the payment account.
        type: object
        required:
        - iban
        properties:
          iban:
            type: string
            description: IBAN of an account.
            example: MD21AAA000000022553456789
      instructionPriority:
        description: >
          This data element is containing information about the type of transfer, indicating the transfer regime.

            - NORM (normal) for regular payments
            - URGT (urgent) for urgent payments
        type: string
        enum:
        - NORM
        - URGT
        example: NORM
      accountReferenceMD_instant:
        description: >
          An alias to access a payment account via a registered mobile phone number (MSISDN)
        type: object
        required:
        - msisdn
        properties:
          msisdn:
            type: string
            maxLength: 35
            description: Mobile phone number.
            example: +49 170 1234567
      purposeCodeInstantMD:
        description: >
          The TCC code, according to the NBM (National Bank of Moldova) documentation. For now, only TCC **201** will be used for P2P payments.
        type: number
      addressCross:
        type: object
        required:
        - country
        properties:
          streetName:
            type: string
            maxLength: 70
          buildingNumber:
            type: string
          townName:
            type: string
          postCode:
            type: string
          country:
            $ref: '#/components/schemas/countryCode'
        example:
          streetName: rue blue
          buildingnNumber: 89
          townName: Denars
          postCode: 75000
          country: FR
      chargeBearer:
        description: Charge Bearer. ChargeBearerType1Code from ISO20022.
        type: string
        enum:
        - DEBT
        - CRED
        - SHAR
        - SLEV
      crossPaymentInitiation_json:
        description: >
          Generic Body for a payment initiation via JSON.



          This generic JSON body can be used to represent valid payment initiations for

          the following JSON based payment product,


          which where defined in the Implementation Guidelines:

            * domestic-transfers
            * cross-border-credit-transfers

          For the convenience of the implementer additional which are already predefined

          in the Implementation Guidelines


          are included (but commented in source code), such that an ASPSP may add them

          easily.



          Take care: Since the format is intended to fit for all payment products


          there are additional conditions which are NOT covered by this specification.


          Please check the Implementation Guidelines for details.
        type: object
        required:
        - endToEndIdentification
        - debtorAccount
        - instructedAmount
        - creditorAccount
        - creditorAddress
        - creditorName
        - creditorAgent
        - chargeBearer
        properties:
          endToEndIdentification:
            $ref: '#/components/schemas/endToEndIdentification'
          debtorName:
            type: string
            maxLength: 35
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          instructedAmount:
            $ref: '#/components/schemas/amount'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAddress:
            $ref: '#/components/schemas/addressCross'
          creditorAccount:
            $ref: '#/components/schemas/accountReference'
          creditorAgent:
            $ref: '#/components/schemas/bicfi'
          creditorAgentName:
            $ref: '#/components/schemas/creditorAgentName'
          chargeBearer:
            $ref: '#/components/schemas/chargeBearer'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          remittanceInformationStructuredArray:
            $ref: '#/components/schemas/remittanceInformationStructuredArray'
          requestedExecutionDate:
            type: string
            maxLength: 35
      startDate:
        description: >
          The first applicable day of execution starting from this date is the first

          payment.
        type: string
        format: date
      endDate:
        description: >
          The last applicable day of execution.

          If not given, it is an infinite standing order.
        type: string
        format: date
      executionRule:
        description: >
          "following" or "preceding" supported as values.


          This data attribute defines the behaviour when recurring payment dates falls

          on a weekend or bank holiday.


          The payment is then executed either the "preceding" or "following" working

          day.


          ASPSP might reject the request due to the communicated value, if rules in

          Online-Banking are not supporting


          this execution rule.
        type: string
        enum:
        - following
        - preceding
      frequencyCode:
        description: >
          The following codes from the "EventFrequency7Code" of ISO 20022 are supported:

          - "Daily"

          - "Weekly"

          - "EveryTwoWeeks"

          - "Monthly"

          - "EveryTwoMonths"

          - "Quarterly"

          - "SemiAnnual"

          - "Annual"

          - "MonthlyVariable"
        type: string
        enum:
        - Daily
        - Weekly
        - EveryTwoWeeks
        - Monthly
        - EveryTwoMonths
        - Quarterly
        - SemiAnnual
        - Annual
        - MonthlyVariable
      dayOfExecution:
        description: >
          Day of execution as string.


          This string consists of up two characters.


          31 is ultimo of the month.
        type: string
        maxLength: 2
        enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 9
        - 10
        - 11
        - 12
        - 13
        - 14
        - 15
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 26
        - 27
        - 28
        - 29
        - 30
        - 31
      monthsOfExecution:
        description: >
          The format is following the regular expression \d{1,2}.


          The array is restricted to 11 entries.


          The values contained in the array entries shall all be different and the

          maximum value of one entry is 12.


          This attribute is contained if and only if the frequency equals

          "MonthlyVariable".


          Example: An execution on January, April and October each year is addressed by

          ["1", "4", "10"].
        type: array
        maxItems: 11
        items:
          type: string
          maxLength: 2
          enum:
          - 1
          - 2
          - 3
          - 4
          - 5
          - 6
          - 7
          - 8
          - 9
          - 10
          - 11
          - 12
      batchBookingPreferred:
        description: >
          If this element equals 'true', the PSU prefers only one booking entry.


          If this element equals 'false', the PSU prefers individual booking of all

          contained individual transactions.



          The ASPSP will follow this preference according to contracts agreed on with

          the PSU.
        type: boolean
        example: false
      paymentInitiationBulkElement_json:
        description: "Generic body for a bulk payment initiation entry.\n\n\nThe bulk entry type is a type which follows the JSON formats for the supported\nproducts for single payments\n\nexcluding the data elements (if supported):\n  * debtorAccount\n  * requestedExecutionDate,\n  * requestedExecutionTime.\nThese data elements may not be contained in any bulk entry.\n\n\nThis data object can be used to represent valid bulk payment initiations entry\nfor the following JSON based payment product, \n\nwhich where defined in the Implementation Guidelines:\n\n  * sepa-credit-transfers\n  * instant-sepa-credit-transfers\n  * target-2-payments\n  * cross-border-credit-transfers\n\nFor the convenience of the implementer additional which are already predefined\nin the Implementation Guidelines \n\nare included (but commented in source code), such that an ASPSP may add them\neasily.\n\n\nTake care: Since the format is intended to fit for all payment products \n\nthere are additional conditions which are NOT covered by this specification.\n\nPlease check the Implementation Guidelines for details.\n\n\n\nThe following data element are depending on the actual payment product\navailable (in source code):\n          \n <table style=\"width:100%\">\n <tr><th>Data Element</th><th>SCT EU Core</th><th>SCT INST EU Core</th><th>Target2 Paym. Core</th><th>Cross Border CT Core</th></tr>\n <tr><td> optional</td> <td>optional</td> <td>optional</td> <td>n.a.</td> </tr>\n <tr><td>instructionIdentification</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>debtorName</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>debtorId</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>ultimateDebtor</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>instructedAmount</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>currencyOfTransfer</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>exchangeRateInformation</td> <td>n.a.</td> <td>n.a.</td><td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorAccount</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>creditorAgent</td> <td>optional</td> <td>optional</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>creditorAgentName</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorName</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> <td>mandatory</td> </tr>\n <tr><td>creditorId</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>creditorAddress</td>optional</td> <td>optional</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>creditorNameAndAddress</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>ultimateCreditor</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>purposeCode</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>chargeBearer</td> <td>n.a.</td> <td>n.a.</td> <td>optional</td> <td>conditional </td> </tr>\n <tr><td>serviceLevel</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a. </td> </tr>\n <tr><td>remittanceInformationUnstructured</td> <td>optional</td> <td>optional</td> <td> optional</td> <td>optional</td> </tr>\n <tr><td>remittanceInformationUnstructuredArray</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>remittanceInformationStructured</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n <tr><td>remittanceInformationStructuredArray</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> <td>n.a.</td> </tr>\n    </td></tr>\n  </table>\n  \nIMPORTANT: In this API definition the following holds:\n  *  All data elements mentioned above are defined, but some of them are commented, \n    i.e. they are only visible in the source code and can be used by uncommenting them.\n  * Data elements which are mandatory in the table above for all payment products \n    are set to be mandatory in this specification.\n  * Data elements which are indicated in the table above as n.a. for all payment products are commented in the source code.\n  * Data elements which are indicated to be option, conditional or mandatory for at least one payment product \n    in the table above are set to be optional in the s specification except the case where all are defined to be mandatory. \n  * Data element which are indicated to be n.a. can be used by the ASPS if needed. \n    In this case uncomment the the related lines in the source code.\n  * If one uses this data types for some payment products he has to ensure that the used data type is \n    valid according to the underlying payment product, e.g. by some appropriate validations.\n"
        type: object
        required:
        - endToEndIdentification
        - instructedAmount
        - creditorAccount
        - creditorName
        - priorityFlag
        properties:
          endToEndIdentification:
            $ref: '#/components/schemas/endToEndIdentification'
          instructedAmount:
            $ref: '#/components/schemas/amount'
          creditorAccount:
            $ref: '#/components/schemas/accountReference'
          creditorAgent:
            $ref: '#/components/schemas/bicfi'
          creditorAgentName:
            $ref: '#/components/schemas/creditorAgentName'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAddress:
            $ref: '#/components/schemas/address'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          priorityFlag:
            $ref: '#/components/schemas/priorityFlag'
      bulkPaymentInitiation_json:
        description: >
          Generic Body for a bulk payment initiation via JSON.


          paymentInformationId is contained in code but commented since it is n.a.

          and not all ASPSP are able to support this field now.

          In a later version the field will be mandatory.
        type: object
        required:
        - payments
        - debtorAccount
        properties:
          batchBookingPreferred:
            $ref: '#/components/schemas/batchBookingPreferred'
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          requestedExecutionDate:
            type: string
            format: date
          requestedExecutionTime:
            type: string
            format: date-time
          payments:
            description: >
              A list of generic JSON bodies payment initiations for bulk payments via

              JSON.



              Note: Some fields from single payments do not occur in a bulk payment

              element
            type: array
            items:
              $ref: '#/components/schemas/paymentInitiationBulkElement_json'
      transactionStatus:
        description: "The transaction status is filled with codes of the ISO 20022 data table:\n- 'ACCC': 'AcceptedSettlementCompleted' -\n  Settlement on the creditor's account has been completed.\n- 'ACCP': 'AcceptedCustomerProfile' - \n  Preceding check of technical validation was successful. \n  Customer profile check was also successful.\n- 'ACSC': 'AcceptedSettlementCompleted' - \n  Settlement on the debtor�s account has been completed.\n  \n  **Usage:** this can be used by the first agent to report to the debtor that the transaction has been completed. \n  \n  **Warning:** this status is provided for transaction status reasons, not for financial information. \n  It can only be used after bilateral agreement.\n- 'ACSP': 'AcceptedSettlementInProcess' - \n  All preceding checks such as technical validation and customer profile were successful and therefore the payment initiation has been accepted for execution.\n- 'ACTC': 'AcceptedTechnicalValidation' - \n  Authentication and syntactical and semantical validation are successful.\n- 'ACWC': 'AcceptedWithChange' - \n  Instruction is accepted but a change will be made, such as date or remittance not sent.\n- 'ACWP': 'AcceptedWithoutPosting' - \n  Payment instruction included in the credit transfer is accepted without being posted to the creditor customer�s account.\n- 'RCVD': 'Received' - \n  Payment initiation has been received by the receiving agent.\n- 'PDNG': 'Pending' - \n  Payment initiation or individual transaction included in the payment initiation is pending. \n  Further checks and status update will be performed.\n- 'RJCT': 'Rejected' - \n  Payment initiation or individual transaction included in the payment initiation has been rejected.\n- 'CANC': 'Cancelled'\n  Payment initiation has been cancelled before execution\n- 'ACFC': 'AcceptedFundsChecked' -\n  Preceding check of technical validation and customer profile was successful and an automatic funds check was positive .\n- 'PATC': 'PartiallyAcceptedTechnical'\n  Correct The payment initiation needs multiple authentications, where some but not yet all have been performed. Syntactical and semantical validations are successful.\n- 'PART': 'PartiallyAccepted' -\n  A number of transactions have been accepted, whereas another number of transactions have not yet achieved 'accepted' status.\n  Remark: This code may be used only in case of bulk payments. It is only used in a situation where all mandated authorisations have been applied, but some payments have been rejected.\n- 'PART_PDNG': 'PartiallyPending' -\n  SSome orders were rejected, the rest are accepted for further processing by CBS\n  Remark: This code may be used only in case of bulk payments.\n- 'SDNG': 'SendingToCBS' -\n  Some of the child-payments within the bulk payment are still being in process of sending to the CBS\n  Remark: This code may be used only in case of bulk payments.\n  \n"
        type: string
        enum:
        - ACCC
        - ACCP
        - ACSC
        - ACSP
        - ACTC
        - ACWC
        - ACWP
        - RCVD
        - PDNG
        - RJCT
        - CANC
        - ACFC
        - PATC
        - PART
        - PART_PDNG
        - SDNG
        example: ACCP
      paymentId:
        description: Resource identification of the generated payment initiation resource.
        type: string
        example: 9629301ef15943b6b74499c9eb2071c5
      transactionFeeIndicator:
        description: >
          If equals 'true', the transaction will involve specific transaction cost as

          shown by the ASPSP in


          their public price list or as agreed between ASPSP and PSU.


          If equals 'false', the transaction will not involve additional specific

          transaction costs to the PSU unless the fee amount is given specifically in

          the data elements transactionFees and/or currencyConversionFees.


          If this data element is not used, there is no information about transaction

          fees unless the fee amount is given explicitly in the data element

          transactionFees and/or currencyConversionFees.
        type: boolean
      authenticationType:
        description: >
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
        description: >
          An identification provided by the ASPSP for the later identification of the

          authentication method selection.
        type: string
        maxLength: 35
        example: myAuthenticationID
      authenticationObject:
        description: >
          Authentication object.
        type: object
        required:
        - authenticationType
        - authenticationMethodId
        properties:
          authenticationType:
            $ref: '#/components/schemas/authenticationType'
          authenticationVersion:
            description: >
              Depending on the "authenticationType".


              This version can be used by differentiating authentication tools used

              within performing OTP generation in the same authentication type.


              This version can be referred to in the ASPSP?s documentation.
            type: string
          authenticationMethodId:
            $ref: '#/components/schemas/authenticationMethodId'
          name:
            description: >
              This is the name of the authentication method defined by the PSU in the

              Online Banking frontend of the ASPSP.


              Alternatively this could be a description provided by the ASPSP like "SMS

              OTP on phone +49160 xxxxx 28".


              This name shall be used by the TPP when presenting a list of

              authentication methods to the PSU, if available.
            type: string
            example: SMS OTP on phone +49160 xxxxx 28
          explanation:
            description: >
              Detailed information about the SCA method for the PSU.
            type: string
            example: Detailed information about the SCA method for the PSU.
      scaMethods:
        description: >
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
        description: >
          It is contained in addition to the data element 'chosenScaMethod' if challenge

          data is needed for SCA.


          In rare cases this attribute is also used in the context of the

          'startAuthorisationWithPsuAuthentication' link.
        type: object
        properties:
          image:
            type: string
            format: byte
            description: >
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
            description: >-
              The format type of the OTP to be typed in. The admitted values are

              "characters" or "integer".
            enum:
            - characters
            - integer
          additionalInformation:
            type: string
            description: >
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
      _linksPaymentInitiation:
        description: >
          A list of hyperlinks to be recognised by the TPP.


          The actual hyperlinks used in the response depend on the dynamical decisions

          of the ASPSP when


          processing the request.



          **Remark:** All links can be relative or full links, to be decided by the

          ASPSP.



          Type of links admitted in this response, (further links might be added for

          ASPSP defined extensions):



          * 'scaRedirect':
            In case of an SCA Redirect Approach, the ASPSP is transmitting the link to which to redirect the PSU browser.
          * 'scaOAuth':
            In case of a SCA OAuth2 Approach, the ASPSP is transmitting the URI where the configuration of the Authorisation
            Server can be retrieved. The configuration follows the OAuth 2.0 Authorisation Server Metadata specification.
          * 'confirmation':
            Might be added by the ASPSP if either the "scaRedirect" or "scaOAuth" hyperlink is returned
            in the same response message.
            This hyperlink defines the URL to the resource which needs to be updated with
              * a confirmation code as retrieved after the plain redirect authentication process with the ASPSP authentication server or
              * an access token as retrieved by submitting an authorization code after the integrated OAuth based authentication process with the ASPSP authentication server.
          * 'startAuthorisation':
            In case, where an explicit start of the transaction authorisation is needed, but no more data needs to be updated
            (no authentication method to be selected, no PSU identification nor PSU authentication data to be uploaded).
          * 'startAuthorisationWithPsuIdentification':
            The link to the authorisation end-point, where the authorisation sub-resource has to be generated while
            uploading the PSU identification data.
          * 'startAuthorisationWithPsuAuthentication':
            The link to the authorisation end-point, where the authorisation sub-resource has to be generated while
            uploading the PSU authentication data.
            * 'startAuthorisationWithEncryptedPsuAuthentication':
              Same as startAuthorisactionWithPsuAuthentication where the authentication data need to be encrypted on
              application layer in uploading.
          * 'startAuthorisationWithAuthenticationMethodSelection':
            The link to the authorisation end-point, where the authorisation sub-resource has to be generated while
            selecting the authentication method.
            This link is contained under exactly the same conditions as the data element "scaMethods"
          * 'startAuthorisationWithTransactionAuthorisation':
            The link to the authorisation end-point, where the authorisation sub-resource has to be generated while
            authorising the transaction e.g. by uploading an OTP received by SMS.
          * 'self':
            The link to the payment initiation resource created by this request.
            This link can be used to retrieve the resource data.
          * 'status':
            The link to retrieve the transaction status of the payment initiation.
          * 'scaStatus':
            The link to retrieve the scaStatus of the corresponding authorisation sub-resource.
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
        example:
          scaRedirect:
            href: https://www.testbank.com/asdfasdfasdf
          self:
            href: /psd2/v1/payments/domestic-transfer/65ccd26eb0904d8eb802b9ac3ca06fc4
      psuMessageText:
        description: Text to be displayed to the PSU.
        type: string
        maxLength: 500
      tppMessageCategory:
        description: Category of the TPP message category.
        type: string
        enum:
        - ERROR
        - WARNING
      MessageCode201PaymentInitiation:
        description: Message codes for HTTP Codes 201 to a Payment Initiation Request.
        type: string
        enum:
        - WARNING
        - BENEFICIARY_WHITELISTING_REQUIRED
      tppMessageText:
        description: Additional explaining text to the TPP.
        type: string
        maxLength: 500
      tppMessage201PaymentInitiation:
        type: object
        required:
        - category
        - code
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode201PaymentInitiation'
          path:
            type: string
          text:
            $ref: '#/components/schemas/tppMessageText'
      paymentInitiationRequestResponse-201:
        description: Body of the response for a successful payment initiation request.
        type: object
        required:
        - transactionStatus
        - paymentId
        - _links
        properties:
          transactionStatus:
            $ref: '#/components/schemas/transactionStatus'
          paymentId:
            $ref: '#/components/schemas/paymentId'
          transactionFees:
            $ref: '#/components/schemas/amount'
          currencyConversionFee:
            $ref: '#/components/schemas/amount'
          estimatedTotalAmount:
            $ref: '#/components/schemas/amount'
          estimatedInterbankSettlementAmount:
            $ref: '#/components/schemas/amount'
          transactionFeeIndicator:
            $ref: '#/components/schemas/transactionFeeIndicator'
          scaMethods:
            $ref: '#/components/schemas/scaMethods'
          chosenScaMethod:
            $ref: '#/components/schemas/authenticationObject'
          challengeData:
            $ref: '#/components/schemas/challengeData'
          _links:
            $ref: '#/components/schemas/_linksPaymentInitiation'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage201PaymentInitiation'
      MessageCode400_PIS:
        description: Message codes defined for PIS for HTTP Error code 400 (BAD_REQUEST).
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
        - PAYMENT_FAILED
        - EXECUTION_DATE_INVALID
      tppMessagePath:
        description: Exact error location
        type: string
      tppMessage400_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode400_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      _linksAll:
        description: >
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
      Error400_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 400.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage400_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppErrorTitle:
        description: >
          Short human readable description of error type.

          Could be in local language.

          To be provided by ASPSPs.
        type: string
        maxLength: 70
      tppErrorDetail:
        description: >
          Detailed human readable text specific to this instance of the error.


          XPath might be used to point to the issue generating the error in addition.


          Remark for Future: In future, a dedicated field might be introduced for the

          XPath.
        type: string
        maxLength: 500
      Error400_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 400 for PIS.
        type: object
        required:
        - type
        - code
        - text
        - path
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
              Detailed human readable text specific to this instance of the error.


              XPath might be used to point to the issue generating the error in

              addition.


              Remark for Future: In future, a dedicated field might be introduced for

              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode400_PIS'
          additionalErrors:
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode400_PIS'
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
      tppMessage401_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode401_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error401_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage401_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error401_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 401 for PIS.
        type: object
        required:
        - type
        - code
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
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
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode401_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode403_PIS:
        description: >-
          Message codes defined defined for PIS for PIS for HTTP Error code 403

          (FORBIDDEN).
        type: string
        enum:
        - CONSENT_UNKNOWN
        - SERVICE_BLOCKED
        - RESOURCE_UNKNOWN
        - RESOURCE_EXPIRED
        - PRODUCT_INVALID
      tppMessage403_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode403_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error403_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 403.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage403_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error403_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 403 for PIS.
        type: object
        required:
        - type
        - code
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
              Detailed human readable text specific to this instance of the error.


              XPath might be used to point to the issue generating the error in

              addition.


              Remark for Future: In future, a dedicated field might be introduced for

              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode403_PIS'
          additionalErrors:
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode403_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode404_PIS:
        description: Message codes defined for PIS for HTTP Error code 404 (NOT FOUND).
        type: string
        enum:
        - RESOURCE_UNKNOWN
        - PRODUCT_UNKNOWN
      tppMessage404_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode404_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error404_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 404.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage404_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error404_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 404 for PIS.
        type: object
        required:
        - type
        - code
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
              Detailed human readable text specific to this instance of the error.


              XPath might be used to point to the issue generating the error in

              addition.


              Remark for Future: In future, a dedicated field might be introduced for

              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode404_PIS'
          additionalErrors:
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode404_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode405_PIS:
        description: >-
          Message codes defined for payment cancelations PIS for HTTP Error code 405

          (METHOD NOT ALLOWED).
        type: string
        enum:
        - SERVICE_INVALID
      tppMessage405_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode405_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error405_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 405.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage405_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
      Error405_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 405 for PIS.
        type: object
        required:
        - type
        - code
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
              Detailed human readable text specific to this instance of the error.


              XPath might be used to point to the issue generating the error in

              addition.


              Remark for Future: In future, a dedicated field might be introduced for

              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode405_PIS'
          additionalErrors:
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode405_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      MessageCode409_PIS:
        description: Message codes defined for PIS for HTTP Error code 409 (CONFLICT).
        type: string
        enum:
        - STATUS_INVALID
      tppMessage409_PIS_PATH:
        type: object
        required:
        - category
        - code
        - text
        - path
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode409_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error409_NG_PIS_PATH:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 409.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage409_PIS_PATH'
          _links:
            $ref: '#/components/schemas/_linksAll'
        example:
        - category: ERROR
          code: STATUS_INVALID
          text: additional text information of the ASPSP up to 500 characters
      Error409_PIS:
        description: >
          Standardised definition of reporting error information according to [RFC7807]

          in case of a HTTP error code 409 for PIS.
        type: object
        required:
        - type
        - code
        properties:
          type:
            description: >
              A URI reference [RFC3986] that identifies the problem type.

              Remark For Future: These URI will be provided by NextGenPSD2 in future.
            type: string
            format: uri
            maxLength: 70
          title:
            description: >
              Short human readable description of error type.

              Could be in local language.

              To be provided by ASPSPs.
            type: string
            maxLength: 70
          detail:
            description: >
              Detailed human readable text specific to this instance of the error.


              XPath might be used to point to the issue generating the error in

              addition.


              Remark for Future: In future, a dedicated field might be introduced for

              the XPath.
            type: string
            maxLength: 500
          code:
            $ref: '#/components/schemas/MessageCode409_PIS'
          additionalErrors:
            description: >
              Array of Error Information Blocks.


              Might be used if more than one error is to be communicated
            type: array
            items:
              description: >-
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
                  $ref: '#/components/schemas/MessageCode409_PIS'
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
      tppMessage400_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode400_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error400_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 400.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage400_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppMessage401_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode401_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error401_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 401.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage401_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppMessage403_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode403_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error403_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 403.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage403_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppMessage404_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode404_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error404_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 404.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage404_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppMessage405_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode405_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error405_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 405.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage405_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
      tppMessage409_PIS:
        type: object
        required:
        - category
        - code
        - text
        properties:
          category:
            $ref: '#/components/schemas/tppMessageCategory'
          code:
            $ref: '#/components/schemas/MessageCode409_PIS'
          path:
            $ref: '#/components/schemas/tppMessagePath'
          text:
            $ref: '#/components/schemas/tppMessageText'
      Error409_NG_PIS:
        description: >
          NextGenPSD2 specific definition of reporting error information in case of a

          HTTP error code 409.
        type: object
        properties:
          tppMessages:
            type: array
            items:
              $ref: '#/components/schemas/tppMessage409_PIS'
          _links:
            $ref: '#/components/schemas/_linksAll'
        example:
        - category: ERROR
          code: STATUS_INVALID
          text: additional text information of the ASPSP up to 500 characters
      scaStatus:
        description: >
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
        description: >
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
            description: >
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
        description: >
          Content of the body of a Update PSU authentication request


          Password subfield is used.
        type: object
        required:
        - psuData
        properties:
          psuData:
            $ref: '#/components/schemas/psuData'
      selectPsuAuthenticationMethod:
        description: >
          Content of the body of a Select PSU authentication method request
        type: object
        required:
        - authenticationMethodId
        properties:
          authenticationMethodId:
            $ref: '#/components/schemas/authenticationMethodId'
      confirmationCode:
        description: >
          SCA authentication data, depending on the chosen authentication method.

          If the data is binary, then it is base64 encoded.
        type: string
      transactionAuthorisation:
        description: >
          Content of the body of a transaction authorisation request
        type: object
        required:
        - confirmationCode
        properties:
          confirmationCode:
            $ref: '#/components/schemas/confirmationCode'
      authorisationConfirmation:
        description: >
          Content of the body of an authorisation confirmation request
        type: object
        required:
        - confirmationCode
        properties:
          confirmationCode:
            description: >-
              Confirmation code provided by the TPP to complete the redirect-based

              SCA process.


              In case of an OAuth2-based redirect approach, this field contains the

              access token (JWT or reference token) issued by the ASPSP's authorisation

              server after the PSU has successfully authenticated.


              This access token serves as proof of SCA completion and is used to

              confirm the authorisation sub-resource.
            type: string
      _linksUpdatePsuIdentification:
        description: >
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
        description: >
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
        description: >
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
        description: >-
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
        description: >
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
        description: >
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
      fundsAvailable:
        description: >
          Equals true if sufficient funds are available at the time of the request,

          false otherwise.



          This data element is allways contained in a confirmation of funds response.



          This data element is contained in a payment status response,


          if supported by the ASPSP, if a funds check has been performed and


          if the transactionStatus is "ACTC", "ACWC" or "ACCP".
        type: boolean
      accountOwner:
        description: >
          Identifies a Person that acts as an account owner
        type: object
        required:
        - name
        properties:
          name:
            description: Account owner name
            type: string
            maxLength: 70
          role:
            description: >
              The following proprietary codes are used:
                * "owner",
                * "legalRepresentative",
                * "authorisedUser"
            type: string
            maxLength: 35
      _linksPaymentInitiationStatus:
        description: >
          Should refer to next steps if the problem can be resolved via the interface

          e.g. for re-submission of credentials.
        type: object
        additionalProperties:
          $ref: '#/components/schemas/hrefType'
        example:
          scaRedirect:
            href: https://www.testbank.com/asdfasdfasdf
          self:
            href: /psd2/v1/payments/domestic-transfer/9629301ef15943b6b74499c9eb2071c5
      paymentInitiationStatusResponse-200_json:
        description: >-
          Body of the response for a successful payment initiation status request in

          case of an JSON based endpoint. *Remark:* If the PSU does not complete a

          required SCA within the required timeframe the payment resource's status must

          be set to "RJCT". Particularly, if a multi-level-SCA is required and the

          number of successful SCAs during the required timeframe is insufficient, the

          status must also be set to "RJCT".
        type: object
        required:
        - transactionStatus
        properties:
          transactionStatus:
            $ref: '#/components/schemas/transactionStatus'
          fundsAvailable:
            $ref: '#/components/schemas/fundsAvailable'
          psuMessage:
            $ref: '#/components/schemas/psuMessageText'
          ownerNames:
            description: >
              List of owner names. Should only be delivered after successful SCA. Could

              be restricted to the current PSU by the ASPSP.
            type: array
            items:
              $ref: '#/components/schemas/accountOwner'
          psuName:
            description: >
              Name of the PSU. In case of a corporate account, this might be the person

              acting on behalf of the corporate.
            type: string
            maxLength: 140
          _links:
            $ref: '#/components/schemas/_linksPaymentInitiationStatus'
          tppMessage:
            type: array
            items:
              $ref: '#/components/schemas/tppMessageGeneric'
            description: Messages to the TPP on operational issues.
      paymentInitiationWithStatusResponse:
        description: >
          Generic JSON response body consistion of the corresponding payment initiation

          JSON body together with an optional transaction status field.
        type: object
        required:
        - debtorAccount
        - instructedAmount
        - creditorAccount
        - creditorName
        - priorityFlag
        properties:
          debtorName:
            type: string
            maxLength: 35
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          instructedAmount:
            $ref: '#/components/schemas/amount'
          creditorAccount:
            $ref: '#/components/schemas/accountReference'
          creditorAgent:
            $ref: '#/components/schemas/bicfi'
          creditorAgentName:
            $ref: '#/components/schemas/creditorAgentName'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAddress:
            $ref: '#/components/schemas/address'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          remittanceInformationStructuredArray:
            $ref: '#/components/schemas/remittanceInformationStructuredArray'
          requestedExecutionDate:
            type: string
            maxLength: 35
          priorityFlag:
            $ref: '#/components/schemas/priorityFlag'
          transactionStatus:
            $ref: '#/components/schemas/transactionStatus'
          tppMessage:
            type: array
            items:
              $ref: '#/components/schemas/tppMessageGeneric'
            description: Messages to the TPP on operational issues.
      debtorName:
        description: Debtor name.
        type: string
        maxLength: 70
        example: Debtor Name
      paymentInitiationWithStatusResponse_cross-border-credit-transfers:
        description: >
          Generic JSON response body consistion of the corresponding payment initiation

          JSON body together with an optional transaction status field.
        type: object
        required:
        - debtorAccount
        - instructedAmount
        - creditorAccount
        - creditorName
        properties:
          paymentId:
            $ref: '#/components/schemas/paymentId'
          transactionStatus:
            $ref: '#/components/schemas/transactionStatus'
          debtorName:
            $ref: '#/components/schemas/debtorName'
          debtorAccount:
            $ref: '#/components/schemas/accountReferenceMD'
          instructedAmount:
            $ref: '#/components/schemas/amount'
          creditorAccount:
            $ref: '#/components/schemas/accountReferenceMD'
          creditorName:
            $ref: '#/components/schemas/creditorName'
          creditorAddress:
            $ref: '#/components/schemas/address'
          remittanceInformationUnstructured:
            $ref: '#/components/schemas/remittanceInformationUnstructured'
          purposeCode:
            $ref: '#/components/schemas/purposeCode'
          chargeBearer:
            $ref: '#/components/schemas/chargeBearer'
          transactionFees:
            $ref: '#/components/schemas/amount'
          tppMessage:
            type: array
            items:
              $ref: '#/components/schemas/tppMessageGeneric'
            description: Messages to the TPP on operational issues.
      bulkPaymentInitiationWithStatusResponse:
        description: >
          Generic JSON response body consistion of the corresponding bulk payment

          initiation JSON body together with an optional transaction status field.
        type: object
        required:
        - payments
        - debtorAccount
        properties:
          batchBookingPreferred:
            $ref: '#/components/schemas/batchBookingPreferred'
          requestedExecutionDate:
            type: string
            format: date
          acceptorTransactionDateTime:
            type: string
            format: date-time
          debtorAccount:
            $ref: '#/components/schemas/accountReference'
          paymentInformationId:
            type: string
            maxLength: 35
          payments:
            description: >
              A list of generic JSON bodies payment initiations for bulk payments via

              JSON.



              Note: Some fields from single payments do not occur in a bulk payment

              element
            type: array
            items:
              $ref: '#/components/schemas/paymentInitiationBulkElement_json'
          transactionStatus:
            $ref: '#/components/schemas/transactionStatus'
          tppMessage:
            type: array
            items:
              $ref: '#/components/schemas/tppMessageGeneric'
            description: Messages to the TPP on operational issues.

  examples:
  paymentInitiationDomesticBody_payments_json:
  value:
  endToEndIdentification: d14c3e75-8a2f-4e93-b3ca-ec4fd7128b9e
  debtorName: Placeholder
  debtorAccount:
  bban: **preferredAccIdentifierValue**
  instructedAmount:
  currency: **currency**
  amount: 123.00
  creditorAccount:
  bban: **preferredAccIdentifierAdditionalValue**
  creditorName: Merchant123
  creditorAddress:
  streetName: My address
  townName: **city**
  purposeCode: **purposeCode**
  remittanceInformationUnstructured: Purpose of remittance
  remittanceInformationStructuredArray: - reference: debtor reference
  referenceType: DINV
  referenceModel: 123 - reference: creditor reference
  referenceType: CDTR
  referenceModel: 123
  requestedExecutionDate: **requestedExecutionDate**
  priorityFlag: HIGH
  paymentInitiationBudgetaryBody_payments_json:
  value:
  endToEndIdentification: d14c3e75-8a2f-4e93-b3ca-ec4fd7128b9e
  debtorName: Placeholder
  debtorAccount:
  bban: 12340000029405
  instructedAmount:
  currency: **currency**
  amount: 123.00
  creditorAccount:
  bban: 100000000063095
  creditorName: Merchant123
  creditorAddress:
  streetName: My address
  townName: **city**
  purposeCode: **purposeCode**
  remittanceInformationUnstructured: Purpose of remittance
  requestedExecutionDate: **requestedExecutionDate**
  priorityFlag: HIGH
  budgetPaymentDetails:
  revenueAccount: 84014402778
  budgetaryAccount: ''
  revenueCode: 71122500
  taxNumber: 501988410062
  paymentInitiationCrossBody_payments_json:
  value:
  endToEndIdentification: d14c3e75-8a2f-4e93-b3ca-ec4fd7128b9e
  debtorName: Placeholder Name
  debtorAccount:
  iban: (XXXX)(XXX)901000401709
  instructedAmount:
  currency: EUR
  amount: 12.00
  creditorAccount:
  iban: (XXXX)(XXX)000012345678951
  creditorName: Placeholder Name
  creditorAddress:
  streetName: My address
  townName: Frankfurt
  country: DE
  purposeCode: 213
  chargeBearer: DEBT
  creditorAgent: DEUTDEFF
  creditorAgentName: Deutsche Bank AG
  remittanceInformationUnstructured: Purpose of remittance
  requestedExecutionDate: **requestedExecutionDate**
  paymentInitiationBulkBody_payments_json:
  value:
  endToEndIdentification: d14c3e75-8a2f-4e93-b3ca-ec4fd7128b9e
  debtorName: Placeholder
  debtorAccount:
  bban: **preferredAccIdentifierValue**
  requestedExecutionDate: **requestedExecutionDate**
  payments: - instructedAmount:
  currency: **currency**
  amount: 150.00
  creditorAccount:
  bban: **preferredAccIdentifierAdditionalValue**
  creditorName: Merchant123
  creditorAddress:
  streetName: My address
  townName: **city**
  purposeCode: **purposeCode**
  remittanceInformationUnstructured: Purpose of remittance - instructedAmount:
  currency: **currency**
  amount: 25.00
  creditorAccount:
  bban: **preferredAccIdentifierAdditionalValue**
  creditorName: Merchant123
  creditorAddress:
  streetName: My address
  townName: **city**
  purposeCode: **purposeCode**
  remittanceInformationUnstructured: Purpose of remittance
  paymentResponseExampleRedirect:
  description: Response in case of a redirect approach.
  value:
  transactionStatus: RCVD
  paymentId: 899dfb28175e4508943a7e5c79be1ab1
  \_links:
  scaRedirect:
  href: https://auth.sandbox.open-bank.io/v1/authentication/tenants/{{tenant-id}}/sca/redirect?messageId=dfead4d8-e4b7-4391-8x7b-2f6se231adfd
  self:
  href: /v1/payments/domestic-transfer/899dfb28175e4508943a7e5c79be1ab1
  status:
  href: /v1/payments/domestic-transfer/899dfb28175e4508943a7e5c79be1ab1/status
  scaStatus:
  href: /v1/payments/domestic-transfer/899dfb28175e4508943a7e5c79be1ab1/authorisations/7b1cdbfa6bcv4234b724edese5h66f8d
  paymentInitiationExample_json\_\_RedirectExplicitAuthorisation:
  description: Response in case of a redirect with an explicit authorisation start
  value:
  transactionStatus: RCVD
  paymentId: 2adf4da322f648e88d897c64ac8a8c13
  scaMethods:
  authenticationType: CHIP_OTP
  authenticationMethodId: 1
  authenticationVersion: 1.0
  name: Redirect SCA Approach
  explanation: N/A
  \_links:
  startAuthorisation:
  href: /v1/payments/domestic-transfer/2adf4da322f648e88d897c64ac8a8c13/authorisations
  self:
  href: /v1/payments/domestic-transfer/2adf4da322f648e88d897c64ac8a8c13
  status:
  href: /v1/payments/domestic-transfer/2adf4da322f648e88d897c64ac8a8c13/status
  authorisationListExample:
  value:
  authorisationIds: - 4a6b838066834db4bebeace9fee04119
  startScaProcessResponseExample1:
  description: Response in case of a redirect with an explicit authorisation start
  value:
  scaStatus: received
  authorisationId: 2adf4sa525f648e82d827s64ac8a8c13
  chosenScaMethod:
  authenticationType: CHIP_OTP
  authenticationMethodId: 1
  authenticationVersion: 1.0
  name: Redirect SCA Approach
  explanation: N/A
  \_links:
  scaStatus:
  href: /v1/payments/domestic-transfer/1svf4ba5b5fb48e82d827s64ac8a8c13/authorisations/2adf4sa525f648e82d827s64ac8a8c13
  confirmation:
  href: /v1/payments/domestic-transfer/1svf4ba5b5fb48e82d827s64ac8a8c13/authorisations/2adf4sa525f648e82d827s64ac8a8c13
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
  paymentInitiationStatusResponse_json_Simple:
  value:
  transactionStatus: ACCP
  requestBodies:
  paymentInitiation:
  description: "JSON request body for a payment inition request message.\n\nThere are the following payment-products supported:\n _ \"domestic-transfer\" with JSON-Body\n _ \"cross-border-credit-transfers\" with JSON-Body\n \nThere are the following payment-services supported:\n _ \"payments\"\n _ \"bulk-payments\"\n\nAll optional, conditional and predefined but not yet used fields are defined.\n"
  required: true
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/paymentInitiation_json' - $ref: '#/components/schemas/crossPaymentInitiation_json' - $ref: '#/components/schemas/bulkPaymentInitiation_json'
  examples:
  payments/domestic-transfer:
  $ref: '#/components/examples/paymentInitiationDomesticBody_payments_json'
  payments/domestic-transfer(budgetary):
  $ref: '#/components/examples/paymentInitiationBudgetaryBody_payments_json'
  payments/cross-border-credit-transfers:
  $ref: '#/components/examples/paymentInitiationCrossBody_payments_json'
  bulk-payments/domestic-transfer:
  $ref: '#/components/examples/paymentInitiationBulkBody_payments_json'
  headers:
  X-Request-ID:
  description: ID of the request, unique to the call, as determined by the initiating party.
  required: true
  example: 99391c7e-ad88-49ec-a2ad-99ddcb1f7721
  schema:
  type: string
  format: uuid
  Content-Type:
  schema:
  type: string
  required: false
  example: application/json
  Location:
  description: >
  Location of the created resource (if created).
  schema:
  type: string
  format: url
  required: true
  Date:
  description: Date and time when the request was made (RFC 7231).
  required: true
  example: Wed, 11 Sep 2024 12:34:56 GMT
  schema:
  type: string
  format: date-time
  ASPSP-SCA-Approach:
  description: >
  This data element must be contained, if the SCA Approach is already fixed.

          Possible values are
            * DECOUPLED
            * REDIRECT
          The OAuth SCA approach will be subsumed by REDIRECT.
        schema:
          type: string
          enum:
          - DECOUPLED
          - REDIRECT
          example: DECOUPLED
        required: false
      ASPSP-Notification-Support:
        description: >
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
        description: >
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

  responses:
  CREATED_201_PaymentInitiation:
  description: CREATED
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  Content-Type:
  $ref: '#/components/headers/Content-Type'
  Location:
  $ref: '#/components/headers/Location'
  Date:
  $ref: '#/components/headers/Date'
  ASPSP-SCA-Approach:
  $ref: '#/components/headers/ASPSP-SCA-Approach'
  ASPSP-Notification-Support:
  $ref: '#/components/headers/ASPSP-Notification-Support'
  ASPSP-Notification-Content:
  $ref: '#/components/headers/ASPSP-Notification-Content'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/paymentInitiationRequestResponse-201'
  examples:
  Response in case of a redirect approach:
  $ref: '#/components/examples/paymentResponseExampleRedirect'
  Response in case of a redirect where an explicit authorisation start is needed:
  $ref: '#/components/examples/paymentInitiationExample_json\_\_RedirectExplicitAuthorisation'
  BAD_REQUEST_400_PIS_PATH:
  description: Bad Request
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error400_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error400_PIS'
  UNAUTHORIZED_401_PIS_PATH:
  description: Unauthorized
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error401_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error401_PIS'
  FORBIDDEN_403_PIS_PATH:
  description: Forbidden
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error403_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error403_PIS'
  NOT_FOUND_404_PIS_PATH:
  description: Not found
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error404_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error404_PIS'
  METHOD_NOT_ALLOWED_405_PIS_PATH:
  description: Method Not Allowed
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error405_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error405_PIS'
  NOT_ACCEPTABLE_406_PIS:
  description: Not Acceptable
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  REQUEST_TIMEOUT_408_PIS:
  description: Request Timeout
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  CONFLICT_409_PIS_PATH:
  description: Conflict
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error409_NG_PIS_PATH'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error409_PIS'
  UNSUPPORTED_MEDIA_TYPE_415_PIS:
  description: Unsupported Media Type
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  TOO_MANY_REQUESTS_429_PIS:
  description: Too Many Requests
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  INTERNAL_SERVER_ERROR_500_PIS:
  description: Internal Server Error
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  SERVICE_UNAVAILABLE_503_PIS:
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
  BAD_REQUEST_400_PIS:
  description: Bad Request
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error400_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error400_PIS'
  UNAUTHORIZED_401_PIS:
  description: Unauthorized
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error401_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error401_PIS'
  FORBIDDEN_403_PIS:
  description: Forbidden
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error403_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error403_PIS'
  NOT_FOUND_404_PIS:
  description: Not found
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error404_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error404_PIS'
  METHOD_NOT_ALLOWED_405_PIS:
  description: Method Not Allowed
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error405_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error405_PIS'
  CONFLICT_409_PIS:
  description: Conflict
  headers:
  Location:
  $ref: '#/components/headers/Location'
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/Error409_NG_PIS'
  application/problem+json:
  schema:
  $ref: '#/components/schemas/Error409_PIS'
  CREATED_201_StartScaProcessPIS:
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
  'Example 1: payments - Redirect Approach':
  $ref: '#/components/examples/startScaProcessResponseExample1'
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
  OK_200_UpdatePsuData:
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
  OK_200_PaymentInitiationStatus:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  $ref: '#/components/schemas/paymentInitiationStatusResponse-200_json'
  examples:
  simple:
  $ref: '#/components/examples/paymentInitiationStatusResponse_json_Simple'
  OK_200_PaymentInitiationInformation:
  description: OK
  headers:
  X-Request-ID:
  $ref: '#/components/headers/X-Request-ID'
  content:
  application/json:
  schema:
  oneOf: - $ref: '#/components/schemas/paymentInitiationWithStatusResponse' - $ref: '#/components/schemas/paymentInitiationWithStatusResponse_cross-border-credit-transfers' - $ref: '#/components/schemas/bulkPaymentInitiationWithStatusResponse'

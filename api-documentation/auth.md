openapi: 3.0.1
info:
title: Open Banking Authentication API
version: 1.0.0
description: |

    # Overview

    Register a client with the Open Banking authentication API to obtain credentials for accessing OAuth 2.0 protected resources.

    This API will allow you to register for access to our PSD2 services, such as accounts, balances, transactions, payments, and confirmation of funds.

    ## Getting Started

    This API can be called by any eligible organization who has an eIDAS QWAC certificate issued by a valid QTSP CA and is authorized by a European NCA in at least one of the following roles as defined in the PSD2 Legislation:
    - AISP (Account Information Services Provider)
    - PISP (Payment Initiation Services Provider)

    ## How it works

    After calling the API using Mutually Authenticated TLS with your PSD2 eIDAS certificate you will be granted access to the APIs relevant to the role(s) defined in your certificate and with the scopes you requested in the registration request.

    **NOTE:** This API will not allow use of any other non-PSD2 eIDAS certificate or other public/private CA issued certificate.

    ## Renewing or Updating a Certificate

    If the TPP certificate has expired or changed, TPPs should renew it and then make a new request with the new certificate, as described previously, to the same endpoint.

    If the new certificate is attached, valid and contains the unique TPP's organization identifier it will be updated along with the information that are carried within.

    ## Authentication and Authorization

    The Registration API only requires Mutual Authentication with an eIDAS QWAC certificate issued by an appropriate QTSP specifically for use for PSD2, as mentioned in the ‘Getting Started’ section.

    ## OAuth 2.0

    The Open Banking Authentication API adheres to OAuth 2.0 standards for secure and scalable access to APIs.
    - **Authorization Endpoint:** Used to authenticate users and request their consent for accessing resources.
    - **Token Endpoint:** Used to exchange authorization codes for access tokens.
    - **Scopes:** Specify the level of access required, for example `PIS`, `AIS`, `PIIS`, and `openid`.
    - **PKCE (Proof Key for Code Exchange):** A recommended security measure for public clients.

    For details on how to integrate using OAuth 2.0, refer to the `/connect/authorize` and `/connect/token` endpoints described in this specification.

servers:

- url: https://auth.dev.mk.open-bank.io/v1/authentication/tenants/{{tenant-id}}
  security:
- {}
  tags:
- name: Tpp Registration
  description: |
  `It is important to note that this step is only necessary if redirect flow is used`

  For a TPP (Third Party Provider) to access the Open Banking platform, it must first register a client on it. The TPP Registration endpoint is used for this purpose.

  It enables the creation of a client based on OAuth 2.0, which is then used to access PSD2 services through a redirect flow. This means that the client is necessary to enable secure and regulated access to the services according to the PSD2 directive.

paths:
/connect/register/mtls:
post:
summary: Register
description: |

        This endpoint handles client creation on the open banking platform.

        **NOTE:** The request must be made with the QWAC eIDAS certificate present.
      operationId: tppRegister
      x-codeSamples:
        - lang: cURL
          source: |
            curl --location '(BASE AUTH URL HERE)/connect/register/mtls' \
            --header 'Content-Type: application/json' \
            --data ' {
                "client_uri": "https://oauth.pstmn.io",
                "logo_uri": "https://www.example.com/logo.svg",
                "post_logout_redirect_uris": [
                    "https://oauth.pstmn.io/v1/browser-callback",
                    "https://oauth.pstmn.io/v1/callback"
                ],
                "redirect_uris": [
                    "https://oauth.pstmn.io/v1/browser-callback",
                    "https://oauth.pstmn.io/v1/callback"
                ]
            }'
            --key client.key \
            --cert client.crt \
            --insecure'
      tags:
        - Tpp Registration
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - client_uri
                - logo_uri
                - post_logout_redirect_uris
                - redirect_uris
              properties:
                client_uri:
                  type: string
                  description: URI of the client's homepage.
                  example: "https://oauth.pstmn.io"
                logo_uri:
                  type: string
                  description: URI of the client's logo.
                  example: "https://www.example.com/logo.svg"
                post_logout_redirect_uris:
                  type: array
                  items:
                    type: string
                  description: List of URIs where the client can redirect after logout.
                  example:
                    - "https://oauth.pstmn.io/v1/browser-callback"
                    - "https://oauth.pstmn.io/v1/callback"
                redirect_uris:
                  type: array
                  items:
                    type: string
                  description: List of URIs to which the client can redirect after authentication.
                  example:
                    - "https://oauth.pstmn.io/v1/browser-callback"
                    - "https://oauth.pstmn.io/v1/callback"
      responses:
        '200':
          description: Successfully registered client.
          content:
            application/json:
              schema:
                type: object
                properties:
                  client_id:
                    type: string
                    description: The unique identifier of the registered client.
                    example: "375380.certificate"
                  client_secret:
                    type: string
                    description: The secret associated with the client.
                    example: "1cdfde78ef634492b81db65ad8af7960"
                  client_name:
                    type: string
                    description: The name of the registered client.
                    example: "372380.certificate Certificate Client"
                  grant_types:
                    type: string
                    description: List of grant types the client supports.
                    example: "authorization_code,client_credentials"
                  scope:
                    type: string
                    description: Scopes assigned to the client.
                    example: "PIS AIS PIIS openid"
                  client_uri:
                    type: string
                    description: URI of the client's homepage.
                    example: "https://oauth.pstmn.io"
                  logo_uri:
                    type: string
                    description: URI of the client's logo.
                    example: "https://www.example.com/logo.svg"
                  redirect_uris:
                    type: array
                    items:
                      type: string
                    description: List of URIs to which the client can redirect after authentication.
                    example:
                      - "https://oauth.pstmn.io/v1/browser-callback"
                      - "https://oauth.pstmn.io/v1/callback"
                  post_logout_redirect_uris:
                    type: array
                    items:
                      type: string
                    description: List of URIs where the client can redirect after logout.
                    example:
                      - "https://oauth.pstmn.io/v1/browser-callback"
                      - "https://oauth.pstmn.io/v1/callback"
        '400':
          description: Bad request, invalid input parameters.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message.
        '500':
          description: Internal server error.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message.
        '401':
          description: Unauthorized, invalid credentials or missing MTLS authentication.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message.
        '429':
          description: Too many requests, rate limit exceeded.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message.

/connect/authorize:
get:
tags: - OAuth 2.0 Authorization
summary: Authenticate user and authorize scopes
description: |
**Obtain Authorization Code using /connect/authorize**.

        This endpoint handles user authentication and scope authorization.

        It complies with the [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html) specification.
      operationId: OpenIDConnect_Authorize

      x-codeSamples:
          - lang: cURL
            source: |
              curl --location '(BASE AUTH URL HERE)/connect/authorize?response_type=code&client_id=102.clientid&redirect_uri=https%3A%2F%2Foauth.pstmn.io%2Fv1%2Fcallback&scope=openid&code_challenge=FnlR3MKqSlNWVF1tOFpnyd-Gxj2OWLNYnBB2449yu6Y&code_challenge_method=S256' \
              --header 'Content-Type: application/json' \

      parameters:
        - name: response_type
          in: query
          required: true
          schema:
            type: string
            example: code
          description: Specifies the response type, e.g., `code` for authorization code flow.
        - name: client_id
          in: query
          required: true
          schema:
            type: string
            example: 102.clientId
          description: The client ID of the application requesting authorization.
        - name: redirect_uri
          in: query
          required: true
          schema:
            type: string
            format: uri
            example: https://oauth.pstmn.io/v1/browser-callback
          description: The URI to which the user will be redirected after authorization.
        - name: scope
          in: query
          required: true
          schema:
            type: string
            example: openid
          description: The scope of the access request.
        - name: state
          in: query
          required: false
          schema:
            type: string
            example: wFoh2xao37nnmfj_rXYIm-LLnjVlFmorwYx6T5lQaXk
          description: A unique string to maintain state between the request and callback.
        - name: code_challenge
          in: query
          required: true
          schema:
            type: string
            example: 3gNeoX1MA_6QJXdgiW3eB7JYKmwwkMGy7kfBa_WKJRY
          description: The PKCE code challenge.
        - name: code_challenge_method
          in: query
          required: true
          schema:
            type: string
            example: S256
          description: The method used to hash the code verifier, e.g., `S256`.
      responses:
        '302':
          description: Found - For details of authentication response refer to [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html) spec
          content:
            application/json: {}
        '400':
          $ref: https://bankapi.net/shared/v1#/components/responses/validation-error-response
        default:
          $ref: https://bankapi.net/shared/v1#/components/responses/default-error-response
      x-asee-tags: []

/connect/token:
post:
tags: - OAuth 2.0 Authorization
summary: Exchange authorization code for tokens
description: |
**Exchange Authorization Code for Access Token using /connect/token.**

        Token endpoint as defined in [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html) spec.
      operationId: OpenIDConnect_ExchangeToken
      x-authz-action: "exchange-token"

      x-codeSamples:
        - lang: cURL
          source: |
            curl --location '(BASE AUTH URL HERE)/connect/token' \
            --header 'Content-Type: application/json' \
            --header 'Cookie: .AspNetCore.Antiforgery.9TtSrW0hzOs=CfDJ8KbMLNXkkbpMmKlxZbXeMKAuYFfINTranfwWhXeiS1wPGOt1FacnYRVnTDRk5ANBfmqBjj9wG93_Mbp94xpx0arIdCZ5bSJNK3gKVS0_M0y2G9DJu2TtfniyK6PzcmhrGB1rT9LakcjWKDDuMlqkwnE' \
            --form 'grant_type="authorization_code"' \
            --form 'code="sparkasse:E16FFB4275D465502D35B8DF0050894054A21583DFD33C9AEBA1B50DF6ADB65C"' \
            --form 'redirect_uri="https://oauth.pstmn.io/v1/browser-callback"' \
            --form 'client_id="107.clientid"' \
            --form 'client_secret="42cfasc6-22a2-ds22-8c4a-4bdsb7eaz3x9"' \
            --form 'code_verifier="FDu67bMuasdfm3pN6GoFQkPGPqKOidCwFWVZq_NsRc"'

      requestBody:
        required: true
        content:
          application/form-data:
            schema:
              required:
                - grant_type
                - code
                - redirect_uri
                - client_id
                - client_secret
                - code_verifier
              type: object
              properties:
                grant_type:
                  type: string
                  description: OAuth2 grant type being used.
                  example: authorization_code
                code:
                  type: string
                  description: Authorization code obtained from the authorization endpoint.
                  example: string
                redirect_uri:
                  type: string
                  description: Redirect URI used during authorization.
                  example: https://oauth.pstmn.io/v1/browser-callback
                client_id:
                  type: string
                  description: Client identifier issued to the app during registration.
                  example: string
                client_secret:
                  type: string
                  description: Secret issued to the app during registration.
                  example: string
                code_verifier:
                  type: string
                  description: Code verifier used in case authorization was done with Code Challenge.
                  example: FDu67bMuxZLVCm3pN6GoFQkPGPqKOidCwFWVZq_NsRc

      responses:
        '200':
          description: OK - For details of token response refer to [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html) spec
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/token-response"
        '400':
          $ref: https://bankapi.net/shared/v1#/components/responses/validation-error-response
        '401':
          description: Unauthorized client
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/oauth2-error"
        '403':
          description: Forbidden
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/oauth2-error"
        '440':
          description: Your request was well constructed but it could not be processed due to business policy.
          content:
            application/json:
              schema:
                $ref: https://bankapi.net/shared/v1#/components/schemas/business-problem
          x-asee-problems:
            - standard-claim-cannot-be-configured
            - integration-error
        default:
          $ref: https://bankapi.net/shared/v1#/components/responses/default-error-response
        x-asee-tags: []

components:
schemas: # Token Response
token-response:
type: object
description: Response for token requests.
properties:
access_token:
type: string
description: The issued access token.
token_type:
type: string
description: The type of token (usually `Bearer`).
example: Bearer
expires_in:
type: integer
description: Lifetime of the token in seconds.
example: 3600
refresh_token:
type: string
description: The issued refresh token (if applicable).
id_token:
type: string
description: The ID token (if applicable for OpenID Connect).
scope:
type: string
description: Granted scopes.

    oauth2-error:
      type: object
      description: >
        Represents an error response as defined in the OpenID Connect Core 1.0 specification.
      properties:
        error:
          type: string
          description: >
            Error code indicating the type of error that occurred. Possible values:
            - `invalid_request`: The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed.
            - `invalid_client`: Client authentication failed.
            - `invalid_grant`: The provided authorization grant or refresh token is invalid, expired, or revoked.
            - `unauthorized_client`: The client is not authorized to use this grant type.
            - `unsupported_grant_type`: The authorization server does not support the requested grant type.
            - `invalid_scope`: The requested scope is invalid, unknown, or malformed.
          example: invalid_request
        error_description:
          type: string
          description: >
            Human-readable text providing additional information about the error.
          example: The redirect_uri is missing or does not match.
        error_uri:
          type: string
          format: uri
          description: >
            A URI identifying a human-readable web page with information about the error.
          example: https://example.com/error/invalid_request

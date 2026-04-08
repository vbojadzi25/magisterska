// Shared TypeScript types between API and UI

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  profilePicture?: string;
  isVerified: boolean;
  kycStatus: KYCStatus;
  createdAt: string;
  updatedAt: string;
}

export enum KYCStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface BankAccount {
  id: string;
  userId: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
  balance?: number;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  BUSINESS = 'business'
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  country: string;
  logoUrl?: string;
  supportedCurrencies: string[];
  apiEndpoint?: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  currency: string;
  fee: number;
  totalAmount: number;
  description?: string;
  status: TransactionStatus;
  type: TransactionType;
  reference: string;
  externalReference?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  P2P_TRANSFER = 'p2p_transfer',
  BANK_TRANSFER = 'bank_transfer',
  MERCHANT_PAYMENT = 'merchant_payment',
  TOP_UP = 'top_up',
  WITHDRAWAL = 'withdrawal'
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
}

export interface TransferRequest {
  toUserId?: string;
  toEmail?: string;
  amount: number;
  currency: string;
  description?: string;
  fromBankAccountId: string;
  toBankAccountId?: string;
}

export interface OpenBankingConsent {
  id: string;
  userId: string;
  bankId: string;
  consentId: string;
  permissions: string[];
  status: ConsentStatus;
  expiresAt: string;
  createdAt: string;
}

export enum ConsentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export interface BankingApiConfig {
  bankId: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  certificatePath?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  accountsEndpoint: string;
  paymentsEndpoint: string;
  scopes: string[];
}

// Macedonian banking specific types
export interface MacedonianBankConfig extends BankingApiConfig {
  nbrCode: string; // National Bank of the Republic of Macedonia code
  swiftCode: string;
  supportsPSD2: boolean;
  supportsSEPA: boolean;
}
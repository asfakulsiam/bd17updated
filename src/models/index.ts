
import { PrismaClient } from "@prisma/client";

// --- ENUMS ---
export type MemberStatus = 'AwaitingRegistration' | 'Pending' | 'Approved' | 'Rejected' | 'Flagged';
export type JoiningType = 'New' | 'Old';
export type TransactionType = 'MONTHLY_SAVINGS' | 'LOAN_REPAYMENT' | 'LOAN_DISBURSEMENT' | 'OTHER' | 'SPECIAL_SAVINGS';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';
export type LoanApplicationStatus = 'Pending' | 'Approved' | 'Rejected';
export type LoanStatus = 'Active' | 'Repaid' | 'N_A';
export type PostStatus = 'Published' | 'Draft';
export type PostType = 'NOTICE' | 'DASHBOARD_POST';
export type PaymentAccountType = 'MobileBanking' | 'Bank';
export type ShareStatus = 'Active' | 'Removed' | 'ForTransfer' | 'Converted';

// --- MODELS ---

export interface Member {
  id: string;
  clerkId: string;
  status: MemberStatus;
  joiningType: JoiningType;
  rejectionReason?: string | null;
  advanceBalance: number;
  totalDue: number;
  currentMonthDue: number;
  
  fullNameBn?: string | null;
  fullNameEn?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  nid?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  religion?: string | null;
  
  mobilePrimary?: string | null;
  mobileAlternate?: string | null;
  email?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  
  sscBatch?: string | null;
  otherEducation?: string | null;
  profession?: string | null;
  workplace?: string | null;
  
  bankName?: string | null;
  branch?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  bankingMethod?: string | null;
  
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineeMobile?: string | null;
  nomineeAddress?: string | null;
  
  photoUrl?: string | null;
  nidCopyUrl?: string | null;
  bankStatementUrl?: string | null;
  
  photoPublicId?: string | null;
  nidCopyPublicId?: string | null;
  bankStatementPublicId?: string | null;

  joiningDate?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relation / Computed
  shares: Share[];
  paidEventIds: string[];
}

export interface Transaction {
  id: string;
  memberId: string;
  loanId?: string | null;
  date: string;
  amount: number;
  type: TransactionType;
  reason?: string | null;
  status: TransactionStatus;
  paymentMethod?: string | null;
  transactionId?: string | null;
  senderNumber?: string | null;
  approvedBy?: string | null;
  notes?: string | null;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
  eventPayment?: EventPayment | null;
  eventId?: string | null;
}

export interface ApprovedPayment {
  id: string;
  memberId: string;
  shareId?: string | null;
  amount: number;
  type: TransactionType;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentForMonth: Date | null;
  transactionId: string | null;
  senderNumber: string | null;
  notes?: string | null;
  paymentMethod: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
  eventId?: string | null;
  
  // For UI display
  name?: string;
  phone?: string;
}


export interface Loan {
  id: string;
  memberId: string;
  applicationDate: string;
  approvalDate?: string | null;
  amount: number;
  repaidAmount: number;
  reason: string;
  additionalInfo?: string | null;
  repaymentPeriod: number;
  applicationStatus: LoanApplicationStatus;
  loanStatus: LoanStatus;
  createdAt: string;
  updatedAt: string;
  guarantor: Guarantor | null;
  transactions: Transaction[];
  installments: LoanInstallment[];
}

export interface Guarantor {
    id: string;
    loanId: string;
    name: string;
    phone: string;
    address: string;
    nidNumber: string;
    nidCopyUrl: string;
    nidCopyPublicId: string;
    deathPayee: string;
    altPayeeName?: string | null;
    altPayeeRelation?: string | null;
    altPayeePhone?: string | null;
    altPayeeAddress?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    type: PostType;
    imageUrls: string[];
    imagePublicIds: string[];
    authorId: string;
    status: PostStatus;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
  id: string;
  memberId: string;
  title: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface ProfileUpdate {
  id: string;
  memberId: string;
  status: string;
  updateData: any;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAccount {
  id: string;
  accountName: string;
  accountType: PaymentAccountType;
  accountNumber: string;
  bankName?: string | null;
  notice: string;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  memberId: string;
  sharerName: string;
  sharerNid: string;
  sharerPhone: string;
  sharerAddress: string;
  status: ShareStatus;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
  removedAt?: string | null;
  convertedAt?: string | null;
  transfers: ShareTransfer[];
  monthlyPayments: MonthlyPayment[];
}

export interface Event {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  payments: ApprovedPayment[];
  eventPayments: EventPayment[];
}

export interface ShareTransfer {
  id: string;
  shareId: string;
  fromMemberId: string;
  toMemberId: string;
  transferredAt: string;
  approvedBy: string;
}

export interface Settings {
    id: string;
    siteTitle: string;
    logoUrl?: string | null;
    logoPublicId?: string | null;
    minMonthlySavings: number;
    shareValue: number;
    apiPaymentMethod?: string | null;
    policyContent: string;
    maxSharesPerMember: number;
    loanToSavingsRatioNumerator: number;
    loanToSavingsRatioDenominator: number;
    loanSystemEnabled: boolean;
    specialSavingsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'super' | 'members' | 'loans' | 'transactions' | 'posts' | 'messaging';
    avatarUrl?: string;
}

export interface MonthlyPayment {
    id: string;
    memberId: string;
    shareId: string | null;
    month: Date;
    expected: number;
    paid: number;
    status: 'Paid' | 'Partial' | 'Due';
}

export interface LoanInstallment {
    id: string;
    loanId: string;
    month: Date;
    expected: number;
    paid: number;
    status: 'Paid' | 'Partial' | 'Due';
}


export interface EventPayment {
  id: string;
  memberId: string;
  eventId: string;
  transactionId: string;
  createdAt: string;
  event: Event;
  transaction: Transaction;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  transactionId: string | null;
  status: TransactionStatus;
  name: string;
  memberId: string;
  approvedBy?: string;
  phone?: string;
  paymentType: TransactionType;
  paymentMethod: 'API' | 'Manual';
  service?: string;
  reason?: string;
  senderNumber?: string;
  bankName?: string;
}

// --- COMPOSITE & DERIVED TYPES ---

export type MemberWithShares = Member & {
    shares: Share[];
}

export type ProfileUpdateWithMember = ProfileUpdate & { 
    member: { fullNameEn: string | null } 
};

export type LoanWithDetails = Loan & { 
    member: { fullNameEn: string | null };
    guarantor: any; // Simplified for this context
};

export type MemberDetailsData = {
    details: Member;
    financials: {
        totalDue: number;
        currentMonthDue: number;
        advanceBalance: number;
        totalLoanDue: number;
        currentMonthLoanDue: number;
        monthlyBreakdown: Record<string, { expected: number; paid: number }>;
        entityLedgers: Record<string, { name: string; breakdown: Record<string, { expected: number; paid: number; }>; advance: number; }>;
        
        totalSavings: number;
        activeLoan: number;
        totalLoanTaken: number;
        otherPayments: number;
        loanableAmount: number;
    };
    transactions: Transaction[];
    loans: Loan[];
    settings: Settings;
};

export type UserDetailsData = MemberDetailsData;


export type UserLoanData = {
    hasLoan: boolean;
    loanAmount: number;
    repaidAmount: number;
    repaymentPeriod: number;
    approvalDate: string | null;
    applicationPending: boolean;
    loanApplicationsThisYear: number;
    maxLoanableAmount: number;
    totalSavings: number;
    totalLoanDue: number;
    currentMonthLoanDue: number;
};

export type OrgLoanData = {
    organizationTotalFund: number;
    organizationOtherFunds: number;
    activeLoans: Loan[];
    totalLoanedOut: number;
}

export type AdminDashboardStats = {
    totalMembers: number;
    approvedMembers: number;
    totalSavingsFund: number;
    activeLoanTotal: number;
    pendingLoansCount: number;
    pendingPaymentsCount: number;
    pendingMemberActions: number;
    pendingProfileUpdatesCount: number;
    otherFundsTotal: number;
    unpaidMembersCount: number;
    paidThisMonth: string;
};

export type MonthlyPaymentStatus = {
    paid: Member[];
    unpaid: Member[];
}

export type UnreadCounts = {
    inbox: number;
    notices: number;
}

export type PrismaTransactionType = 'MONTHLY_SAVINGS' | 'LOAN_REPAYMENT' | 'LOAN_DISBURSEMENT' | 'OTHER' | 'SPECIAL_SAVINGS';
export type Prisma = PrismaClient;

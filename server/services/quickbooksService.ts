import { db } from '../db';
import { quickbooksConnections, tenants, users, payments, households } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3/company';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

export interface QuickBooksCredentials {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  accessTokenExpiresAt: number; // Unix timestamp
  refreshTokenExpiresAt: number; // Unix timestamp
  scope?: string;
}

export interface QuickBooksConnection {
  isConnected: boolean;
  realmId?: string;
  companyName?: string;
  lastSyncedAt?: Date;
  tokenExpiresAt?: Date;
  needsReauth?: boolean;
}

export interface QuickBooksAccount {
  id: string;
  name: string;
  accountType: string;
  accountSubType: string;
  classification: string;
  currentBalance?: number;
  active: boolean;
}

export interface QuickBooksCustomer {
  id?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  primaryEmailAddr?: { Address: string };
  primaryPhone?: { FreeFormNumber: string };
  billAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
}

export interface SyncTransactionRequest {
  type: 'sales_receipt' | 'invoice';
  paymentId?: string;
  customerId?: string;
  parentId?: string;
  householdId?: string;
  amount: number;
  description: string;
  sessionName?: string;
  playerNames?: string[];
  paymentMethod?: string;
  depositAccountId?: string;
  incomeAccountId?: string;
  txnDate?: Date;
}

export function isQuickBooksEnabled(): boolean {
  return !!(QUICKBOOKS_CLIENT_ID && QUICKBOOKS_CLIENT_SECRET);
}

function getRedirectUri(): string {
  return process.env.QUICKBOOKS_REDIRECT_URI || `${APP_URL}/api/admin/integrations/quickbooks/callback`;
}

function getBasicAuthHeader(): string {
  const credentials = `${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export function getAuthorizationUrl(tenantId: string, redirectUri?: string): string {
  if (!isQuickBooksEnabled()) {
    throw new Error('QuickBooks integration is not configured');
  }

  const finalRedirectUri = redirectUri || getRedirectUri();
  const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: QUICKBOOKS_CLIENT_ID!,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: finalRedirectUri,
    state,
  });

  return `${QB_AUTH_URL}?${params.toString()}`;
}

export async function handleCallback(
  tenantId: string,
  authCode: string,
  realmId: string
): Promise<QuickBooksConnection> {
  if (!isQuickBooksEnabled()) {
    throw new Error('QuickBooks integration is not configured');
  }

  const tokenResponse = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': getBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  
  const now = Date.now();
  const tokenExpiresAt = new Date(now + (tokenData.expires_in * 1000));

  const [existingConnection] = await db
    .select()
    .from(quickbooksConnections)
    .where(eq(quickbooksConnections.tenantId, tenantId))
    .limit(1);

  let companyName: string | undefined;
  
  if (existingConnection) {
    await db.update(quickbooksConnections)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
        realmId,
        isConnected: true,
        connectedAt: new Date(),
        lastError: null,
        syncStatus: 'idle',
        updatedAt: new Date(),
      })
      .where(eq(quickbooksConnections.id, existingConnection.id));
  } else {
    await db.insert(quickbooksConnections).values({
      tenantId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt,
      realmId,
      isConnected: true,
      connectedAt: new Date(),
      syncStatus: 'idle',
    });
  }

  try {
    const companyInfo = await fetchCompanyInfo(tenantId);
    companyName = companyInfo?.CompanyName;
    
    if (companyName) {
      await db.update(quickbooksConnections)
        .set({ companyName, updatedAt: new Date() })
        .where(eq(quickbooksConnections.tenantId, tenantId));
    }
  } catch (error) {
    console.warn('Failed to fetch company info:', error);
  }

  return {
    isConnected: true,
    realmId,
    companyName,
    lastSyncedAt: new Date(),
    tokenExpiresAt,
    needsReauth: false,
  };
}

export async function disconnect(tenantId: string): Promise<void> {
  const [connection] = await db
    .select()
    .from(quickbooksConnections)
    .where(eq(quickbooksConnections.tenantId, tenantId))
    .limit(1);

  if (!connection) {
    return;
  }

  if (connection.refreshToken) {
    try {
      await fetch(QB_REVOKE_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': getBasicAuthHeader(),
        },
        body: new URLSearchParams({
          token: connection.refreshToken,
        }),
      });
    } catch (error) {
      console.warn('Failed to revoke QuickBooks token:', error);
    }
  }

  await db.update(quickbooksConnections)
    .set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isConnected: false,
      syncStatus: 'idle',
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(quickbooksConnections.id, connection.id));
}

export async function getConnection(tenantId: string): Promise<QuickBooksConnection> {
  const [connection] = await db
    .select()
    .from(quickbooksConnections)
    .where(eq(quickbooksConnections.tenantId, tenantId))
    .limit(1);

  if (!connection || !connection.isConnected) {
    return { isConnected: false };
  }

  if (!connection.accessToken || !connection.refreshToken) {
    return { isConnected: false };
  }

  const now = Date.now();
  const tokenExpiresAt = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).getTime() : 0;
  const needsReauth = tokenExpiresAt > 0 && now >= tokenExpiresAt;

  return {
    isConnected: true,
    realmId: connection.realmId || undefined,
    companyName: connection.companyName || undefined,
    tokenExpiresAt: connection.tokenExpiresAt || undefined,
    needsReauth,
    lastSyncedAt: connection.lastSyncAt || undefined,
  };
}

export async function refreshTokenIfNeeded(tenantId: string): Promise<QuickBooksCredentials | null> {
  const [connection] = await db
    .select()
    .from(quickbooksConnections)
    .where(eq(quickbooksConnections.tenantId, tenantId))
    .limit(1);

  if (!connection || !connection.isConnected) {
    return null;
  }

  if (!connection.accessToken || !connection.refreshToken || !connection.realmId) {
    return null;
  }

  const now = Date.now();
  const tokenExpiresAt = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).getTime() : 0;

  if (now < (tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS)) {
    return {
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      realmId: connection.realmId,
      accessTokenExpiresAt: tokenExpiresAt,
      refreshTokenExpiresAt: tokenExpiresAt + (30 * 24 * 60 * 60 * 1000),
    };
  }

  const tokenResponse = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': getBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refreshToken,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    await db.update(quickbooksConnections)
      .set({
        lastError: `Token refresh failed: ${error}`,
        syncStatus: 'error',
        updatedAt: new Date(),
      })
      .where(eq(quickbooksConnections.id, connection.id));
    
    throw new Error(`Failed to refresh QuickBooks token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  const newTokenExpiresAt = new Date(now + (tokenData.expires_in * 1000));
  
  await db.update(quickbooksConnections)
    .set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: newTokenExpiresAt,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(quickbooksConnections.id, connection.id));

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    realmId: connection.realmId,
    accessTokenExpiresAt: newTokenExpiresAt.getTime(),
    refreshTokenExpiresAt: now + (tokenData.x_refresh_token_expires_in * 1000),
  };
}

async function makeApiRequest<T>(
  tenantId: string,
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: object;
  }
): Promise<T> {
  const credentials = await refreshTokenIfNeeded(tenantId);
  if (!credentials) {
    throw new Error('QuickBooks is not connected');
  }

  const url = `${QB_API_BASE}/${credentials.realmId}${endpoint}`;
  const method = options?.method || 'GET';
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${credentials.accessToken}`,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function fetchCompanyInfo(tenantId: string): Promise<any> {
  const response = await makeApiRequest<any>(tenantId, '/companyinfo/1');
  return response.CompanyInfo;
}

export async function fetchAccounts(
  tenantId: string,
  filters?: {
    accountTypes?: ('Income' | 'Expense' | 'Other Current Liability' | 'Bank' | 'Accounts Receivable')[];
    activeOnly?: boolean;
  }
): Promise<QuickBooksAccount[]> {
  let query = "SELECT * FROM Account";
  const conditions: string[] = [];

  if (filters?.accountTypes && filters.accountTypes.length > 0) {
    const types = filters.accountTypes.map(t => `'${t}'`).join(', ');
    conditions.push(`AccountType IN (${types})`);
  }

  if (filters?.activeOnly !== false) {
    conditions.push("Active = true");
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += " ORDERBY Name";

  const response = await makeApiRequest<any>(
    tenantId,
    `/query?query=${encodeURIComponent(query)}`
  );

  const accounts = response.QueryResponse?.Account || [];
  
  return accounts.map((acc: any) => ({
    id: acc.Id,
    name: acc.Name,
    accountType: acc.AccountType,
    accountSubType: acc.AccountSubType || '',
    classification: acc.Classification || '',
    currentBalance: acc.CurrentBalance,
    active: acc.Active,
  }));
}

export async function findOrCreateCustomer(
  tenantId: string,
  data: {
    parentId?: string;
    householdId?: string;
    email?: string;
    displayName?: string;
    givenName?: string;
    familyName?: string;
    phone?: string;
  }
): Promise<{ customerId: string; created: boolean }> {
  let existingCustomer: any = null;
  
  if (data.email) {
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${data.email}'`;
    const response = await makeApiRequest<any>(
      tenantId,
      `/query?query=${encodeURIComponent(query)}`
    );
    existingCustomer = response.QueryResponse?.Customer?.[0];
  }

  if (!existingCustomer && data.displayName) {
    const query = `SELECT * FROM Customer WHERE DisplayName = '${data.displayName}'`;
    const response = await makeApiRequest<any>(
      tenantId,
      `/query?query=${encodeURIComponent(query)}`
    );
    existingCustomer = response.QueryResponse?.Customer?.[0];
  }

  if (existingCustomer) {
    return { customerId: existingCustomer.Id, created: false };
  }

  const customerData: any = {
    DisplayName: data.displayName || `${data.givenName || ''} ${data.familyName || ''}`.trim() || data.email || 'Unknown Customer',
  };

  if (data.givenName) customerData.GivenName = data.givenName;
  if (data.familyName) customerData.FamilyName = data.familyName;
  if (data.email) {
    customerData.PrimaryEmailAddr = { Address: data.email };
  }
  if (data.phone) {
    customerData.PrimaryPhone = { FreeFormNumber: data.phone };
  }

  const response = await makeApiRequest<any>(tenantId, '/customer', {
    method: 'POST',
    body: customerData,
  });

  return { customerId: response.Customer.Id, created: true };
}

export async function syncCustomerFromParent(
  tenantId: string,
  parentId: string
): Promise<{ customerId: string; created: boolean }> {
  const [parent] = await db
    .select()
    .from(users)
    .where(eq(users.id, parentId))
    .limit(1);

  if (!parent) {
    throw new Error('Parent not found');
  }

  return findOrCreateCustomer(tenantId, {
    parentId,
    email: parent.email || undefined,
    displayName: `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.email || undefined,
    givenName: parent.firstName || undefined,
    familyName: parent.lastName || undefined,
    phone: parent.phone || undefined,
  });
}

export async function syncCustomerFromHousehold(
  tenantId: string,
  householdId: string
): Promise<{ customerId: string; created: boolean }> {
  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household) {
    throw new Error('Household not found');
  }

  return findOrCreateCustomer(tenantId, {
    householdId,
    displayName: household.name || `Household ${householdId.slice(0, 8)}`,
  });
}

export async function createSalesReceipt(
  tenantId: string,
  data: {
    customerId: string;
    amount: number;
    description: string;
    lineItems?: Array<{
      description: string;
      amount: number;
      quantity?: number;
      accountId?: string;
    }>;
    paymentMethod?: string;
    depositAccountId?: string;
    txnDate?: Date;
    referenceNumber?: string;
  }
): Promise<{ receiptId: string; docNumber: string }> {
  const salesReceiptData: any = {
    CustomerRef: { value: data.customerId },
    TxnDate: (data.txnDate || new Date()).toISOString().split('T')[0],
    Line: [],
  };

  if (data.depositAccountId) {
    salesReceiptData.DepositToAccountRef = { value: data.depositAccountId };
  }

  if (data.referenceNumber) {
    salesReceiptData.PrivateNote = data.referenceNumber;
  }

  if (data.lineItems && data.lineItems.length > 0) {
    salesReceiptData.Line = data.lineItems.map((item, index) => ({
      Id: String(index + 1),
      LineNum: index + 1,
      Description: item.description,
      Amount: item.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        Qty: item.quantity || 1,
        UnitPrice: item.amount / (item.quantity || 1),
        ...(item.accountId && { ItemRef: { value: item.accountId } }),
      },
    }));
  } else {
    salesReceiptData.Line = [{
      Id: '1',
      LineNum: 1,
      Description: data.description,
      Amount: data.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        Qty: 1,
        UnitPrice: data.amount,
      },
    }];
  }

  if (data.paymentMethod) {
    salesReceiptData.PaymentMethodRef = { name: data.paymentMethod };
  }

  const response = await makeApiRequest<any>(tenantId, '/salesreceipt', {
    method: 'POST',
    body: salesReceiptData,
  });

  return {
    receiptId: response.SalesReceipt.Id,
    docNumber: response.SalesReceipt.DocNumber,
  };
}

export async function createInvoice(
  tenantId: string,
  data: {
    customerId: string;
    amount: number;
    description: string;
    lineItems?: Array<{
      description: string;
      amount: number;
      quantity?: number;
      accountId?: string;
    }>;
    dueDate?: Date;
    txnDate?: Date;
    referenceNumber?: string;
  }
): Promise<{ invoiceId: string; docNumber: string }> {
  const invoiceData: any = {
    CustomerRef: { value: data.customerId },
    TxnDate: (data.txnDate || new Date()).toISOString().split('T')[0],
    Line: [],
  };

  if (data.dueDate) {
    invoiceData.DueDate = data.dueDate.toISOString().split('T')[0];
  }

  if (data.referenceNumber) {
    invoiceData.PrivateNote = data.referenceNumber;
  }

  if (data.lineItems && data.lineItems.length > 0) {
    invoiceData.Line = data.lineItems.map((item, index) => ({
      Id: String(index + 1),
      LineNum: index + 1,
      Description: item.description,
      Amount: item.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        Qty: item.quantity || 1,
        UnitPrice: item.amount / (item.quantity || 1),
        ...(item.accountId && { ItemRef: { value: item.accountId } }),
      },
    }));
  } else {
    invoiceData.Line = [{
      Id: '1',
      LineNum: 1,
      Description: data.description,
      Amount: data.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        Qty: 1,
        UnitPrice: data.amount,
      },
    }];
  }

  const response = await makeApiRequest<any>(tenantId, '/invoice', {
    method: 'POST',
    body: invoiceData,
  });

  return {
    invoiceId: response.Invoice.Id,
    docNumber: response.Invoice.DocNumber,
  };
}

export async function syncTransaction(
  tenantId: string,
  transaction: SyncTransactionRequest
): Promise<{
  success: boolean;
  qbId: string;
  docNumber: string;
  type: 'sales_receipt' | 'invoice';
}> {
  let customerId: string;

  if (transaction.customerId) {
    customerId = transaction.customerId;
  } else if (transaction.parentId) {
    const result = await syncCustomerFromParent(tenantId, transaction.parentId);
    customerId = result.customerId;
  } else if (transaction.householdId) {
    const result = await syncCustomerFromHousehold(tenantId, transaction.householdId);
    customerId = result.customerId;
  } else {
    throw new Error('Either customerId, parentId, or householdId is required');
  }

  const description = transaction.sessionName 
    ? `${transaction.description} - ${transaction.sessionName}${transaction.playerNames?.length ? ` (${transaction.playerNames.join(', ')})` : ''}`
    : transaction.description;

  if (transaction.type === 'invoice') {
    const result = await createInvoice(tenantId, {
      customerId,
      amount: transaction.amount,
      description,
      txnDate: transaction.txnDate,
      referenceNumber: transaction.paymentId,
    });

    return {
      success: true,
      qbId: result.invoiceId,
      docNumber: result.docNumber,
      type: 'invoice',
    };
  }

  const result = await createSalesReceipt(tenantId, {
    customerId,
    amount: transaction.amount,
    description,
    paymentMethod: transaction.paymentMethod,
    depositAccountId: transaction.depositAccountId,
    txnDate: transaction.txnDate,
    referenceNumber: transaction.paymentId,
  });

  return {
    success: true,
    qbId: result.receiptId,
    docNumber: result.docNumber,
    type: 'sales_receipt',
  };
}

export async function testConnection(tenantId: string): Promise<{
  success: boolean;
  companyName?: string;
  error?: string;
}> {
  try {
    const companyInfo = await fetchCompanyInfo(tenantId);
    
    await db.update(quickbooksConnections)
      .set({
        syncStatus: 'idle',
        lastSyncAt: new Date(),
        lastError: null,
        companyName: companyInfo?.CompanyName,
        updatedAt: new Date(),
      })
      .where(eq(quickbooksConnections.tenantId, tenantId));

    return {
      success: true,
      companyName: companyInfo?.CompanyName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db.update(quickbooksConnections)
      .set({
        syncStatus: 'error',
        lastError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(quickbooksConnections.tenantId, tenantId));

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default {
  isQuickBooksEnabled,
  getAuthorizationUrl,
  handleCallback,
  disconnect,
  getConnection,
  refreshTokenIfNeeded,
  fetchCompanyInfo,
  fetchAccounts,
  findOrCreateCustomer,
  syncCustomerFromParent,
  syncCustomerFromHousehold,
  createSalesReceipt,
  createInvoice,
  syncTransaction,
  testConnection,
};

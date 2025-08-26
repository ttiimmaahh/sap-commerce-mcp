import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { randomUUID } from "crypto";

const SAP_API_BASE = "https://api.c90spw6e32-arganollc1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2";
const USER_AGENT = "sap-commerce-mcp/1.0";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Interfaces for SAP Commerce API responses
interface SAPProduct {
  code: string;
  name: string;
  description?: string;
  price?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  stock?: {
    stockLevel: number;
    stockLevelStatus: string;
  };
  images?: Array<{
    url: string;
    format: string;
    altText?: string;
  }>;
  url?: string;
}

interface SAPProductSearchResponse {
  products: SAPProduct[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
  facets?: Array<{
    name: string;
    values: Array<{
      name: string;
      count: number;
    }>;
  }>;
}

// Interfaces for SAP Commerce Order API responses
interface SAPOrderHistory {
  code: string;
  status: string;
  statusDisplay: string;
  placed: string;
  guid?: string;
  total: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  costCenter?: {
    code: string;
    name: string;
  };
  orgUnit?: {
    uid: string;
    name: string;
  };
  purchaseOrderNumber?: string;
  orgCustomer?: {
    uid: string;
    name: string;
  };
}

interface SAPOrderHistoryResponse {
  orders: SAPOrderHistory[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
  sorts?: Array<{
    code: string;
    name: string;
    selected: boolean;
  }>;
}

interface SAPOrderEntry {
  entryNumber: number;
  quantity: number;
  basePrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalPrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  product?: {
    code: string;
    name: string;
    description?: string;
  };
  updateable?: boolean;
  deliveryMode?: {
    code: string;
    name: string;
  };
}

interface SAPOrder {
  code: string;
  status: string;
  statusDisplay: string;
  placed: string;
  guid?: string;
  net?: boolean;
  totalPriceWithTax?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalPrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalTax?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  subTotal?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  deliveryCost?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  entries?: SAPOrderEntry[];
  totalItems?: number;
  deliveryMode?: {
    code: string;
    name: string;
    description?: string;
  };
  deliveryAddress?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    town: string;
    postalCode?: string;
    country?: {
      isocode: string;
      name: string;
    };
  };
  paymentInfo?: {
    accountHolderName?: string;
    cardType?: {
      code: string;
      name: string;
    };
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
  user?: {
    uid: string;
    name: string;
  };
  costCenter?: {
    code: string;
    name: string;
  };
  orgUnit?: {
    uid: string;
    name: string;
  };
  purchaseOrderNumber?: string;
}

// Interfaces for B2B Organization User Cart Management
interface SAPB2BCart extends SAPCart {
  name?: string;
  created?: string;
  costCenter?: {
    code: string;
    name: string;
    currency?: {
      isocode: string;
      symbol: string;
    };
  };
  paymentType?: {
    code: string;
    displayName: string;
  };
  orgCustomer?: {
    uid: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    orgUnit?: {
      uid: string;
      name: string;
    };
  };
}

interface SAPB2BOrder extends SAPOrder {
  created?: string;
  costCenter?: {
    code: string;
    name: string;
    currency?: {
      isocode: string;
      symbol: string;
    };
  };
  orgUnit?: {
    uid: string;
    name: string;
  };
  orgCustomer?: {
    uid: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sapQuoteCode?: string;
}

// Interfaces for SAP Commerce Cart and Checkout API responses
interface SAPCartEntry {
  entryNumber: number;
  quantity: number;
  basePrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalPrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  product?: {
    code: string;
    name: string;
    description?: string;
    url?: string;
    images?: Array<{
      url: string;
      format: string;
      altText?: string;
    }>;
  };
  updateable?: boolean;
  deliveryMode?: {
    code: string;
    name: string;
  };
  deliveryPointOfService?: {
    name: string;
    displayName?: string;
  };
}

interface SAPCart {
  code: string;
  guid?: string;
  net?: boolean;
  totalPriceWithTax?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalPrice?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  totalTax?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  subTotal?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  deliveryCost?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
  entries?: SAPCartEntry[];
  totalItems?: number;
  totalUnitCount?: number;
  deliveryItemsQuantity?: number;
  pickupItemsQuantity?: number;
  deliveryMode?: {
    code: string;
    name: string;
    description?: string;
    deliveryCost?: {
      value: number;
      currencyIso: string;
      formattedValue: string;
    };
  };
  deliveryAddress?: SAPAddress;
  paymentInfo?: SAPPaymentDetails;
  user?: {
    uid: string;
    name: string;
  };
  appliedOrderPromotions?: Array<{
    promotion?: {
      code: string;
      title?: string;
      description?: string;
    };
    description?: string;
  }>;
  appliedProductPromotions?: Array<{
    promotion?: {
      code: string;
      title?: string;
      description?: string;
    };
    description?: string;
  }>;
  appliedVouchers?: Array<{
    code: string;
    name?: string;
    description?: string;
    value?: number;
    currency?: {
      isocode: string;
      name: string;
    };
  }>;
  potentialOrderPromotions?: Array<{
    promotion?: {
      code: string;
      title?: string;
      description?: string;
    };
    description?: string;
  }>;
  potentialProductPromotions?: Array<{
    promotion?: {
      code: string;
      title?: string;
      description?: string;
    };
    description?: string;
  }>;
  costCenter?: {
    code: string;
    name: string;
  };
  purchaseOrderNumber?: string;
  calculated?: boolean;
  _messages?: Array<{
    type: string;
    message: string;
    subject?: string;
  }>;
}

interface SAPAddress {
  id?: string;
  firstName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  town: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  country?: {
    isocode: string;
    name: string;
  };
  region?: {
    isocode: string;
    name: string;
  };
  defaultAddress?: boolean;
  billingAddress?: boolean;
  shippingAddress?: boolean;
  visibleInAddressBook?: boolean;
}

interface SAPPaymentDetails {
  id?: string;
  accountHolderName?: string;
  cardType?: {
    code: string;
    name: string;
  };
  cardNumber?: string;
  startMonth?: string;
  startYear?: string;
  expiryMonth?: string;
  expiryYear?: string;
  issueNumber?: string;
  subscriptionId?: string;
  saved?: boolean;
  defaultPayment?: boolean;
  billingAddress?: SAPAddress;
}

interface SAPDeliveryMode {
  code: string;
  name: string;
  description?: string;
  deliveryCost?: {
    value: number;
    currencyIso: string;
    formattedValue: string;
  };
}

interface SAPDeliveryModeList {
  deliveryModes: SAPDeliveryMode[];
}

interface SAPCartModification {
  cartCode?: string;
  deliveryModeChanged?: boolean;
  entry?: SAPCartEntry;
  quantity?: number;
  quantityAdded?: number;
  statusCode?: string;
  statusMessage?: string;
}

// Helper function for making SAP Commerce API requests
async function makeRequest<T>(
  url: string, 
  token: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T | null> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SAP Commerce API error! status: ${response.status}, message: ${errorText}`);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making SAP Commerce API request:", error);
    throw error;
  }
}

// Format product data for display
function formatProduct(product: SAPProduct): string {
  const sections = [
    `**${product.name}** (${product.code})`,
    product.description ? `Description: ${product.description}` : null,
    product.price ? `Price: ${product.price.formattedValue}` : null,
    product.stock ? `Stock: ${product.stock.stockLevel} (${product.stock.stockLevelStatus})` : null,
    product.url ? `URL: ${product.url}` : null,
  ].filter(Boolean);
  
  return sections.join('\n') + '\n---';
}

// Format order history data for display
function formatOrderHistory(order: SAPOrderHistory): string {
  const sections = [
    `**Order ${order.code}**`,
    `Status: ${order.statusDisplay || order.status}`,
    `Placed: ${new Date(order.placed).toLocaleDateString()}`,
    `Total: ${order.total.formattedValue}`,
    order.purchaseOrderNumber ? `PO Number: ${order.purchaseOrderNumber}` : null,
    order.costCenter ? `Cost Center: ${order.costCenter.name} (${order.costCenter.code})` : null,
    order.orgUnit ? `Organization: ${order.orgUnit.name}` : null,
  ].filter(Boolean);
  
  return sections.join('\n') + '\n---';
}

// Format order details for display
function formatOrderDetails(order: SAPOrder): string {
  const sections = [
    `**Order ${order.code}**`,
    `Status: ${order.statusDisplay || order.status}`,
    `Placed: ${new Date(order.placed).toLocaleDateString()}`,
    '',
    '**Pricing:**',
    order.subTotal ? `Subtotal: ${order.subTotal.formattedValue}` : null,
    order.deliveryCost ? `Delivery: ${order.deliveryCost.formattedValue}` : null,
    order.totalTax ? `Tax: ${order.totalTax.formattedValue}` : null,
    order.totalPriceWithTax ? `Total (incl. tax): ${order.totalPriceWithTax.formattedValue}` : 
      order.totalPrice ? `Total: ${order.totalPrice.formattedValue}` : null,
    '',
  ].filter(Boolean);

  // Add delivery information
  if (order.deliveryMode) {
    sections.push('**Delivery:**');
    sections.push(`Mode: ${order.deliveryMode.name}`);
    if (order.deliveryAddress) {
      const addr = order.deliveryAddress;
      const addressLines = [
        addr.firstName && addr.lastName ? `${addr.firstName} ${addr.lastName}` : null,
        addr.line1,
        addr.line2,
        `${addr.town}${addr.postalCode ? ` ${addr.postalCode}` : ''}`,
        addr.country?.name,
      ].filter(Boolean);
      sections.push(`Address: ${addressLines.join(', ')}`);
    }
    sections.push('');
  }

  // Add business information
  const businessInfo = [
    order.purchaseOrderNumber ? `PO Number: ${order.purchaseOrderNumber}` : null,
    order.costCenter ? `Cost Center: ${order.costCenter.name} (${order.costCenter.code})` : null,
    order.orgUnit ? `Organization: ${order.orgUnit.name}` : null,
  ].filter(Boolean);
  
  if (businessInfo.length > 0) {
    sections.push('**Business Info:**');
    sections.push(...businessInfo);
    sections.push('');
  }

  // Add order entries
  if (order.entries && order.entries.length > 0) {
    sections.push('**Items:**');
    order.entries.forEach((entry, index) => {
      const itemInfo = [
        `${index + 1}. ${entry.product?.name || 'Product'} (${entry.product?.code || 'N/A'})`,
        `   Quantity: ${entry.quantity}`,
        entry.totalPrice ? `   Price: ${entry.totalPrice.formattedValue}` : null,
        entry.deliveryMode ? `   Delivery: ${entry.deliveryMode.name}` : null,
      ].filter(Boolean);
      sections.push(...itemInfo);
    });
  }

  return sections.join('\n');
}

// Format cart entry data for display
function formatCartEntry(entry: SAPCartEntry, index: number): string {
  const sections = [
    `${index + 1}. **${entry.product?.name || 'Product'}** (${entry.product?.code || 'N/A'})`,
    `   Quantity: ${entry.quantity}`,
    entry.basePrice ? `   Unit Price: ${entry.basePrice.formattedValue}` : null,
    entry.totalPrice ? `   Total: ${entry.totalPrice.formattedValue}` : null,
    entry.deliveryMode ? `   Delivery: ${entry.deliveryMode.name}` : null,
    entry.deliveryPointOfService ? `   Pickup: ${entry.deliveryPointOfService.displayName || entry.deliveryPointOfService.name}` : null,
  ].filter(Boolean);
  
  return sections.join('\n');
}

// Format cart data for display
function formatCart(cart: SAPCart): string {
  const sections = [
    `**Cart ${cart.code}**`,
    cart.user ? `Customer: ${cart.user.name} (${cart.user.uid})` : null,
    '',
    '**Summary:**',
    cart.totalItems ? `Total Items: ${cart.totalItems}` : null,
    cart.totalUnitCount ? `Total Units: ${cart.totalUnitCount}` : null,
    cart.subTotal ? `Subtotal: ${cart.subTotal.formattedValue}` : null,
    cart.deliveryCost ? `Delivery: ${cart.deliveryCost.formattedValue}` : null,
    cart.totalTax ? `Tax: ${cart.totalTax.formattedValue}` : null,
    cart.totalPriceWithTax ? `Total (incl. tax): ${cart.totalPriceWithTax.formattedValue}` : 
      cart.totalPrice ? `Total: ${cart.totalPrice.formattedValue}` : null,
    '',
  ].filter(Boolean);

  // Add delivery information
  if (cart.deliveryMode) {
    sections.push('**Delivery Method:**');
    sections.push(`${cart.deliveryMode.name}${cart.deliveryMode.description ? ` - ${cart.deliveryMode.description}` : ''}`);
    if (cart.deliveryMode.deliveryCost) {
      sections.push(`Cost: ${cart.deliveryMode.deliveryCost.formattedValue}`);
    }
    sections.push('');
  }

  // Add delivery address
  if (cart.deliveryAddress) {
    sections.push('**Delivery Address:**');
    const addr = cart.deliveryAddress;
    const addressLines = [
      addr.firstName && addr.lastName ? `${addr.firstName} ${addr.lastName}` : null,
      addr.line1,
      addr.line2,
      `${addr.town}${addr.postalCode ? ` ${addr.postalCode}` : ''}`,
      addr.country?.name,
    ].filter(Boolean);
    sections.push(addressLines.join(', '));
    if (addr.phone) sections.push(`Phone: ${addr.phone}`);
    sections.push('');
  }

  // Add payment information
  if (cart.paymentInfo) {
    sections.push('**Payment Method:**');
    const payment = cart.paymentInfo;
    if (payment.cardType && payment.cardNumber) {
      sections.push(`${payment.cardType.name} ending in ${payment.cardNumber.slice(-4)}`);
    }
    if (payment.accountHolderName) {
      sections.push(`Cardholder: ${payment.accountHolderName}`);
    }
    if (payment.expiryMonth && payment.expiryYear) {
      sections.push(`Expires: ${payment.expiryMonth}/${payment.expiryYear}`);
    }
    sections.push('');
  }

  // Add business information
  const businessInfo = [
    cart.purchaseOrderNumber ? `PO Number: ${cart.purchaseOrderNumber}` : null,
    cart.costCenter ? `Cost Center: ${cart.costCenter.name} (${cart.costCenter.code})` : null,
  ].filter(Boolean);
  
  if (businessInfo.length > 0) {
    sections.push('**Business Info:**');
    sections.push(...businessInfo);
    sections.push('');
  }

  // Add cart entries
  if (cart.entries && cart.entries.length > 0) {
    sections.push('**Items:**');
    cart.entries.forEach((entry, index) => {
      sections.push(formatCartEntry(entry, index));
    });
    sections.push('');
  }

  // Add promotions
  if (cart.appliedOrderPromotions && cart.appliedOrderPromotions.length > 0) {
    sections.push('**Applied Promotions:**');
    cart.appliedOrderPromotions.forEach(promo => {
      sections.push(`- ${promo.promotion?.title || promo.promotion?.code || 'Promotion'}: ${promo.description || 'Discount applied'}`);
    });
    sections.push('');
  }

  // Add vouchers
  if (cart.appliedVouchers && cart.appliedVouchers.length > 0) {
    sections.push('**Applied Vouchers:**');
    cart.appliedVouchers.forEach(voucher => {
      sections.push(`- ${voucher.name || voucher.code}${voucher.value ? ` (${voucher.currency?.isocode || ''} ${voucher.value})` : ''}`);
    });
    sections.push('');
  }

  // Add messages if any
  if (cart._messages && cart._messages.length > 0) {
    sections.push('**Messages:**');
    cart._messages.forEach(msg => {
      sections.push(`- ${msg.type.toUpperCase()}: ${msg.message}`);
    });
    }
  
  return sections.join('\n');
}

// Format B2B cart data for display
function formatB2BCart(cart: SAPB2BCart): string {
  const sections = [
    `**B2B Cart ${cart.code}**`,
    cart.name ? `Name: ${cart.name}` : null,
    cart.totalPriceWithTax ? `Total: ${cart.totalPriceWithTax.formattedValue}` : null,
    cart.totalItems ? `Items: ${cart.totalItems}` : null,
    cart.costCenter ? `Cost Center: ${cart.costCenter.name} (${cart.costCenter.code})` : null,
    cart.orgCustomer ? `Organization User: ${cart.orgCustomer.name} (${cart.orgCustomer.uid})` : null,
    cart.orgCustomer?.orgUnit ? `Organization Unit: ${cart.orgCustomer.orgUnit.name}` : null,
    cart.paymentType ? `Payment Type: ${cart.paymentType.displayName}` : null,
    cart.purchaseOrderNumber ? `PO Number: ${cart.purchaseOrderNumber}` : null,
    cart.created ? `Created: ${new Date(cart.created).toLocaleDateString()}` : null,
  ].filter(Boolean);
  
  if (cart.entries && cart.entries.length > 0) {
    sections.push('', '**Cart Items:**');
    cart.entries.forEach((entry, index) => {
      sections.push(formatCartEntry(entry, index));
    });
  }
  
  return sections.join('\n');
}

// Create MCP server instance
const server = new McpServer({
  name: "sap-commerce",
  version: "1.0.0",
});

// Register SAP Commerce tools
server.tool(
  "product-search",
  "Search for products in SAP Commerce",
  {
    baseSiteUrl: z.string().describe("Base Site URL (e.g., 'https://mysiteUrl')"),
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    query: z.string().optional().describe("Search query for products"),
    pageSize: z.number().optional().default(20).describe("Number of results per page"),
    currentPage: z.number().optional().default(0).describe("Page number (0-based)"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ baseSiteId, query, pageSize, currentPage, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      let searchUrl = `${SAP_API_BASE}/${baseSiteId}/products/search?`;
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        currentPage: currentPage.toString(),
        fields: fields,
      });
      
      if (query) {
        params.append('query', query);
      }
      
      searchUrl += params.toString();

      const productSearchData = await makeRequest<SAPProductSearchResponse>(searchUrl, token);

      if (!productSearchData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve product search data from SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      const products = productSearchData.products || [];
      if (products.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: query 
                ? `No products found for query "${query}" in base site "${baseSiteId}"`
                : `No products found in base site "${baseSiteId}"`,
            },
          ],
        };
      }

      const formattedProducts = products.map(formatProduct);
      const searchSummary = query 
        ? `Product search results for "${query}" in ${baseSiteId}:`
        : `Product listing for ${baseSiteId}:`;
      
      const paginationInfo = productSearchData.pagination 
        ? `\n\nShowing page ${productSearchData.pagination.currentPage + 1} of ${productSearchData.pagination.totalPages} (${productSearchData.pagination.totalResults} total results)`
        : '';

      const productsText = `${searchSummary}${paginationInfo}\n\n${formattedProducts.join('\n')}`;

      return {
        content: [
          {
            type: "text",
            text: productsText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching products: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-base-sites",
  "Get available base sites from SAP Commerce",
  {
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ fields }, extra) => {
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided.",
          },
        ],
        isError: true,
      };
    }

    try {
      const baseSitesUrl = `${SAP_API_BASE}/basesites?fields=${fields}`;
      const baseSitesData = await makeRequest<{ baseSites: Array<{ uid: string; name: string; }> }>(baseSitesUrl, token);

      if (!baseSitesData?.baseSites) {
        return {
          content: [
            {
              type: "text",
              text: "No base sites found or failed to retrieve base sites",
            },
          ],
          isError: true,
        };
      }

      const sitesText = baseSitesData.baseSites
        .map(site => `- **${site.uid}**: ${site.name || site.uid}`)
        .join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Available base sites:\n\n${sitesText}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving base sites: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "order-history",
  "Get user's order history from SAP Commerce (limited to 5 most recent orders)",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    pageSize: z.number().optional().default(5).describe("Number of orders to retrieve (max 5)"),
    statuses: z.string().optional().describe("Filter by order statuses (comma-separated)"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ baseSiteId, userId, pageSize, statuses, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    // Limit pageSize to maximum of 5 for order history
    const limitedPageSize = Math.min(pageSize, 5);

    try {
      let orderHistoryUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/orders?`;
      const params = new URLSearchParams({
        pageSize: limitedPageSize.toString(),
        currentPage: '0',
        fields: fields,
      });
      
      if (statuses) {
        params.append('statuses', statuses);
      }
      
      orderHistoryUrl += params.toString();

      const orderHistoryData = await makeRequest<SAPOrderHistoryResponse>(orderHistoryUrl, token);

      if (!orderHistoryData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve order history from SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      const orders = orderHistoryData.orders || [];
      if (orders.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No orders found for user "${userId}" in base site "${baseSiteId}"`,
            },
          ],
        };
      }

      const formattedOrders = orders.map(formatOrderHistory);
      const ordersSummary = `Order history for ${userId} in ${baseSiteId} (${orders.length} most recent orders):`;
      
      const paginationInfo = orderHistoryData.pagination 
        ? `\n\nShowing ${orders.length} of ${orderHistoryData.pagination.totalResults} total orders`
        : '';

      const ordersText = `${ordersSummary}${paginationInfo}\n\n${formattedOrders.join('\n')}`;

      return {
        content: [
          {
            type: "text",
            text: ordersText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving order history: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "order-details",
  "Get detailed information about a specific order from SAP Commerce.  The user will provide the order code, also known as order number or order id.",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    orderCode: z.string().describe("Order code/identifier to retrieve details for"),
    fields: z.string().optional().default("FULL").describe("Response field configuration (DEFAULT, BASIC, FULL)"),
  },
  async ({ baseSiteId, userId, orderCode, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const orderDetailsUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/orders/${orderCode}?fields=${fields}`;

      const orderData = await makeRequest<SAPOrder>(orderDetailsUrl, token);

      if (!orderData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve order details for order "${orderCode}" from SAP Commerce API`,
            },
          ],
          isError: true,
        };
      }

      const formattedOrder = formatOrderDetails(orderData);
      const orderDetailsText = `Order details for ${orderCode}:\n\n${formattedOrder}`;

      return {
        content: [
          {
            type: "text",
            text: orderDetailsText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving order details: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "add-to-cart",
  "Add a product to the user's shopping cart in SAP Commerce",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    productCode: z.string().describe("Product code to add to cart"),
    quantity: z.number().optional().default(1).describe("Quantity to add (default: 1)"),
    pickupStore: z.string().optional().describe("Pickup store name for in-store pickup"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration")
  },
  async ({ baseSiteId, userId, productCode, quantity, pickupStore, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const addToCartUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/current/entries`;
      
      const requestBody: any = {
        product: { code: productCode },
        quantity: quantity,
      };

      if (pickupStore) {
        requestBody.deliveryPointOfService = { name: pickupStore };
      }

      const params = new URLSearchParams({
        fields: fields,
      });

      const fullUrl = `${addToCartUrl}?${params.toString()}`;

      const cartModificationData = await makeRequest<SAPCartModification>(fullUrl, token, 'POST', requestBody);

      if (!cartModificationData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to add product to cart via SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      let resultText = `Product added to cart successfully!\n\n`;
      
      if (cartModificationData.entry) {
        const entry = cartModificationData.entry;
        resultText += `**Product:** ${entry.product?.name || productCode}\n`;
        resultText += `**Quantity Added:** ${cartModificationData.quantityAdded || quantity}\n`;
        if (entry.totalPrice) {
          resultText += `**Line Total:** ${entry.totalPrice.formattedValue}\n`;
        }
        if (pickupStore && entry.deliveryPointOfService) {
          resultText += `**Pickup Store:** ${entry.deliveryPointOfService.displayName || entry.deliveryPointOfService.name}\n`;
        }
      }

      if (cartModificationData.statusCode && cartModificationData.statusCode !== 'success') {
        resultText += `\n**Status:** ${cartModificationData.statusCode}`;
        if (cartModificationData.statusMessage) {
          resultText += ` - ${cartModificationData.statusMessage}`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error adding product to cart: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-cart",
  "Get the current shopping cart details from SAP Commerce",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    fields: z.string().optional().default("FULL").describe("Response field configuration (DEFAULT, BASIC, FULL)"),
  },
  async ({ baseSiteId, userId, cartId, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const cartUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/${cartId}?fields=${fields}`;

      const cartData = await makeRequest<SAPCart>(cartUrl, token);

      if (!cartData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve cart "${cartId}" from SAP Commerce API`,
            },
          ],
          isError: true,
        };
      }

      const formattedCart = formatCart(cartData);
      const cartDetailsText = `Cart details:\n\n${formattedCart}`;

      return {
        content: [
          {
            type: "text",
            text: cartDetailsText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving cart: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "update-cart-entry",
  "Update the quantity of a product in the user's cart or remove it entirely",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    entryNumber: z.number().describe("Cart entry number to update"),
    quantity: z.number().describe("New quantity (use 0 to remove the item)"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ baseSiteId, userId, entryNumber, quantity, cartId, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const updateUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/${cartId}/entries/${entryNumber}`;
      
      const requestBody = {
        quantity: quantity,
      };

      const params = new URLSearchParams({
        fields: fields,
      });

      const fullUrl = `${updateUrl}?${params.toString()}`;

      const method = quantity > 0 ? 'PUT' : 'DELETE';
      const cartModificationData = await makeRequest<SAPCartModification>(
        fullUrl, 
        token, 
        method, 
        quantity > 0 ? requestBody : undefined
      );

      if (!cartModificationData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to update cart entry via SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      let resultText = quantity > 0 
        ? `Cart entry updated successfully!\n\n`
        : `Cart entry removed successfully!\n\n`;
      
      if (cartModificationData.entry) {
        const entry = cartModificationData.entry;
        resultText += `**Product:** ${entry.product?.name || 'Product'}\n`;
        if (quantity > 0) {
          resultText += `**New Quantity:** ${cartModificationData.quantity || quantity}\n`;
          if (entry.totalPrice) {
            resultText += `**Line Total:** ${entry.totalPrice.formattedValue}\n`;
          }
        }
      }

      if (cartModificationData.statusCode && cartModificationData.statusCode !== 'success') {
        resultText += `\n**Status:** ${cartModificationData.statusCode}`;
        if (cartModificationData.statusMessage) {
          resultText += ` - ${cartModificationData.statusMessage}`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating cart entry: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "set-delivery-address",
  "Set the delivery address for the user's cart",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    addressId: z.string().optional().describe("Existing address ID to use"),
    firstName: z.string().optional().describe("First name (required if creating new address)"),
    lastName: z.string().optional().describe("Last name (required if creating new address)"),
    line1: z.string().optional().describe("Address line 1 (required if creating new address)"),
    line2: z.string().optional().describe("Address line 2"),
    town: z.string().optional().describe("City/Town (required if creating new address)"),
    postalCode: z.string().optional().describe("Postal/ZIP code"),
    countryIsocode: z.string().optional().describe("Country ISO code (e.g., 'US', 'DE')"),
    regionIsocode: z.string().optional().describe("Region/State ISO code"),
    phone: z.string().optional().describe("Phone number"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
  },
  async ({ baseSiteId, userId, addressId, firstName, lastName, line1, line2, town, postalCode, countryIsocode, regionIsocode, phone, cartId }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const setAddressUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/${cartId}/addresses/delivery`;
      
      let requestBody: any;
      
      if (addressId) {
        // Use existing address
        requestBody = { addressId: addressId };
      } else {
        // Create new address
        if (!firstName || !lastName || !line1 || !town || !countryIsocode) {
          return {
            content: [
              {
                type: "text",
                text: "Error: When not using an existing addressId, firstName, lastName, line1, town, and countryIsocode are required.",
              },
            ],
            isError: true,
          };
        }

        requestBody = {
          firstName,
          lastName,
          line1,
          town,
          country: { isocode: countryIsocode },
        };

        if (line2) requestBody.line2 = line2;
        if (postalCode) requestBody.postalCode = postalCode;
        if (regionIsocode) requestBody.region = { isocode: regionIsocode };
        if (phone) requestBody.phone = phone;
      }

      const addressData = await makeRequest<SAPAddress>(setAddressUrl, token, 'PUT', requestBody);

      if (!addressData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to set delivery address via SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      const addressLines = [
        addressData.firstName && addressData.lastName ? `${addressData.firstName} ${addressData.lastName}` : null,
        addressData.line1,
        addressData.line2,
        `${addressData.town}${addressData.postalCode ? ` ${addressData.postalCode}` : ''}`,
        addressData.country?.name,
      ].filter(Boolean);

      let resultText = `Delivery address set successfully!\n\n`;
      resultText += `**Address:**\n${addressLines.join('\n')}`;
      if (addressData.phone) {
        resultText += `\n**Phone:** ${addressData.phone}`;
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting delivery address: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "set-delivery-mode",
  "Set the delivery mode for the user's cart",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    deliveryModeId: z.string().describe("Delivery mode code (e.g., 'standard-gross', 'premium-gross')"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
  },
  async ({ baseSiteId, userId, deliveryModeId, cartId }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const setDeliveryModeUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/${cartId}/deliverymode?deliveryModeId=${deliveryModeId}`;

      const deliveryModeData = await makeRequest<any>(setDeliveryModeUrl, token, 'PUT');

      if (deliveryModeData === null) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to set delivery mode via SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      let resultText = `Delivery mode set successfully!\n\n`;
      resultText += `**Delivery Mode:** ${deliveryModeId}`;

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting delivery mode: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "get-delivery-modes",
  "Get available delivery modes for the user's cart",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
  },
  async ({ baseSiteId, userId, cartId }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    try {
      const deliveryModesUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/carts/${cartId}/deliverymodes`;

      const deliveryModesData = await makeRequest<SAPDeliveryModeList>(deliveryModesUrl, token);

      if (!deliveryModesData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve delivery modes from SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      const modes = deliveryModesData.deliveryModes || [];
      if (modes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No delivery modes available for this cart.",
            },
          ],
        };
      }

      let resultText = `Available delivery modes:\n\n`;
      
      modes.forEach((mode, index) => {
        resultText += `${index + 1}. **${mode.name}** (${mode.code})\n`;
        if (mode.description) {
          resultText += `   ${mode.description}\n`;
        }
        if (mode.deliveryCost) {
          resultText += `   Cost: ${mode.deliveryCost.formattedValue}\n`;
        }
        resultText += '\n';
      });

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving delivery modes: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "place-order",
  "Place an order from the user's current cart",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'electronics-spa')"),
    userId: z.string().describe("User identifier (use 'current' for authenticated user)"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    securityCode: z.string().optional().describe("Credit card security code (CVV) if required"),
    termsChecked: z.boolean().optional().default(true).describe("Confirm terms and conditions are accepted"),
    fields: z.string().optional().default("FULL").describe("Response field configuration"),
  },
  async ({ baseSiteId, userId, cartId, securityCode, termsChecked, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No access token provided. Please ensure your MCP client is configured to pass an access token.",
          },
        ],
        isError: true,
      };
    }

    if (!termsChecked) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Terms and conditions must be accepted before placing an order.",
          },
        ],
        isError: true,
      };
    }

    try {
      const placeOrderUrl = `${SAP_API_BASE}/${baseSiteId}/users/${userId}/orders`;
      
      const requestBody: any = {
        cartId: cartId,
        termsChecked: termsChecked,
      };

      if (securityCode) {
        requestBody.securityCode = securityCode;
      }

      const params = new URLSearchParams({
        fields: fields,
      });

      const fullUrl = `${placeOrderUrl}?${params.toString()}`;

      const orderData = await makeRequest<SAPOrder>(fullUrl, token, 'POST', requestBody);

      if (!orderData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to place order via SAP Commerce API",
            },
          ],
          isError: true,
        };
      }

      const formattedOrder = formatOrderDetails(orderData);
      let resultText = `🎉 **ORDER PLACED SUCCESSFULLY!** 🎉\n\n`;
      resultText += `**Order Number:** ${orderData.code}\n`;
      resultText += `**Order Status:** ${orderData.statusDisplay || orderData.status}\n`;
      if (orderData.totalPriceWithTax) {
        resultText += `**Total Amount:** ${orderData.totalPriceWithTax.formattedValue}\n`;
      } else if (orderData.totalPrice) {
        resultText += `**Total Amount:** ${orderData.totalPrice.formattedValue}\n`;
      }
      resultText += `\n${formattedOrder}`;

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error placing order: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "b2b-add-to-cart",
  "Add a product to an organization user's B2B cart in SAP Commerce",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'powertools-spa')"),
    orgUserId: z.string().describe("Organization user identifier (use 'current' for authenticated user)"),
    productCode: z.string().describe("Product code to add to cart"),
    quantity: z.number().optional().default(1).describe("Quantity to add (default: 1)"),
    pickupStore: z.string().optional().describe("Pickup store name for in-store pickup"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
  },
  async ({ baseSiteId, orgUserId, productCode, quantity, pickupStore, fields, cartId }, extra) => {
    console.log('Starting b2b-add-to-cart');

    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "No SAP Commerce access token provided. Please authenticate first.",
          },
        ],
        isError: true,
      };
    }

    try {
      const url = `${SAP_API_BASE}/${baseSiteId}/orgUsers/${orgUserId}/carts/${cartId}/entries`;
      
      const params = new URLSearchParams();
      params.append('quantity', (quantity || 1).toString());
      params.append('code', productCode);
      params.append('lang', 'en');
      params.append('curr', 'USD');
      
      if (pickupStore) {
        params.append('pickupStore', pickupStore);
      }
      if (fields) {
        params.append('fields', fields);
      }

      const fullUrl = `${url}?${params.toString()}`;
      console.log("fullUrl: ", fullUrl);
      
      const cartEntry = await makeRequest<SAPCartEntry>(fullUrl, token, 'POST');
      
      if (!cartEntry) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to add product to B2B cart. The API returned no data.",
            },
          ],
          isError: true,
        };
      }

      const resultText = [
        `**Product Added to B2B Cart**`,
        `Product: ${cartEntry.product?.name || productCode}`,
        `Quantity: ${cartEntry.quantity}`,
        `Entry Number: ${cartEntry.entryNumber}`,
        cartEntry.totalPrice ? `Total Price: ${cartEntry.totalPrice.formattedValue}` : null,
        cartEntry.deliveryPointOfService ? `Pickup Store: ${cartEntry.deliveryPointOfService.displayName || cartEntry.deliveryPointOfService.name}` : null,
      ].filter(Boolean).join('\n');

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error adding product to B2B cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "b2b-get-cart",
  "Get organization user's current B2B cart details from SAP Commerce",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'powertools-spa')"),
    orgUserId: z.string().describe("Organization user identifier (e.g., 'mark.rivers@pronto-hw.com')"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ baseSiteId, orgUserId, cartId, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "No SAP Commerce access token provided. Please authenticate first.",
          },
        ],
        isError: true,
      };
    }

    try {
      const url = `${SAP_API_BASE}/${baseSiteId}/orgUsers/${orgUserId}/carts/${cartId}`;
      
      const params = new URLSearchParams();
      if (fields) params.append('fields', fields);

      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      console.log("fullUrl: ", fullUrl);
      
      const cartData = await makeRequest<SAPB2BCart>(fullUrl, token);
      
      if (!cartData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve B2B cart. The cart may not exist or you may not have access.",
            },
          ],
          isError: true,
        };
      }

      const formattedCart = formatB2BCart(cartData);
      const cartDetailsText = `B2B Cart details:\n\n${formattedCart}`;

      return {
        content: [
          {
            type: "text",
            text: cartDetailsText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving B2B cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "b2b-update-cart-entry",
  "Update the quantity of a product in an organization user's B2B cart or remove it entirely",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'powertools-spa')"),
    orgUserId: z.string().describe("Organization user identifier (e.g., 'mark.rivers@pronto-hw.com')"),
    entryNumber: z.number().describe("Cart entry number to update"),
    quantity: z.number().describe("New quantity (use 0 to remove the item)"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
  },
  async ({ baseSiteId, orgUserId, entryNumber, quantity, cartId, fields }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "No SAP Commerce access token provided. Please authenticate first.",
          },
        ],
        isError: true,
      };
    }

    try {
      const url = `${SAP_API_BASE}/${baseSiteId}/orgUsers/${orgUserId}/carts/${cartId}/entries/${entryNumber}`;
      
      const params = new URLSearchParams();
      if (fields) params.append('fields', fields);

      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      if (quantity === 0) {
        // Delete the entry
        await makeRequest(fullUrl, token, 'DELETE');
        
        return {
          content: [
            {
              type: "text",
              text: `Entry ${entryNumber} has been removed from the B2B cart.`,
            },
          ],
        };
      } else {
        // Update the quantity
        const requestBody = { quantity };
        const updatedEntry = await makeRequest<SAPCartEntry>(fullUrl, token, 'PUT', requestBody);
        
        if (!updatedEntry) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to update B2B cart entry. The API returned no data.",
              },
            ],
            isError: true,
          };
        }

        const resultText = [
          `**B2B Cart Entry Updated**`,
          `Product: ${updatedEntry.product?.name || 'N/A'}`,
          `Entry Number: ${updatedEntry.entryNumber}`,
          `New Quantity: ${updatedEntry.quantity}`,
          updatedEntry.totalPrice ? `Total Price: ${updatedEntry.totalPrice.formattedValue}` : null,
        ].filter(Boolean).join('\n');

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating B2B cart entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "b2b-place-order",
  "Place an order from an organization user's B2B cart in SAP Commerce",
  {
    baseSiteId: z.string().describe("Base site identifier (e.g., 'powertools-spa')"),
    orgUserId: z.string().describe("Organization user identifier (e.g., 'mark.rivers@pronto-hw.com')"),
    cartId: z.string().optional().default("current").describe("Cart identifier (default: 'current')"),
    purchaseOrderNumber: z.string().optional().describe("Purchase order number for B2B tracking"),
    fields: z.string().optional().default("DEFAULT").describe("Response field configuration"),
    termsChecked: z.boolean().optional().default(false).describe("Accept terms and conditions"),
  },
  async ({ baseSiteId, orgUserId, cartId, purchaseOrderNumber, fields, termsChecked }, extra) => {
    // Extract access token from the request metadata
    const token = (extra._meta as any)?.sapToken;
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "No SAP Commerce access token provided. Please authenticate first.",
          },
        ],
        isError: true,
      };
    }

    try {
      const url = `${SAP_API_BASE}/${baseSiteId}/orgUsers/${orgUserId}/orders`;
      
      const params = new URLSearchParams();
      params.append('cartId', cartId);
      
      if (purchaseOrderNumber) {
        params.append('purchaseOrderNumber', purchaseOrderNumber);
      }
      if (termsChecked) {
        params.append('termsChecked', termsChecked.toString());
      }
      if (fields) {
        params.append('fields', fields);
      }
      console.log("params: ", params.toString());

      const fullUrl = `${url}?${params.toString()}`;
      console.log("fullUrl: ", fullUrl);
      
      const orderData = await makeRequest<SAPB2BOrder>(fullUrl, token, 'POST');
      
      if (!orderData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to place B2B order. The API returned no data.",
            },
          ],
          isError: true,
        };
      }

      const orderDetails = [
        `**B2B Order Placed Successfully**`,
        `Order Code: ${orderData.code}`,
        orderData.status ? `Status: ${orderData.status}` : null,
        orderData.created ? `Created: ${new Date(orderData.created).toLocaleDateString()}` : null,
        orderData.totalPriceWithTax ? `Total: ${orderData.totalPriceWithTax.formattedValue}` : null,
        orderData.costCenter ? `Cost Center: ${orderData.costCenter.name} (${orderData.costCenter.code})` : null,
        orderData.orgUnit ? `Organization Unit: ${orderData.orgUnit.name}` : null,
        orderData.orgCustomer ? `Customer: ${orderData.orgCustomer.name} (${orderData.orgCustomer.uid})` : null,
        orderData.purchaseOrderNumber ? `PO Number: ${orderData.purchaseOrderNumber}` : null,
        orderData.sapQuoteCode ? `Quote Code: ${orderData.sapQuoteCode}` : null,
      ].filter(Boolean).join('\n');

      return {
        content: [
          {
            type: "text",
            text: orderDetails,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error placing B2B order: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development - configure for production
  exposedHeaders: ['mcp-session-id'], 
  // allowedHeaders: ['Content-Type', 'mcp-session-id'],
  // credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Custom middleware to extract access token and add to request context
app.use('/mcp', (req, res, next) => {
  const token = req.body.params?.arguments?.access_token ? req.body.params?.arguments?.access_token : null;
  
  if (token && req.body && req.body.params) {
    // Inject token into request metadata
    if (!req.body.params._meta) {
      req.body.params._meta = {};
    }
    req.body.params._meta.sapToken = token;
  }

  next();
});

// Store active sessions with timeout cleanup
const activeSessions = new Map<string, { transport: StreamableHTTPServerTransport; lastUsed: number; initialized: boolean }>();
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastUsed > SESSION_TIMEOUT) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      try {
        session.transport.close();
      } catch (error) {
        console.warn(`Error closing expired session ${sessionId}:`, error);
      }
      activeSessions.delete(sessionId);
    }
  }
}, 60 * 1000); // Check every minute

// Get or create transport for session
const getTransport = async (sessionId?: string) => {
  // If no session ID provided or session doesn't exist, create new one
  if (!sessionId || !activeSessions.has(sessionId)) {
    const newSessionId = sessionId || randomUUID();
    
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: (id) => {
        console.log(`New MCP session initialized: ${id}`);
        if (activeSessions.has(id)) {
          activeSessions.get(id)!.initialized = true;
        }
      },
      onsessionclosed: (id) => {
        console.log(`MCP session closed: ${id}`);
        activeSessions.delete(id);
      },
      enableJsonResponse: true,
    });

    // Connect server to transport for this session
    await server.connect(transport);
    console.log(`MCP server connected to transport for session: ${newSessionId}`);
    
    activeSessions.set(newSessionId, {
      transport,
      lastUsed: Date.now(),
      initialized: false
    });
    
    return transport;
  }
  
  // Update last used time for existing session
  const session = activeSessions.get(sessionId)!;
  session.lastUsed = Date.now();
  return session.transport;
};

// MCP endpoint
app.all('/mcp', async (req, res) => {
  try {
    // Extract session ID from headers
    const sessionId = req.headers['mcp-session-id'] as string;
    
    // Get or create transport for this session
    const transport = await getTransport(sessionId);

    // Token is already injected into request body metadata by middleware

    // Handle the request
    await transport.handleRequest(req, res, req.body);
    
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    server: 'sap-commerce-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start server
async function main() {
  app.listen(PORT, () => {
    console.log(`SAP Commerce MCP Server running on http://localhost:${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
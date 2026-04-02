const COMPANY_INFO = {
  legalName: 'Shilpika Retail Private Limited',
  brandName: 'Shilpika',
  line1: '22 Craft House, C.G. Road',
  line2: 'Ahmedabad, Gujarat 380009, India',
  gstin: '24ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  cin: 'U74999GJ2024PTC123456',
  supportEmail: 'care@shilpika.in',
  supportPhone: '+91 79 4100 2200',
};

const GST_RATE = 0.18;
const TAX_TYPE = 'IGST';
const MARKETPLACE_FEE_RATE = 0.001;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toWordsBelowThousand = (num) => {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return '';
  if (num < 20) return ones[num];
  if (num < 100) {
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim();
  }
  return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${toWordsBelowThousand(num % 100)}` : ''}`.trim();
};

const numberToIndianWords = (amount) => {
  const rounded = Math.round(Number(amount || 0));
  if (!rounded) return 'Zero Rupees Only';

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const remainder = rounded % 1000;

  const parts = [];
  if (crore) parts.push(`${toWordsBelowThousand(crore)} Crore`);
  if (lakh) parts.push(`${toWordsBelowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${toWordsBelowThousand(thousand)} Thousand`);
  if (remainder) parts.push(toWordsBelowThousand(remainder));

  return `${parts.join(' ')} Rupees Only`;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProductId = (item) => {
  if (!item?.product) return '';
  if (typeof item.product === 'string') return item.product;
  return item.product._id || '';
};

const getLineItems = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];

  return items.map((item, index) => {
    const qty = Number(item?.qty || 1);
    const totalAmount = Number(item?.subtotal || 0);
    const grossUnitPrice = qty > 0 ? totalAmount / qty : 0;
    const unitPrice = grossUnitPrice / (1 + GST_RATE);
    const netAmount = unitPrice * qty;
    const taxAmount = totalAmount - netAmount;

    return {
      serialNo: index + 1,
      description: item?.name || 'Product',
      hsn: '9997',
      qty,
      unitPrice,
      netAmount,
      taxRate: GST_RATE * 100,
      taxType: TAX_TYPE,
      taxAmount,
      totalAmount,
      productId: getProductId(item),
      slug: item?.slug || '',
    };
  });
};

const getInvoiceData = (order) => {
  const lineItems = getLineItems(order);
  const netTotal = lineItems.reduce((sum, row) => sum + row.netAmount, 0);
  const taxTotal = lineItems.reduce((sum, row) => sum + row.taxAmount, 0);
  const itemsTotal = lineItems.reduce((sum, row) => sum + row.totalAmount, 0);
  const marketplaceFees = Number(order?.shippingFee || Number((itemsTotal * MARKETPLACE_FEE_RATE).toFixed(2)));
  const grandTotal = Number(order?.total || itemsTotal + marketplaceFees);

  return {
    invoiceNumber: `INV-${order?.orderNumber || order?._id || 'NA'}`,
    invoiceDate: formatDate(order?.createdAt),
    orderNumber: order?.orderNumber || order?._id || '-',
    orderDate: formatDate(order?.createdAt),
    placeOfSupply: order?.address?.state || '-',
    paymentMethod: order?.paymentMethod || '-',
    paymentStatus: order?.paymentStatus || '-',
    marketplaceFees,
    netTotal,
    taxTotal,
    itemsTotal,
    grandTotal,
    amountInWords: numberToIndianWords(grandTotal),
    billTo: {
      fullName: order?.address?.fullName || '-',
      phone: order?.address?.phone || '-',
      line1: order?.address?.line1 || '-',
      line2: order?.address?.line2 || '',
      city: order?.address?.city || '-',
      state: order?.address?.state || '-',
      pincode: order?.address?.pincode || '-',
      country: order?.address?.country || 'India',
    },
    lineItems,
  };
};

const buildRows = (rows) =>
  rows
    .map(
      (row) => `
        <tr>
          <td>${row.serialNo}</td>
          <td>${escapeHtml(row.description)}</td>
          <td>${escapeHtml(row.hsn)}</td>
          <td>${row.qty}</td>
          <td class="num">${formatCurrency(row.unitPrice)}</td>
          <td class="num">${formatCurrency(row.netAmount)}</td>
          <td class="num">${row.taxRate.toFixed(2)}% (${escapeHtml(row.taxType)})</td>
          <td class="num">${formatCurrency(row.taxAmount)}</td>
          <td class="num">${formatCurrency(row.totalAmount)}</td>
        </tr>
      `
    )
    .join('');

export const buildInvoiceHtml = (order) => {
  const invoice = getInvoiceData(order);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #6b7280;
      --line: #e5e7eb;
      --accent: #92400e;
      --paper: #fff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--ink);
      background: #f5f6f8;
      line-height: 1.35;
    }
    .sheet {
      max-width: 980px;
      margin: 24px auto;
      background: var(--paper);
      border: 1px solid #d1d5db;
      padding: 24px;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #111827;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .title {
      font-size: 22px;
      letter-spacing: 0.6px;
      font-weight: 700;
      color: #111827;
    }
    .brand {
      color: var(--accent);
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 4px;
    }
    .muted { color: var(--muted); }
    .grid {
      display: grid;
      gap: 12px;
    }
    .grid-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .card {
      border: 1px solid var(--line);
      padding: 10px;
      min-height: 108px;
      font-size: 12px;
    }
    .label {
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.8px;
      color: var(--muted);
      margin-bottom: 6px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 7px 6px;
      vertical-align: top;
    }
    th {
      background: #f3f4f6;
      text-align: left;
      font-size: 11px;
    }
    td.num, th.num {
      text-align: right;
      white-space: nowrap;
    }
    .summary {
      margin-top: 10px;
      margin-left: auto;
      width: 360px;
      font-size: 12px;
      border: 1px solid #d1d5db;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      padding: 7px 10px;
    }
    .summary-row:last-child {
      border-bottom: 0;
      font-weight: 700;
      background: #f9fafb;
    }
    .footer {
      margin-top: 18px;
      font-size: 11px;
      color: #374151;
      border-top: 1px dashed #d1d5db;
      padding-top: 12px;
    }
    .sign {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      font-size: 11px;
    }
    .actions {
      margin: 16px auto 0;
      max-width: 980px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn {
      border: 1px solid #9ca3af;
      background: #fff;
      color: #111827;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; border: 0; max-width: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="title-row">
      <div>
        <div class="brand">${escapeHtml(COMPANY_INFO.brandName)}</div>
        <div style="font-size:12px; font-weight:700;">${escapeHtml(COMPANY_INFO.legalName)}</div>
        <div class="muted" style="font-size:12px;">${escapeHtml(COMPANY_INFO.line1)}</div>
        <div class="muted" style="font-size:12px;">${escapeHtml(COMPANY_INFO.line2)}</div>
        <div style="font-size:11px; margin-top:6px;">GSTIN: ${escapeHtml(COMPANY_INFO.gstin)} | PAN: ${escapeHtml(COMPANY_INFO.pan)} | CIN: ${escapeHtml(COMPANY_INFO.cin)}</div>
      </div>
      <div style="text-align:right;">
        <div class="title">TAX INVOICE</div>
        <div style="font-size:12px; margin-top:4px;">Invoice No: <strong>${escapeHtml(invoice.invoiceNumber)}</strong></div>
        <div style="font-size:12px;">Invoice Date: <strong>${escapeHtml(invoice.invoiceDate)}</strong></div>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="label">Bill To</div>
        <div><strong>${escapeHtml(invoice.billTo.fullName)}</strong></div>
        <div>${escapeHtml(invoice.billTo.line1)}</div>
        ${invoice.billTo.line2 ? `<div>${escapeHtml(invoice.billTo.line2)}</div>` : ''}
        <div>${escapeHtml(invoice.billTo.city)}, ${escapeHtml(invoice.billTo.state)} ${escapeHtml(invoice.billTo.pincode)}</div>
        <div>${escapeHtml(invoice.billTo.country)}</div>
        <div>Phone: ${escapeHtml(invoice.billTo.phone)}</div>
      </div>
      <div class="card">
        <div class="label">Ship To</div>
        <div><strong>${escapeHtml(invoice.billTo.fullName)}</strong></div>
        <div>${escapeHtml(invoice.billTo.line1)}</div>
        ${invoice.billTo.line2 ? `<div>${escapeHtml(invoice.billTo.line2)}</div>` : ''}
        <div>${escapeHtml(invoice.billTo.city)}, ${escapeHtml(invoice.billTo.state)} ${escapeHtml(invoice.billTo.pincode)}</div>
        <div>${escapeHtml(invoice.billTo.country)}</div>
      </div>
      <div class="card">
        <div class="label">Order Details</div>
        <div>Order No: <strong>${escapeHtml(invoice.orderNumber)}</strong></div>
        <div>Order Date: ${escapeHtml(invoice.orderDate)}</div>
        <div>Place of Supply: ${escapeHtml(invoice.placeOfSupply)}</div>
        <div>Payment Method: ${escapeHtml(invoice.paymentMethod.toUpperCase())}</div>
        <div>Payment Status: ${escapeHtml(invoice.paymentStatus.toUpperCase())}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>S.No.</th>
          <th>Description of Goods</th>
          <th>HSN/SAC</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Net Amount</th>
          <th class="num">Tax Rate &amp; Type</th>
          <th class="num">Tax Amount</th>
          <th class="num">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${buildRows(invoice.lineItems)}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Net Amount (Excl. IGST)</span><strong>INR ${formatCurrency(invoice.netTotal)}</strong></div>
      <div class="summary-row"><span>Total IGST (18%)</span><strong>INR ${formatCurrency(invoice.taxTotal)}</strong></div>
      <div class="summary-row"><span>Items Total (Incl. IGST)</span><strong>INR ${formatCurrency(invoice.itemsTotal)}</strong></div>
      <div class="summary-row"><span>Marketplace Fees (0.1%)</span><strong>INR ${formatCurrency(invoice.marketplaceFees)}</strong></div>
      <div class="summary-row"><span>Invoice Total</span><strong>INR ${formatCurrency(invoice.grandTotal)}</strong></div>
    </div>

    <div class="footer">
      <div><strong>Amount in words:</strong> ${escapeHtml(invoice.amountInWords)}</div>
      <div style="margin-top:8px;"><strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
      <div style="margin-top:8px;">Customer care: ${escapeHtml(COMPANY_INFO.supportEmail)} | ${escapeHtml(COMPANY_INFO.supportPhone)}</div>
    </div>

    <div class="sign">
      <div>
        <div>Receiver Signature</div>
        <div style="margin-top:22px; border-top:1px solid #9ca3af; width:200px;"></div>
      </div>
      <div style="text-align:right;">
        <div>For ${escapeHtml(COMPANY_INFO.legalName)}</div>
        <div style="margin-top:22px; border-top:1px solid #9ca3af; width:220px; margin-left:auto;"></div>
        <div>Authorised Signatory</div>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
};

export const downloadOrderInvoice = (order) => {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const fileToken = order?.orderNumber || order?._id || Date.now();

  anchor.href = blobUrl;
  anchor.download = `Invoice-${fileToken}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 0);
};

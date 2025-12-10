// HTML-based bank statement templates for expo-print

export function generateBankStatementHTML(data, template = 'template-a') {
  const { accountName, accountAddress1, accountAddress2, accountNumber, selectedMonth, beginningBalance, transactions } = data;
  
  const monthDate = new Date(selectedMonth + '-01');
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Calculate totals
  let runningBalance = parseFloat(beginningBalance) || 0;
  const processedTransactions = transactions.map(t => {
    const amount = parseFloat(t.amount) || 0;
    const isDebit = t.type === 'Purchase' || t.type === 'Withdrawal' || t.type === 'Fee';
    const change = isDebit ? -amount : amount;
    runningBalance += change;
    return { ...t, balance: runningBalance, change };
  });
  
  const endingBalance = runningBalance;
  const totalDebits = transactions
    .filter(t => t.type === 'Purchase' || t.type === 'Withdrawal' || t.type === 'Fee')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalCredits = transactions
    .filter(t => t.type === 'Deposit' || t.type === 'Interest')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  if (template === 'template-b') {
    return generateTemplateB(accountName, accountAddress1, accountAddress2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, processedTransactions);
  } else if (template === 'template-c') {
    return generateTemplateC(accountName, accountAddress1, accountAddress2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, processedTransactions);
  } else {
    return generateTemplateA(accountName, accountAddress1, accountAddress2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, processedTransactions);
  }
}

function generateTemplateA(accountName, address1, address2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, transactions) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          font-size: 10pt;
        }
        .header {
          background: linear-gradient(135deg, #166534 0%, #15803d 100%);
          color: white;
          padding: 30px;
          margin: -40px -40px 30px -40px;
        }
        .bank-name { font-size: 28pt; font-weight: bold; margin-bottom: 5px; }
        .header-subtitle { font-size: 11pt; opacity: 0.9; }
        .account-info {
          background-color: #f8f9fa;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
        }
        .info-block { flex: 1; }
        .info-label { font-size: 9pt; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 11pt; font-weight: bold; color: #333; }
        .section-title { font-size: 14pt; font-weight: bold; color: #166534; margin: 30px 0 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-size: 9pt;
          font-weight: bold;
          border-bottom: 2px solid #166534;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 9pt;
        }
        .text-right { text-align: right; }
        .debit { color: #dc3545; }
        .credit { color: #15803d; }
        .summary-box {
          background-color: #f8f9fa;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          display: flex;
          justify-content: space-around;
        }
        .summary-item { text-align: center; }
        .summary-label { font-size: 9pt; color: #666; margin-bottom: 5px; }
        .summary-value { font-size: 18pt; font-weight: bold; color: #333; }
        .footer { font-size: 8pt; color: #999; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bank-name">PREMIER BANK</div>
        <div class="header-subtitle">Monthly Account Statement</div>
      </div>

      <div class="account-info">
        <div class="info-block">
          <div class="info-label">ACCOUNT HOLDER</div>
          <div class="info-value">${accountName}</div>
          <div style="font-size: 9pt; color: #666; margin-top: 5px;">
            ${address1}<br/>${address2}
          </div>
        </div>
        <div class="info-block" style="text-align: right;">
          <div class="info-label">ACCOUNT NUMBER</div>
          <div class="info-value">****${accountNumber.slice(-4)}</div>
          <div style="font-size: 9pt; color: #666; margin-top: 5px;">
            Statement Period: ${monthName}
          </div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-item">
          <div class="summary-label">Beginning Balance</div>
          <div class="summary-value">$${parseFloat(beginningBalance).toFixed(2)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Deposits</div>
          <div class="summary-value credit">$${totalCredits.toFixed(2)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Withdrawals</div>
          <div class="summary-value debit">$${totalDebits.toFixed(2)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Ending Balance</div>
          <div class="summary-value">$${endingBalance.toFixed(2)}</div>
        </div>
      </div>

      <div class="section-title">Transaction History</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Type</th>
            <th class="text-right">Amount</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => {
            const isDebit = t.type === 'Purchase' || t.type === 'Withdrawal' || t.type === 'Fee';
            const amountClass = isDebit ? 'debit' : 'credit';
            const amountPrefix = isDebit ? '-' : '+';
            return `
            <tr>
              <td>${t.date}</td>
              <td>${t.description}</td>
              <td>${t.type}</td>
              <td class="text-right ${amountClass}">${amountPrefix}$${parseFloat(t.amount || 0).toFixed(2)}</td>
              <td class="text-right">$${t.balance.toFixed(2)}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This is an official bank statement. For questions, please contact customer service.</p>
        <p>© 2025 Premier Bank. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generateTemplateB(accountName, address1, address2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, transactions) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          font-size: 10pt;
        }
        .header { margin-bottom: 30px; }
        .bank-name { font-size: 20pt; font-weight: 300; color: #2563eb; margin-bottom: 5px; }
        .statement-title { font-size: 12pt; color: #666; }
        .account-card {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin: 20px 0;
        }
        .card-label { font-size: 8pt; opacity: 0.8; margin-bottom: 3px; }
        .card-value { font-size: 12pt; font-weight: bold; }
        .balance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .balance-card {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .balance-label { font-size: 9pt; color: #64748b; margin-bottom: 8px; }
        .balance-value { font-size: 20pt; font-weight: bold; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        tr { border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        td {
          padding: 12px;
          font-size: 9pt;
        }
        .text-right { text-align: right; }
        .amount-out { color: #ef4444; }
        .amount-in { color: #10b981; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bank-name">DIGITAL BANK</div>
        <div class="statement-title">Monthly Statement - ${monthName}</div>
      </div>

      <div class="account-card">
        <div>
          <div class="card-label">ACCOUNT HOLDER</div>
          <div class="card-value">${accountName}</div>
          <div style="font-size: 9pt; margin-top: 8px; opacity: 0.9;">
            ${address1}<br/>${address2}
          </div>
        </div>
        <div style="margin-top: 15px;">
          <div class="card-label">ACCOUNT NUMBER</div>
          <div class="card-value">****${accountNumber.slice(-4)}</div>
        </div>
      </div>

      <div class="balance-grid">
        <div class="balance-card">
          <div class="balance-label">Beginning Balance</div>
          <div class="balance-value">$${parseFloat(beginningBalance).toFixed(2)}</div>
        </div>
        <div class="balance-card">
          <div class="balance-label">Ending Balance</div>
          <div class="balance-value">$${endingBalance.toFixed(2)}</div>
        </div>
        <div class="balance-card">
          <div class="balance-label">Total Deposits</div>
          <div class="balance-value" style="color: #10b981;">$${totalCredits.toFixed(2)}</div>
        </div>
        <div class="balance-card">
          <div class="balance-label">Total Withdrawals</div>
          <div class="balance-value" style="color: #ef4444;">$${totalDebits.toFixed(2)}</div>
        </div>
      </div>

      <div style="font-size: 12pt; font-weight: bold; color: #2563eb; margin: 30px 0 15px 0;">Transactions</div>
      <table>
        <tbody>
          ${transactions.map(t => {
            const isDebit = t.type === 'Purchase' || t.type === 'Withdrawal' || t.type === 'Fee';
            const amountClass = isDebit ? 'amount-out' : 'amount-in';
            const amountPrefix = isDebit ? '-' : '+';
            return `
            <tr>
              <td style="width: 100px;">${t.date}</td>
              <td><strong>${t.description}</strong><br/><span style="font-size: 8pt; color: #64748b;">${t.type}</span></td>
              <td class="text-right ${amountClass}" style="width: 100px; font-weight: bold;">${amountPrefix}$${parseFloat(t.amount || 0).toFixed(2)}</td>
              <td class="text-right" style="width: 120px;">$${t.balance.toFixed(2)}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateTemplateC(accountName, address1, address2, accountNumber, monthName, beginningBalance, endingBalance, totalDebits, totalCredits, transactions) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          font-size: 10pt;
        }
        .main-border {
          border: 3px solid #7c3aed;
          padding: 25px;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #7c3aed;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .bank-name { font-size: 24pt; font-weight: bold; color: #7c3aed; }
        .statement-badge {
          background-color: #7c3aed;
          color: white;
          padding: 10px 20px;
          font-size: 12pt;
          font-weight: bold;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-box {
          border: 2px solid #ddd;
          padding: 15px;
        }
        .box-title {
          font-size: 9pt;
          font-weight: bold;
          color: #7c3aed;
          border-bottom: 2px solid #7c3aed;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .info-line {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 9pt;
        }
        .info-label { color: #666; }
        .info-value { font-weight: bold; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f3f0ff;
          padding: 12px;
          text-align: left;
          font-size: 9pt;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px;
          border: 1px solid #ddd;
          font-size: 9pt;
        }
        .text-right { text-align: right; }
        .summary-section {
          background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
          color: white;
          padding: 25px;
          margin: 20px 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          text-align: center;
        }
        .summary-label { font-size: 8pt; margin-bottom: 8px; opacity: 0.9; }
        .summary-value { font-size: 16pt; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="main-border">
        <div class="header-row">
          <div class="bank-name">CORPORATE BANK</div>
          <div class="statement-badge">STATEMENT</div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="box-title">ACCOUNT HOLDER</div>
            <div class="info-line">
              <span class="info-label">Name:</span>
              <span class="info-value">${accountName}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Address:</span>
              <span class="info-value">${address1}</span>
            </div>
            <div class="info-line">
              <span class="info-label">City:</span>
              <span class="info-value">${address2}</span>
            </div>
          </div>

          <div class="info-box">
            <div class="box-title">ACCOUNT DETAILS</div>
            <div class="info-line">
              <span class="info-label">Account #:</span>
              <span class="info-value">****${accountNumber.slice(-4)}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Period:</span>
              <span class="info-value">${monthName}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Type:</span>
              <span class="info-value">Checking</span>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div>
            <div class="summary-label">BEGINNING BALANCE</div>
            <div class="summary-value">$${parseFloat(beginningBalance).toFixed(2)}</div>
          </div>
          <div>
            <div class="summary-label">DEPOSITS</div>
            <div class="summary-value">+$${totalCredits.toFixed(2)}</div>
          </div>
          <div>
            <div class="summary-label">WITHDRAWALS</div>
            <div class="summary-value">-$${totalDebits.toFixed(2)}</div>
          </div>
          <div>
            <div class="summary-label">ENDING BALANCE</div>
            <div class="summary-value">$${endingBalance.toFixed(2)}</div>
          </div>
        </div>

        <div style="font-size: 12pt; font-weight: bold; color: #7c3aed; margin: 20px 0 15px 0;">TRANSACTION DETAILS</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => {
              const isDebit = t.type === 'Purchase' || t.type === 'Withdrawal' || t.type === 'Fee';
              const amountPrefix = isDebit ? '-' : '+';
              return `
              <tr>
                <td>${t.date}</td>
                <td><strong>${t.description}</strong></td>
                <td>${t.type}</td>
                <td class="text-right" style="color: ${isDebit ? '#dc3545' : '#15803d'}; font-weight: bold;">${amountPrefix}$${parseFloat(t.amount || 0).toFixed(2)}</td>
                <td class="text-right">$${t.balance.toFixed(2)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

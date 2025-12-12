// HTML-based templates for expo-print
// These templates replicate the jsPDF templates from the web app

// Template A: Gusto-Style Professional
export function generateHTMLTemplateA(data) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs, stateRate } = data;
  
  const totalHours = Number(hours) + Number(overtime || 0);
  const overtimeRate = rate * 1.5;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; size: letter; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          font-size: 9pt;
          color: #333;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        .logo-area {
          flex: 1;
        }
        .logo-text {
          font-size: 18pt;
          font-weight: bold;
          color: #00a89b;
          margin-bottom: 30px;
        }
        .earnings-title {
          font-size: 18pt;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .pay-info {
          font-size: 9pt;
          color: #666;
          line-height: 1.6;
        }
        .info-boxes {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }
        .info-box {
          background-color: #f8f8f8;
          padding: 12px;
          width: 130px;
          border-radius: 2px;
        }
        .info-box-title {
          font-size: 8pt;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .info-box-content {
          font-size: 7pt;
          color: #666;
          line-height: 1.5;
        }
        .section-header {
          font-size: 11pt;
          font-weight: bold;
          color: #333;
          margin: 25px 0 8px 0;
          padding-bottom: 3px;
          border-bottom: 1px solid #00a89b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        th {
          text-align: left;
          font-weight: bold;
          font-size: 9pt;
          padding: 8px 4px;
          background-color: white;
          border-bottom: 1px solid #ddd;
        }
        th.text-right, td.text-right {
          text-align: right;
        }
        td {
          padding: 10px 4px;
          font-size: 9pt;
          border-left: 1px solid #e0e0e0;
        }
        td:first-child {
          border-left: none;
        }
        tr:nth-child(even) td {
          background-color: #f5f5f5;
        }
        .underline {
          text-decoration: underline;
        }
        .two-column {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }
        .column {
          flex: 1;
        }
        .summary-table td {
          background-color: white !important;
          border: none;
        }
        .summary-table tr:first-child td {
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="header-section">
        <div class="logo-area">
          <div class="logo-text">Gusto</div>
          <div class="earnings-title">Earnings Statement</div>
          <div class="pay-info">
            Pay period: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}   Pay Day: ${payDate.toLocaleDateString()}<br/>
            Hire Date: ${formData.hireDate || startDate.toLocaleDateString()}<br/>
            ${formData.name || ''} (...Direct Deposit to ${formData.bankName || 'Bank'} ******${formData.bank ? formData.bank.slice(-4) : '0000'})
          </div>
        </div>
        
        <div class="info-boxes">
          <div class="info-box">
            <div class="info-box-title">Company</div>
            <div class="info-box-content">
              ${formData.company || 'Company Name'}<br/>
              ${formData.companyAddress || ''}<br/>
              ${formData.companyCity || ''}, ${formData.companyState || ''} ${formData.companyZip || ''}<br/>
              ${formData.companyPhone || ''}
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-box-title">Employee</div>
            <div class="info-box-content">
              ${formData.name || ''}<br/>
              XXX-XX-${formData.ssn ? formData.ssn.slice(-4) : '0000'}<br/>
              ${formData.address || ''}<br/>
              ${formData.city || ''}, ${formData.state || ''} ${formData.zip || ''}
            </div>
          </div>
        </div>
      </div>

      <!-- EARNINGS -->
      <div class="section-header">Employee Gross Earnings</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Hours</th>
            <th class="text-right">Current</th>
            <th class="text-right">Year-To-Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="underline">Regular Hours</span> | Hourly</td>
            <td class="text-right">$${rate.toFixed(2)}</td>
            <td class="text-right">${hours}</td>
            <td class="text-right">$${regularPay.toFixed(2)}</td>
            <td class="text-right">$${regularPay.toFixed(2)}</td>
          </tr>
          ${overtime > 0 ? `
          <tr>
            <td><span class="underline">Overtime Hours</span> | 1.5x</td>
            <td class="text-right">$${overtimeRate.toFixed(2)}</td>
            <td class="text-right">${overtime}</td>
            <td class="text-right">$${overtimePay.toFixed(2)}</td>
            <td class="text-right">$${overtimePay.toFixed(2)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- TAXES (Two Column Layout) -->
      <div class="two-column">
        <div class="column">
          <div class="section-header">Employee Taxes Withheld</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Current</th>
                <th class="text-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="underline">Social Security</span></td>
                <td class="text-right">$${ssTax.toFixed(2)}</td>
                <td class="text-right">$${ssTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td><span class="underline">Medicare</span></td>
                <td class="text-right">$${medTax.toFixed(2)}</td>
                <td class="text-right">$${medTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td><span class="underline">${formData.state?.toUpperCase() || 'State'} Withholding Tax</span></td>
                <td class="text-right">$${stateTax.toFixed(2)}</td>
                <td class="text-right">$${stateTax.toFixed(2)}</td>
              </tr>
              ${formData.includeLocalTax && localTax > 0 ? `
              <tr>
                <td><span class="underline">Local Tax</span></td>
                <td class="text-right">$${localTax.toFixed(2)}</td>
                <td class="text-right">$${localTax.toFixed(2)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div class="column">
          <div class="section-header">Employer Tax</div>
          <table>
            <thead>
              <tr>
                <th>Company Tax</th>
                <th class="text-right">Current</th>
                <th class="text-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="underline">Social Security</span></td>
                <td class="text-right">$${ssTax.toFixed(2)}</td>
                <td class="text-right">$${ssTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td><span class="underline">Medicare</span></td>
                <td class="text-right">$${medTax.toFixed(2)}</td>
                <td class="text-right">$${medTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td><span class="underline">FUTA</span></td>
                <td class="text-right">$${(grossPay * 0.006).toFixed(2)}</td>
                <td class="text-right">$${(grossPay * 0.006).toFixed(2)}</td>
              </tr>
              <tr>
                <td><span class="underline">${formData.state?.toUpperCase() || 'State'} Unemployment Tax</span></td>
                <td class="text-right">$${(grossPay * 0.01).toFixed(2)}</td>
                <td class="text-right">$${(grossPay * 0.01).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DEDUCTIONS -->
      <div class="section-header">Employee Deductions</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Type</th>
            <th class="text-right">Current</th>
            <th class="text-right">Year-To-Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>None</td>
            <td>–</td>
            <td class="text-right">$0.00</td>
            <td class="text-right">$0.00</td>
          </tr>
        </tbody>
      </table>

      <!-- CONTRIBUTIONS -->
      <div class="section-header">Employee Contributions</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Type</th>
            <th class="text-right">Current</th>
            <th class="text-right">Year-To-Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>None</td>
            <td>–</td>
            <td class="text-right">$0.00</td>
            <td class="text-right">$0.00</td>
          </tr>
        </tbody>
      </table>

      <!-- SUMMARY -->
      <div class="section-header">Summary</div>
      <table class="summary-table">
        <tbody>
          <tr>
            <td>Description</td>
            <td class="text-right">Current</td>
            <td class="text-right">Year-To-Date</td>
          </tr>
          <tr>
            <td><span class="underline">Gross Earnings</span></td>
            <td class="text-right">$${grossPay.toFixed(2)}</td>
            <td class="text-right">$${grossPay.toFixed(2)}</td>
          </tr>
          <tr>
            <td><span class="underline">Taxes</span></td>
            <td class="text-right">$${totalTax.toFixed(2)}</td>
            <td class="text-right">$${totalTax.toFixed(2)}</td>
          </tr>
          <tr>
            <td><span class="underline">Net Pay</span></td>
            <td class="text-right">$${netPay.toFixed(2)}</td>
            <td class="text-right">$${netPay.toFixed(2)}</td>
          </tr>
          <tr>
            <td><span class="underline">Total Reimbursements</span></td>
            <td class="text-right">$0.00</td>
            <td class="text-right">$0.00</td>
          </tr>
          <tr>
            <td><span class="underline">Check Amount</span></td>
            <td class="text-right">$${netPay.toFixed(2)}</td>
            <td class="text-right">$${netPay.toFixed(2)}</td>
          </tr>
          <tr>
            <td><span class="underline">Hours Worked</span></td>
            <td class="text-right">${totalHours.toFixed(2)}</td>
            <td class="text-right">${totalHours.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; font-size: 8pt; color: #999; text-align: center;">
        Statement ${stubNum + 1} of ${totalStubs}
      </div>
    </body>
    </html>
  `;
}

// Template B: Modern Minimalist
export function generateHTMLTemplateB(data) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs, stateRate } = data;
  
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
          font-size: 12pt; 
          color: #666; 
          margin-bottom: 5px; 
        }
        .header-small { font-size: 8pt; color: #999; }
        .main-title { 
          font-size: 32pt; 
          font-weight: bold; 
          text-align: center; 
          color: #2980b9; 
          margin: 40px 0 10px 0; 
        }
        .period { font-size: 9pt; color: #666; text-align: center; margin-bottom: 30px; }
        .two-col { display: flex; justify-content: space-between; margin: 30px 0; }
        .col { width: 45%; }
        .label { font-size: 8pt; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .value { font-size: 10pt; color: #333; margin-bottom: 8px; }
        .earnings-box {
          background-color: #e8f4f8;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .section-header { font-size: 9pt; color: #2980b9; font-weight: bold; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; color: #333; border-bottom: 1px solid #e0e0e0; }
        .text-right { text-align: right; }
        .large-total {
          background-color: #2980b9;
          color: white;
          padding: 25px;
          margin: 30px 0;
          border-radius: 8px;
          text-align: center;
        }
        .large-total-label { font-size: 11pt; margin-bottom: 10px; }
        .large-total-amount { font-size: 28pt; font-weight: bold; }
        .footer { font-size: 8pt; color: #ccc; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">${formData.company || 'Company Name'}</div>
      <div class="header-small">
        ${formData.companyAddress || ''} | ${formData.companyCity || ''}, ${formData.companyState || ''} | ${formData.companyPhone || ''}
      </div>

      <div class="main-title">PAYCHECK</div>
      <div class="period">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</div>

      <div class="two-col">
        <div class="col">
          <div class="label">EMPLOYEE</div>
          <div class="value"><strong>${formData.name || ''}</strong></div>
          <div class="value">${formData.address || ''}</div>
          <div class="value">${formData.city || ''}, ${formData.state || ''} ${formData.zip || ''}</div>
          <div class="value">SSN: ***-**-${formData.ssn ? formData.ssn.slice(-4) : '0000'}</div>
        </div>
        <div class="col">
          <div class="label">PAY PERIOD</div>
          <div class="value">From: ${startDate.toLocaleDateString()}</div>
          <div class="value">To: ${endDate.toLocaleDateString()}</div>
          <div class="value">Pay Date: ${payDate.toLocaleDateString()}</div>
          <div class="value">Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}</div>
        </div>
      </div>

      <div class="earnings-box">
        <div class="section-header">EARNINGS</div>
        <table>
          <tr>
            <td>Regular Hours (${hours.toFixed(2)} hrs @ $${rate.toFixed(2)})</td>
            <td class="text-right"><strong>$${regularPay.toFixed(2)}</strong></td>
          </tr>
          ${overtime > 0 ? `
          <tr>
            <td>Overtime (${overtime.toFixed(2)} hrs @ $${(rate * 1.5).toFixed(2)})</td>
            <td class="text-right"><strong>$${overtimePay.toFixed(2)}</strong></td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #2980b9;">
            <td><strong>Gross Pay</strong></td>
            <td class="text-right"><strong>$${grossPay.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div class="section-header">DEDUCTIONS</div>
        <table>
          <tr>
            <td>Social Security</td>
            <td class="text-right">$${ssTax.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Medicare</td>
            <td class="text-right">$${medTax.toFixed(2)}</td>
          </tr>
          <tr>
            <td>State Tax</td>
            <td class="text-right">$${stateTax.toFixed(2)}</td>
          </tr>
          ${formData.includeLocalTax ? `
          <tr>
            <td>Local Tax</td>
            <td class="text-right">$${localTax.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #e74c3c; color: #e74c3c;">
            <td><strong>Total Deductions</strong></td>
            <td class="text-right"><strong>$${totalTax.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="large-total">
        <div class="large-total-label">NET PAY</div>
        <div class="large-total-amount">$${netPay.toFixed(2)}</div>
      </div>

      <div style="font-size: 9pt; color: #666; text-align: center;">
        Direct Deposit: ${formData.bankName || ''} ****${formData.bank ? formData.bank.slice(-4) : '0000'}
      </div>

      <div class="footer">Statement ${stubNum + 1} of ${totalStubs}</div>
    </body>
    </html>
  `;
}

// Template C: Detailed Corporate
export function generateHTMLTemplateC(data) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs, stateRate } = data;
  
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
        .bordered-box {
          border: 3px solid #6c5ce7;
          padding: 25px;
          margin-bottom: 20px;
        }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .company-name { font-size: 20pt; font-weight: bold; color: #6c5ce7; }
        .pay-stub-label { 
          font-size: 18pt; 
          font-weight: bold; 
          background-color: #6c5ce7; 
          color: white; 
          padding: 10px 20px; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin: 20px 0; 
        }
        .info-section { 
          border: 2px solid #ddd; 
          padding: 15px; 
        }
        .section-title { 
          font-size: 9pt; 
          font-weight: bold; 
          color: #6c5ce7; 
          border-bottom: 2px solid #6c5ce7; 
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
        .info-value { font-weight: bold; color: #333; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
        }
        th {
          background-color: #f0f0f0;
          padding: 10px;
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
        .total-row { 
          background-color: #f8f8f8; 
          font-weight: bold; 
        }
        .net-pay-section {
          background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
          color: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .net-pay-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          text-align: center;
        }
        .net-item-label { font-size: 8pt; margin-bottom: 5px; opacity: 0.9; }
        .net-item-value { font-size: 16pt; font-weight: bold; }
        .footer { 
          font-size: 8pt; 
          color: #999; 
          text-align: center; 
          margin-top: 20px; 
          padding-top: 15px; 
          border-top: 1px solid #ddd; 
        }
      </style>
    </head>
    <body>
      <div class="bordered-box">
        <div class="header-row">
          <div>
            <div class="company-name">${formData.company || 'Company Name'}</div>
            <div style="font-size: 9pt; color: #666; margin-top: 5px;">
              ${formData.companyAddress || ''}<br/>
              ${formData.companyCity || ''}, ${formData.companyState || ''} ${formData.companyZip || ''}<br/>
              ${formData.companyPhone || ''}
            </div>
          </div>
          <div class="pay-stub-label">PAY STUB</div>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <div class="section-title">EMPLOYEE INFORMATION</div>
            <div class="info-line">
              <span class="info-label">Name:</span>
              <span class="info-value">${formData.name || ''}</span>
            </div>
            <div class="info-line">
              <span class="info-label">SSN:</span>
              <span class="info-value">***-**-${formData.ssn ? formData.ssn.slice(-4) : '0000'}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Address:</span>
              <span class="info-value">${formData.address || ''}</span>
            </div>
            <div class="info-line">
              <span class="info-label">City, State:</span>
              <span class="info-value">${formData.city || ''}, ${formData.state || ''}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">PAY PERIOD</div>
            <div class="info-line">
              <span class="info-label">Period Start:</span>
              <span class="info-value">${startDate.toLocaleDateString()}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Period End:</span>
              <span class="info-value">${endDate.toLocaleDateString()}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Pay Date:</span>
              <span class="info-value">${payDate.toLocaleDateString()}</span>
            </div>
            <div class="info-line">
              <span class="info-label">Frequency:</span>
              <span class="info-value">${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}</span>
            </div>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <div class="section-title">EARNINGS</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Hours</th>
                <th style="text-align: center;">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Regular Pay</td>
                <td style="text-align: center;">${hours.toFixed(2)}</td>
                <td style="text-align: center;">$${rate.toFixed(2)}</td>
                <td class="text-right">$${regularPay.toFixed(2)}</td>
              </tr>
              ${overtime > 0 ? `
              <tr>
                <td>Overtime Pay</td>
                <td style="text-align: center;">${overtime.toFixed(2)}</td>
                <td style="text-align: center;">$${(rate * 1.5).toFixed(2)}</td>
                <td class="text-right">$${overtimePay.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3"><strong>Gross Pay</strong></td>
                <td class="text-right"><strong>$${grossPay.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-title">DEDUCTIONS</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Social Security (6.2%)</td>
                <td class="text-right">$${ssTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Medicare (1.45%)</td>
                <td class="text-right">$${medTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td>State Tax (${(stateRate * 100).toFixed(2)}%)</td>
                <td class="text-right">$${stateTax.toFixed(2)}</td>
              </tr>
              ${formData.includeLocalTax ? `
              <tr>
                <td>Local Tax (1%)</td>
                <td class="text-right">$${localTax.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Deductions</strong></td>
                <td class="text-right"><strong>$${totalTax.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="net-pay-section">
        <div class="net-pay-grid">
          <div>
            <div class="net-item-label">GROSS PAY</div>
            <div class="net-item-value">$${grossPay.toFixed(2)}</div>
          </div>
          <div>
            <div class="net-item-label">DEDUCTIONS</div>
            <div class="net-item-value">$${totalTax.toFixed(2)}</div>
          </div>
          <div>
            <div class="net-item-label">NET PAY</div>
            <div class="net-item-value">$${netPay.toFixed(2)}</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px; font-size: 9pt;">
          Direct Deposit: ${formData.bankName || ''} | Account: ****${formData.bank ? formData.bank.slice(-4) : '0000'}
        </div>
      </div>

      <div class="footer">Stub ${stubNum + 1} of ${totalStubs}</div>
    </body>
    </html>
  `;
}

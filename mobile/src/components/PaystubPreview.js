import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

// This component uses WebView to render the actual PDF preview
// matching exactly what the frontend shows
export default function PaystubPreview({ data, type = 'us', template = 'template-a' }) {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);

  // Generate the HTML that will render the PDF preview
  // This uses the same jsPDF logic as the frontend
  const generatePreviewHtml = () => {
    const formData = {
      ...data,
      // Ensure all required fields have defaults
      name: data.name || 'Employee Name',
      company: data.company || 'Company Name',
      ssn: data.ssn || '0000',
      sin: data.sin || '000',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      province: data.province || 'ON',
      zip: data.zip || '',
      postalCode: data.postalCode || '',
      companyAddress: data.companyAddress || '',
      companyCity: data.companyCity || '',
      companyState: data.companyState || '',
      companyProvince: data.companyProvince || '',
      companyZip: data.companyZip || '',
      companyPostalCode: data.companyPostalCode || '',
      companyPhone: data.companyPhone || '',
      bank: data.bank || '',
      bankName: data.bankName || '',
      payFrequency: data.payFrequency || 'biweekly',
      payType: data.payType || 'hourly',
      federalFilingStatus: data.federalFilingStatus || 'single',
      stateAllowances: data.stateAllowances || '0',
    };

    // Calculate pay values
    const hours = parseFloat(data.hours) || 80;
    const overtime = parseFloat(data.overtime) || 0;
    const rate = parseFloat(data.rate) || 0;
    const annualSalary = parseFloat(data.annualSalary) || 0;

    let grossPay = 0, regularPay = 0, overtimePay = 0;
    if (data.payType === 'salary') {
      const frequencies = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
      grossPay = annualSalary / (frequencies[data.payFrequency] || 26);
      regularPay = grossPay;
    } else {
      regularPay = hours * rate;
      overtimePay = overtime * rate * 1.5;
      grossPay = regularPay + overtimePay;
    }

    // Tax calculations
    const ssTax = grossPay * 0.062;
    const medTax = grossPay * 0.0145;
    const federalTax = grossPay * 0.12;
    const stateTax = grossPay * 0.05;
    const cpp = grossPay * 0.0595;
    const ei = grossPay * 0.0163;
    const provincial = grossPay * 0.05;
    const totalTax = type === 'us' ? (ssTax + medTax + federalTax + stateTax) : (cpp + ei + federalTax + provincial);
    const netPay = grossPay - totalTax;

    // Date formatting
    const today = new Date();
    const formatDate = (d) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = d ? new Date(d) : today;
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const startDate = formatDate(data.startDate);
    const endDate = formatDate(data.endDate);
    const payDate = formatDate(data.payDate);

    // Currency formatter
    const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Generate template-specific HTML
    let templateHtml = '';
    
    if (template === 'template-a') {
      // GUSTO TEMPLATE
      templateHtml = `
        <div style="font-family: Helvetica, Arial, sans-serif; padding: 20px; background: #fff;">
          <!-- Logo -->
          <div style="color: #00a8a1; font-size: 24px; font-weight: bold; margin-bottom: 20px;">gusto</div>
          
          <!-- Title -->
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Earnings Statement</div>
          <div style="font-size: 9px; color: #000; margin-bottom: 5px;">
            Pay period: ${startDate} – ${endDate} &nbsp;&nbsp; Pay Day: ${payDate}
          </div>
          <div style="font-size: 9px; color: #000; margin-bottom: 15px;">
            ${formData.name} (...******${formData.bank || '0000'})
          </div>
          
          <!-- Info Boxes -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; background: #f8f8f8; padding: 12px; border-radius: 2px;">
              <div style="font-size: 8px; font-weight: bold; margin-bottom: 8px;">Company</div>
              <div style="font-size: 7px; line-height: 1.4;">
                ${formData.company}<br/>
                ${formData.companyAddress}<br/>
                ${formData.companyCity}, ${type === 'us' ? formData.companyState : formData.companyProvince} ${type === 'us' ? formData.companyZip : formData.companyPostalCode}<br/>
                ${formData.companyPhone}
              </div>
            </div>
            <div style="flex: 1; background: #f8f8f8; padding: 12px; border-radius: 2px;">
              <div style="font-size: 8px; font-weight: bold; margin-bottom: 8px;">Employee</div>
              <div style="font-size: 7px; line-height: 1.4;">
                ${formData.name}<br/>
                XXX-XX-${type === 'us' ? formData.ssn : formData.sin}<br/>
                ${formData.address}<br/>
                ${formData.city}, ${type === 'us' ? formData.state : formData.province} ${type === 'us' ? formData.zip : formData.postalCode}
              </div>
            </div>
          </div>
          
          <!-- Earnings Section -->
          <div style="border-bottom: 2px solid #00a8a1; padding-bottom: 4px; margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: bold;">Employee Gross Earnings</span>
          </div>
          <table style="width: 100%; font-size: 8px; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="font-weight: bold;">
              <td style="padding: 6px 4px; width: 40%;">Description</td>
              <td style="padding: 6px 4px; text-align: right;">Rate</td>
              <td style="padding: 6px 4px; text-align: right;">Hours</td>
              <td style="padding: 6px 4px; text-align: right;">Current</td>
              <td style="padding: 6px 4px; text-align: right;">Year-To-Date</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 6px 4px; text-decoration: underline;">${formData.payType === 'salary' ? 'Salary | Per Period' : 'Regular Hours | Hourly'}</td>
              <td style="padding: 6px 4px; text-align: right;">${formData.payType === 'salary' ? fmt(annualSalary) + '/yr' : fmt(rate)}</td>
              <td style="padding: 6px 4px; text-align: right;">${formData.payType === 'salary' ? '-' : hours}</td>
              <td style="padding: 6px 4px; text-align: right;">${fmt(regularPay)}</td>
              <td style="padding: 6px 4px; text-align: right;">${fmt(regularPay)}</td>
            </tr>
            ${overtime > 0 && formData.payType === 'hourly' ? `
            <tr>
              <td style="padding: 6px 4px; text-decoration: underline;">Overtime Hours | 1.5x</td>
              <td style="padding: 6px 4px; text-align: right;">${fmt(rate * 1.5)}</td>
              <td style="padding: 6px 4px; text-align: right;">${overtime}</td>
              <td style="padding: 6px 4px; text-align: right;">${fmt(overtimePay)}</td>
              <td style="padding: 6px 4px; text-align: right;">${fmt(overtimePay)}</td>
            </tr>
            ` : ''}
          </table>
          
          <!-- Tax Columns -->
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;">
              <div style="border-bottom: 2px solid #00a8a1; padding-bottom: 4px; margin-bottom: 8px;">
                <span style="font-size: 9px; font-weight: bold;">Employee Taxes Withheld</span>
              </div>
              <table style="width: 100%; font-size: 7px; border-collapse: collapse;">
                <tr style="font-weight: bold;">
                  <td style="padding: 4px;">Description</td>
                  <td style="padding: 4px; text-align: right;">Current</td>
                  <td style="padding: 4px; text-align: right;">YTD</td>
                </tr>
                ${type === 'us' ? `
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">Federal Income Tax</td><td style="padding: 4px; text-align: right;">${fmt(federalTax)}</td><td style="padding: 4px; text-align: right;">${fmt(federalTax)}</td></tr>
                <tr><td style="padding: 4px; text-decoration: underline;">Social Security (6.2%)</td><td style="padding: 4px; text-align: right;">${fmt(ssTax)}</td><td style="padding: 4px; text-align: right;">${fmt(ssTax)}</td></tr>
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">Medicare (1.45%)</td><td style="padding: 4px; text-align: right;">${fmt(medTax)}</td><td style="padding: 4px; text-align: right;">${fmt(medTax)}</td></tr>
                <tr><td style="padding: 4px; text-decoration: underline;">${(formData.state || 'State').toUpperCase()} Tax</td><td style="padding: 4px; text-align: right;">${fmt(stateTax)}</td><td style="padding: 4px; text-align: right;">${fmt(stateTax)}</td></tr>
                ` : `
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">Federal Income Tax</td><td style="padding: 4px; text-align: right;">${fmt(federalTax)}</td><td style="padding: 4px; text-align: right;">${fmt(federalTax)}</td></tr>
                <tr><td style="padding: 4px; text-decoration: underline;">CPP (5.95%)</td><td style="padding: 4px; text-align: right;">${fmt(cpp)}</td><td style="padding: 4px; text-align: right;">${fmt(cpp)}</td></tr>
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">EI (1.63%)</td><td style="padding: 4px; text-align: right;">${fmt(ei)}</td><td style="padding: 4px; text-align: right;">${fmt(ei)}</td></tr>
                <tr><td style="padding: 4px; text-decoration: underline;">${(formData.province || 'ON').toUpperCase()} Tax</td><td style="padding: 4px; text-align: right;">${fmt(provincial)}</td><td style="padding: 4px; text-align: right;">${fmt(provincial)}</td></tr>
                `}
              </table>
            </div>
            <div style="flex: 1;">
              <div style="border-bottom: 2px solid #00a8a1; padding-bottom: 4px; margin-bottom: 8px;">
                <span style="font-size: 9px; font-weight: bold;">Employer Tax</span>
              </div>
              <table style="width: 100%; font-size: 7px; border-collapse: collapse;">
                <tr style="font-weight: bold;">
                  <td style="padding: 4px;">Company Tax</td>
                  <td style="padding: 4px; text-align: right;">Current</td>
                  <td style="padding: 4px; text-align: right;">YTD</td>
                </tr>
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">Social Security (6.2%)</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.062)}</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.062)}</td></tr>
                <tr><td style="padding: 4px; text-decoration: underline;">Medicare (1.45%)</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.0145)}</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.0145)}</td></tr>
                <tr style="background: #f5f5f5;"><td style="padding: 4px; text-decoration: underline;">FUTA (0.6%)</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.006)}</td><td style="padding: 4px; text-align: right;">${fmt(grossPay * 0.006)}</td></tr>
              </table>
            </div>
          </div>
          
          <!-- Summary -->
          <div style="border-bottom: 2px solid #00a8a1; padding-bottom: 4px; margin-bottom: 8px;">
            <span style="font-size: 10px; font-weight: bold;">Summary</span>
          </div>
          <table style="width: 100%; font-size: 8px; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="font-weight: bold;">
              <td style="padding: 6px 4px;">Description</td>
              <td style="padding: 6px 4px; text-align: right;">Current</td>
              <td style="padding: 6px 4px; text-align: right;">Year-To-Date</td>
            </tr>
            <tr style="background: #f5f5f5;"><td style="padding: 6px 4px; text-decoration: underline;">Gross Earnings</td><td style="padding: 6px 4px; text-align: right;">${fmt(grossPay)}</td><td style="padding: 6px 4px; text-align: right;">${fmt(grossPay)}</td></tr>
            <tr><td style="padding: 6px 4px; text-decoration: underline;">Taxes</td><td style="padding: 6px 4px; text-align: right;">${fmt(totalTax)}</td><td style="padding: 6px 4px; text-align: right;">${fmt(totalTax)}</td></tr>
            <tr style="background: #f5f5f5; font-weight: bold;"><td style="padding: 6px 4px;">Net Pay</td><td style="padding: 6px 4px; text-align: right;">${fmt(netPay)}</td><td style="padding: 6px 4px; text-align: right;">${fmt(netPay)}</td></tr>
          </table>
          
          <!-- Net Pay Box -->
          <div style="background: #f8f8f8; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <div style="font-size: 10px; font-weight: bold;">Net Pay</div>
            <div style="font-size: 20px; font-weight: bold; color: #00a8a1;">${fmt(netPay)}</div>
            ${formData.bankName ? `<div style="font-size: 8px; color: #666; margin-top: 5px;">Direct Deposit to ${formData.bankName} (...${formData.bank || '0000'})</div>` : ''}
          </div>
        </div>
      `;
    } else if (template === 'template-c') {
      // WORKDAY TEMPLATE
      templateHtml = `
        <div style="font-family: Helvetica, Arial, sans-serif; background: #fff;">
          <!-- Blue Header -->
          <div style="background: #0066cc; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #fff; font-size: 16px; font-weight: bold;">workday</div>
            <div style="color: #fff; font-size: 20px; font-weight: bold;">Payslip</div>
          </div>
          
          <!-- Info Row -->
          <div style="display: flex; padding: 15px 20px; border-bottom: 1px solid #e0e0e0;">
            <div style="flex: 1;">
              <div style="font-size: 7px; color: #666; text-transform: uppercase;">Employee Name</div>
              <div style="font-size: 10px; font-weight: 500;">${formData.name}</div>
              <div style="font-size: 7px; color: #666; text-transform: uppercase; margin-top: 8px;">Employee ID</div>
              <div style="font-size: 10px; font-weight: 500;">XXX-XX-${type === 'us' ? formData.ssn : formData.sin}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 7px; color: #666; text-transform: uppercase;">Company</div>
              <div style="font-size: 10px; font-weight: 500;">${formData.company}</div>
              <div style="font-size: 7px; color: #666; text-transform: uppercase; margin-top: 8px;">Pay Period</div>
              <div style="font-size: 10px; font-weight: 500;">${startDate} - ${endDate}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 7px; color: #666; text-transform: uppercase;">Pay Date</div>
              <div style="font-size: 10px; font-weight: 500;">${payDate}</div>
              <div style="font-size: 7px; color: #666; text-transform: uppercase; margin-top: 8px;">Pay Frequency</div>
              <div style="font-size: 10px; font-weight: 500;">${(formData.payFrequency || 'Biweekly').charAt(0).toUpperCase() + (formData.payFrequency || 'biweekly').slice(1)}</div>
            </div>
          </div>
          
          <!-- Earnings Section -->
          <div style="background: #0066cc; padding: 8px 20px;">
            <span style="color: #fff; font-size: 10px; font-weight: bold;">Earnings</span>
          </div>
          <table style="width: 100%; font-size: 8px; border-collapse: collapse; padding: 0 20px;">
            <tr style="border-bottom: 1px solid #0066cc;">
              <td style="padding: 8px; font-weight: bold; color: #0066cc; width: 40%;">Description</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">Hours</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">Rate</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">Current</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">YTD</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">${formData.payType === 'salary' ? 'Salary' : 'Regular'}</td>
              <td style="padding: 8px; text-align: right;">${formData.payType === 'salary' ? '-' : hours}</td>
              <td style="padding: 8px; text-align: right;">${formData.payType === 'salary' ? '-' : fmt(rate)}</td>
              <td style="padding: 8px; text-align: right;">${fmt(regularPay)}</td>
              <td style="padding: 8px; text-align: right;">${fmt(regularPay)}</td>
            </tr>
            ${overtime > 0 && formData.payType === 'hourly' ? `
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Overtime</td>
              <td style="padding: 8px; text-align: right;">${overtime}</td>
              <td style="padding: 8px; text-align: right;">${fmt(rate * 1.5)}</td>
              <td style="padding: 8px; text-align: right;">${fmt(overtimePay)}</td>
              <td style="padding: 8px; text-align: right;">${fmt(overtimePay)}</td>
            </tr>
            ` : ''}
            <tr style="background: #f0f4f8;">
              <td style="padding: 8px; font-weight: bold;">Gross Pay</td>
              <td style="padding: 8px;"></td>
              <td style="padding: 8px;"></td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(grossPay)}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(grossPay)}</td>
            </tr>
          </table>
          
          <!-- Taxes Section -->
          <div style="background: #0066cc; padding: 8px 20px; margin-top: 10px;">
            <span style="color: #fff; font-size: 10px; font-weight: bold;">Taxes</span>
          </div>
          <table style="width: 100%; font-size: 8px; border-collapse: collapse; padding: 0 20px;">
            <tr style="border-bottom: 1px solid #0066cc;">
              <td style="padding: 8px; font-weight: bold; color: #0066cc; width: 60%;">Description</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">Current</td>
              <td style="padding: 8px; font-weight: bold; color: #0066cc; text-align: right;">YTD</td>
            </tr>
            ${type === 'us' ? `
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">Federal Income Tax</td><td style="padding: 8px; text-align: right;">${fmt(federalTax)}</td><td style="padding: 8px; text-align: right;">${fmt(federalTax)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">Social Security</td><td style="padding: 8px; text-align: right;">${fmt(ssTax)}</td><td style="padding: 8px; text-align: right;">${fmt(ssTax)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">Medicare</td><td style="padding: 8px; text-align: right;">${fmt(medTax)}</td><td style="padding: 8px; text-align: right;">${fmt(medTax)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">${(formData.state || 'State').toUpperCase()} Income Tax</td><td style="padding: 8px; text-align: right;">${fmt(stateTax)}</td><td style="padding: 8px; text-align: right;">${fmt(stateTax)}</td></tr>
            ` : `
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">Federal Tax</td><td style="padding: 8px; text-align: right;">${fmt(federalTax)}</td><td style="padding: 8px; text-align: right;">${fmt(federalTax)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">CPP</td><td style="padding: 8px; text-align: right;">${fmt(cpp)}</td><td style="padding: 8px; text-align: right;">${fmt(cpp)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">EI</td><td style="padding: 8px; text-align: right;">${fmt(ei)}</td><td style="padding: 8px; text-align: right;">${fmt(ei)}</td></tr>
            <tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 8px;">${(formData.province || 'Provincial').toUpperCase()} Tax</td><td style="padding: 8px; text-align: right;">${fmt(provincial)}</td><td style="padding: 8px; text-align: right;">${fmt(provincial)}</td></tr>
            `}
            <tr style="background: #f0f4f8;">
              <td style="padding: 8px; font-weight: bold;">Total Taxes</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(totalTax)}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(totalTax)}</td>
            </tr>
          </table>
          
          <!-- Net Pay Box -->
          <div style="background: #0066cc; margin: 15px 20px; padding: 15px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600;">Net Pay</div>
              <div style="color: #fff; font-size: 24px; font-weight: bold;">${fmt(netPay)}</div>
            </div>
            ${formData.bankName ? `<div style="color: rgba(255,255,255,0.7); font-size: 8px; margin-top: 5px;">Direct Deposit: ${formData.bankName} ****${formData.bank || '0000'}</div>` : ''}
          </div>
        </div>
      `;
    } else if (template === 'template-h') {
      // ONPAY TEMPLATE
      templateHtml = `
        <div style="font-family: Helvetica, Arial, sans-serif; padding: 20px; background: #fafafa;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div>
              <div style="font-size: 14px; font-weight: bold;">${formData.company}</div>
              <div style="font-size: 8px; color: #666;">${formData.companyAddress}</div>
              <div style="font-size: 8px; color: #666;">${formData.companyCity}, ${type === 'us' ? formData.companyState : formData.companyProvince}</div>
            </div>
            <div style="background: #7c3aed; padding: 6px 12px; border-radius: 4px;">
              <span style="color: #fff; font-size: 10px; font-weight: bold;">OnPay</span>
            </div>
          </div>
          
          <!-- Title -->
          <div style="border-bottom: 3px solid #7c3aed; padding-bottom: 8px; margin-bottom: 15px;">
            <div style="font-size: 20px; font-weight: 800; color: #7c3aed;">Pay Stub</div>
            <div style="font-size: 9px; color: #666;">${startDate} through ${endDate}</div>
          </div>
          
          <!-- Employee Card -->
          <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 9px; font-weight: bold; color: #7c3aed; text-transform: uppercase; margin-bottom: 8px;">Employee</div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;">
              <span style="color: #666;">Name:</span>
              <span style="font-weight: 600;">${formData.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;">
              <span style="color: #666;">${type === 'us' ? 'SSN:' : 'SIN:'}</span>
              <span style="font-weight: 600;">***-**-${type === 'us' ? formData.ssn : formData.sin}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8px;">
              <span style="color: #666;">Pay Date:</span>
              <span style="font-weight: 600;">${payDate}</span>
            </div>
          </div>
          
          <!-- Earnings Card -->
          <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 9px; font-weight: bold; color: #7c3aed; text-transform: uppercase; margin-bottom: 8px;">Earnings</div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;">
              <span style="color: #666;">${formData.payType === 'salary' ? 'Salary' : 'Regular Pay'}</span>
              <span style="font-weight: 600;">${fmt(regularPay)}</span>
            </div>
            ${overtime > 0 && formData.payType === 'hourly' ? `
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;">
              <span style="color: #666;">Overtime</span>
              <span style="font-weight: 600;">${fmt(overtimePay)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 9px; border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 8px;">
              <span style="font-weight: bold;">Gross Pay</span>
              <span style="font-weight: bold;">${fmt(grossPay)}</span>
            </div>
          </div>
          
          <!-- Taxes Card -->
          <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 9px; font-weight: bold; color: #7c3aed; text-transform: uppercase; margin-bottom: 8px;">Taxes</div>
            ${type === 'us' ? `
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">Federal Tax</span><span style="font-weight: 600;">${fmt(federalTax)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">Social Security</span><span style="font-weight: 600;">${fmt(ssTax)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">Medicare</span><span style="font-weight: 600;">${fmt(medTax)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">${(formData.state || 'State').toUpperCase()} Tax</span><span style="font-weight: 600;">${fmt(stateTax)}</span></div>
            ` : `
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">Federal Tax</span><span style="font-weight: 600;">${fmt(federalTax)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">CPP</span><span style="font-weight: 600;">${fmt(cpp)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">EI</span><span style="font-weight: 600;">${fmt(ei)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 4px;"><span style="color: #666;">${(formData.province || 'Provincial').toUpperCase()} Tax</span><span style="font-weight: 600;">${fmt(provincial)}</span></div>
            `}
            <div style="display: flex; justify-content: space-between; font-size: 9px; border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 8px;">
              <span style="font-weight: bold;">Total Taxes</span>
              <span style="font-weight: bold; color: #dc2626;">-${fmt(totalTax)}</span>
            </div>
          </div>
          
          <!-- Net Pay Banner -->
          <div style="background: #7c3aed; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.8); font-size: 10px; font-weight: 600;">NET PAY</div>
            <div style="color: #fff; font-size: 28px; font-weight: 800;">${fmt(netPay)}</div>
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #e5e5e5; padding: 8px; }
        </style>
      </head>
      <body>
        ${templateHtml}
      </body>
      </html>
    `;
  };

  const html = generatePreviewHtml();

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.light} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        onLoadEnd={() => setIsLoading(false)}
        onError={(e) => console.log('WebView error:', e)}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.slate[200],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 450,
    marginBottom: spacing.base,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.slate[200],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
  },
});

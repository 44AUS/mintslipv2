import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

// Accurate template preview matching frontend PDF templates
export default function PaystubPreview({ data, type = 'us', template = 'template-a' }) {
  const formatCurrency = (num) => {
    const value = parseFloat(num) || 0;
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
    return dateStr;
  };

  // Calculate values
  const hours = parseFloat(data.hours) || 0;
  const overtime = parseFloat(data.overtime) || 0;
  const rate = parseFloat(data.rate) || 0;
  const annualSalary = parseFloat(data.annualSalary) || 0;

  let grossPay = 0, regularPay = 0, overtimePay = 0;

  if (data.payType === 'hourly') {
    regularPay = hours * rate;
    overtimePay = overtime * rate * 1.5;
    grossPay = regularPay + overtimePay;
  } else {
    const frequencies = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
    grossPay = annualSalary / (frequencies[data.payFrequency] || 26);
    regularPay = grossPay;
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

  const calculations = { grossPay, regularPay, overtimePay, ssTax, medTax, federalTax, stateTax, cpp, ei, provincial, totalTax, netPay, hours, overtime, rate };

  // Render based on template
  if (template === 'template-c') {
    return <WorkdayTemplate data={data} type={type} calc={calculations} fmt={formatCurrency} fmtDate={formatDate} />;
  } else if (template === 'template-h') {
    return <OnPayTemplate data={data} type={type} calc={calculations} fmt={formatCurrency} fmtDate={formatDate} />;
  }
  return <GustoTemplate data={data} type={type} calc={calculations} fmt={formatCurrency} fmtDate={formatDate} />;
}

// ============ TEMPLATE A: GUSTO STYLE ============
// Matches: Green "gusto" logo, gray info boxes, section headers with green underline
function GustoTemplate({ data, type, calc, fmt, fmtDate }) {
  const { grossPay, regularPay, overtimePay, ssTax, medTax, federalTax, stateTax, cpp, ei, provincial, totalTax, netPay, hours, overtime, rate } = calc;

  return (
    <View style={gustoStyles.container}>
      <ScrollView style={gustoStyles.scroll} contentContainerStyle={gustoStyles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={gustoStyles.paper}>
          {/* HEADER: Logo + Company/Employee boxes */}
          <View style={gustoStyles.header}>
            <View style={gustoStyles.logoArea}>
              <Text style={gustoStyles.logo}>gusto</Text>
            </View>
          </View>

          {/* Earnings Statement Title + Pay Period */}
          <Text style={gustoStyles.title}>Earnings Statement</Text>
          <Text style={gustoStyles.payPeriod}>
            Pay period: {fmtDate(data.startDate)} – {fmtDate(data.endDate)}   Pay Day: {fmtDate(data.payDate)}
          </Text>
          <Text style={gustoStyles.employeeDeposit}>{data.name || 'Employee Name'} (...******{data.bank || '0000'})</Text>

          {/* Gray Info Boxes */}
          <View style={gustoStyles.infoBoxes}>
            <View style={gustoStyles.infoBox}>
              <Text style={gustoStyles.infoBoxTitle}>Company</Text>
              <Text style={gustoStyles.infoBoxText}>{data.company || 'Company Name'}</Text>
              <Text style={gustoStyles.infoBoxText}>{data.companyAddress || ''}</Text>
              <Text style={gustoStyles.infoBoxText}>{data.companyCity || ''}, {type === 'us' ? data.companyState : data.companyProvince || ''} {type === 'us' ? data.companyZip : data.companyPostalCode || ''}</Text>
              <Text style={gustoStyles.infoBoxText}>{data.companyPhone || ''}</Text>
            </View>
            <View style={gustoStyles.infoBox}>
              <Text style={gustoStyles.infoBoxTitle}>Employee</Text>
              <Text style={gustoStyles.infoBoxText}>{data.name || 'Employee Name'}</Text>
              <Text style={gustoStyles.infoBoxText}>XXX-XX-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
              <Text style={gustoStyles.infoBoxText}>{data.address || ''}</Text>
              <Text style={gustoStyles.infoBoxText}>{data.city || ''}, {type === 'us' ? data.state : data.province || ''} {type === 'us' ? data.zip : data.postalCode || ''}</Text>
            </View>
          </View>

          {/* EARNINGS SECTION */}
          <View style={gustoStyles.sectionHeader}>
            <Text style={gustoStyles.sectionTitle}>Employee Gross Earnings</Text>
          </View>
          <View style={gustoStyles.table}>
            <View style={gustoStyles.tableHeaderRow}>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 2.5 }]}>Description</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Rate</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Hours</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1.2 }]}>Current</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1.2 }]}>Year-To-Date</Text>
            </View>
            <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
              <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2.5 }]}>
                {data.payType === 'salary' ? 'Salary | Per Period' : 'Regular Hours | Hourly'}
              </Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{data.payType === 'salary' ? `${fmt(data.annualSalary)}/yr` : fmt(rate)}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{data.payType === 'salary' ? '-' : hours.toString()}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1.2 }]}>{fmt(regularPay)}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1.2 }]}>{fmt(regularPay)}</Text>
            </View>
            {overtime > 0 && data.payType === 'hourly' && (
              <View style={gustoStyles.tableRow}>
                <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2.5 }]}>Overtime Hours | 1.5x</Text>
                <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(rate * 1.5)}</Text>
                <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{overtime.toString()}</Text>
                <Text style={[gustoStyles.tableCell, { flex: 1.2 }]}>{fmt(overtimePay)}</Text>
                <Text style={[gustoStyles.tableCell, { flex: 1.2 }]}>{fmt(overtimePay)}</Text>
              </View>
            )}
          </View>

          {/* TAXES SECTION - Two Columns */}
          <View style={gustoStyles.taxColumns}>
            <View style={gustoStyles.taxColumn}>
              <View style={gustoStyles.sectionHeader}>
                <Text style={gustoStyles.sectionTitle}>Employee Taxes Withheld</Text>
              </View>
              <View style={gustoStyles.table}>
                <View style={gustoStyles.tableHeaderRow}>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 2 }]}>Description</Text>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Current</Text>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>YTD</Text>
                </View>
                {type === 'us' ? (
                  <>
                    <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Federal Income Tax</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(federalTax)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(federalTax)}</Text>
                    </View>
                    <View style={gustoStyles.tableRow}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Social Security (6.2%)</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(ssTax)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(ssTax)}</Text>
                    </View>
                    <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Medicare (1.45%)</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(medTax)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(medTax)}</Text>
                    </View>
                    <View style={gustoStyles.tableRow}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>{data.state?.toUpperCase() || 'State'} Tax</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(stateTax)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(stateTax)}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Federal Income Tax</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(federalTax)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(federalTax)}</Text>
                    </View>
                    <View style={gustoStyles.tableRow}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>CPP (5.95%)</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(cpp)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(cpp)}</Text>
                    </View>
                    <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>EI (1.63%)</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(ei)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(ei)}</Text>
                    </View>
                    <View style={gustoStyles.tableRow}>
                      <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>{data.province?.toUpperCase() || 'Prov'} Tax</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(provincial)}</Text>
                      <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(provincial)}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={gustoStyles.taxColumn}>
              <View style={gustoStyles.sectionHeader}>
                <Text style={gustoStyles.sectionTitle}>Employer Tax</Text>
              </View>
              <View style={gustoStyles.table}>
                <View style={gustoStyles.tableHeaderRow}>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 2 }]}>Company Tax</Text>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Current</Text>
                  <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>YTD</Text>
                </View>
                <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Social Security (6.2%)</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.062)}</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.062)}</Text>
                </View>
                <View style={gustoStyles.tableRow}>
                  <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Medicare (1.45%)</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.0145)}</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.0145)}</Text>
                </View>
                <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>FUTA (0.6%)</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.006)}</Text>
                  <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay * 0.006)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SUMMARY SECTION */}
          <View style={gustoStyles.sectionHeader}>
            <Text style={gustoStyles.sectionTitle}>Summary</Text>
          </View>
          <View style={gustoStyles.table}>
            <View style={gustoStyles.tableHeaderRow}>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Current</Text>
              <Text style={[gustoStyles.tableHeaderCell, { flex: 1 }]}>Year-To-Date</Text>
            </View>
            <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
              <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Gross Earnings</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay)}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(grossPay)}</Text>
            </View>
            <View style={gustoStyles.tableRow}>
              <Text style={[gustoStyles.tableCell, gustoStyles.tableCellUnderline, { flex: 2 }]}>Taxes</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(totalTax)}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1 }]}>{fmt(totalTax)}</Text>
            </View>
            <View style={[gustoStyles.tableRow, { backgroundColor: '#f5f5f5' }]}>
              <Text style={[gustoStyles.tableCell, { flex: 2, fontWeight: '700' }]}>Net Pay</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1, fontWeight: '700' }]}>{fmt(netPay)}</Text>
              <Text style={[gustoStyles.tableCell, { flex: 1, fontWeight: '700' }]}>{fmt(netPay)}</Text>
            </View>
          </View>

          {/* NET PAY BOX */}
          <View style={gustoStyles.netPayBox}>
            <Text style={gustoStyles.netPayLabel}>Net Pay</Text>
            <Text style={gustoStyles.netPayAmount}>{fmt(netPay)}</Text>
            {data.bankName && <Text style={gustoStyles.netPayDeposit}>Direct Deposit to {data.bankName} (...{data.bank || '0000'})</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============ TEMPLATE C: WORKDAY STYLE ============
// Matches: Blue header bar, "Payslip" title, blue section headers, clean corporate look
function WorkdayTemplate({ data, type, calc, fmt, fmtDate }) {
  const { grossPay, regularPay, overtimePay, ssTax, medTax, federalTax, stateTax, cpp, ei, provincial, totalTax, netPay, hours, overtime, rate } = calc;

  return (
    <View style={workdayStyles.container}>
      <ScrollView style={workdayStyles.scroll} contentContainerStyle={workdayStyles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={workdayStyles.paper}>
          {/* Blue Header Bar */}
          <View style={workdayStyles.headerBar}>
            <Text style={workdayStyles.logo}>workday</Text>
            <Text style={workdayStyles.title}>Payslip</Text>
          </View>

          {/* Employee & Company Info Row */}
          <View style={workdayStyles.infoRow}>
            <View style={workdayStyles.infoCol}>
              <Text style={workdayStyles.infoLabel}>Employee Name</Text>
              <Text style={workdayStyles.infoValue}>{data.name || 'Employee Name'}</Text>
              <Text style={workdayStyles.infoLabel}>Employee ID</Text>
              <Text style={workdayStyles.infoValue}>XXX-XX-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
            </View>
            <View style={workdayStyles.infoCol}>
              <Text style={workdayStyles.infoLabel}>Company</Text>
              <Text style={workdayStyles.infoValue}>{data.company || 'Company Name'}</Text>
              <Text style={workdayStyles.infoLabel}>Pay Period</Text>
              <Text style={workdayStyles.infoValue}>{fmtDate(data.startDate)} - {fmtDate(data.endDate)}</Text>
            </View>
            <View style={workdayStyles.infoCol}>
              <Text style={workdayStyles.infoLabel}>Pay Date</Text>
              <Text style={workdayStyles.infoValue}>{fmtDate(data.payDate)}</Text>
              <Text style={workdayStyles.infoLabel}>Pay Frequency</Text>
              <Text style={workdayStyles.infoValue}>{(data.payFrequency || 'Biweekly').charAt(0).toUpperCase() + (data.payFrequency || 'biweekly').slice(1)}</Text>
            </View>
          </View>

          {/* Earnings Section */}
          <View style={workdayStyles.sectionHeader}>
            <Text style={workdayStyles.sectionTitle}>Earnings</Text>
          </View>
          <View style={workdayStyles.table}>
            <View style={workdayStyles.tableHeaderRow}>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Hours</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Current</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>YTD</Text>
            </View>
            <View style={workdayStyles.tableRow}>
              <Text style={[workdayStyles.tableCell, { flex: 2 }]}>{data.payType === 'salary' ? 'Salary' : 'Regular'}</Text>
              <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{data.payType === 'salary' ? '-' : hours}</Text>
              <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{data.payType === 'salary' ? '-' : fmt(rate)}</Text>
              <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(regularPay)}</Text>
              <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(regularPay)}</Text>
            </View>
            {overtime > 0 && data.payType === 'hourly' && (
              <View style={workdayStyles.tableRow}>
                <Text style={[workdayStyles.tableCell, { flex: 2 }]}>Overtime</Text>
                <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{overtime}</Text>
                <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(rate * 1.5)}</Text>
                <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(overtimePay)}</Text>
                <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(overtimePay)}</Text>
              </View>
            )}
            <View style={workdayStyles.tableTotalRow}>
              <Text style={[workdayStyles.tableTotalCell, { flex: 2 }]}>Gross Pay</Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1 }]}></Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1 }]}></Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1, textAlign: 'right' }]}>{fmt(grossPay)}</Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1, textAlign: 'right' }]}>{fmt(grossPay)}</Text>
            </View>
          </View>

          {/* Taxes Section */}
          <View style={workdayStyles.sectionHeader}>
            <Text style={workdayStyles.sectionTitle}>Taxes</Text>
          </View>
          <View style={workdayStyles.table}>
            <View style={workdayStyles.tableHeaderRow}>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Current</Text>
              <Text style={[workdayStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>YTD</Text>
            </View>
            {type === 'us' ? (
              <>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>Federal Income Tax</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(federalTax)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(federalTax)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>Social Security</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(ssTax)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(ssTax)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>Medicare</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(medTax)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(medTax)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>{data.state?.toUpperCase() || 'State'} Income Tax</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(stateTax)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(stateTax)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>Federal Tax</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(federalTax)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(federalTax)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>CPP</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(cpp)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(cpp)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>EI</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(ei)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(ei)}</Text>
                </View>
                <View style={workdayStyles.tableRow}>
                  <Text style={[workdayStyles.tableCell, { flex: 2 }]}>{data.province?.toUpperCase() || 'Provincial'} Tax</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(provincial)}</Text>
                  <Text style={[workdayStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(provincial)}</Text>
                </View>
              </>
            )}
            <View style={workdayStyles.tableTotalRow}>
              <Text style={[workdayStyles.tableTotalCell, { flex: 2 }]}>Total Taxes</Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1, textAlign: 'right' }]}>{fmt(totalTax)}</Text>
              <Text style={[workdayStyles.tableTotalCell, { flex: 1, textAlign: 'right' }]}>{fmt(totalTax)}</Text>
            </View>
          </View>

          {/* Net Pay Box */}
          <View style={workdayStyles.netPayBox}>
            <View style={workdayStyles.netPayRow}>
              <Text style={workdayStyles.netPayLabel}>Net Pay</Text>
              <Text style={workdayStyles.netPayAmount}>{fmt(netPay)}</Text>
            </View>
            {data.bankName && (
              <Text style={workdayStyles.netPayDeposit}>Direct Deposit: {data.bankName} ****{data.bank || '0000'}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============ TEMPLATE H: ONPAY STYLE ============
// Matches: Purple accents, "OnPay" branding, modern card-based layout
function OnPayTemplate({ data, type, calc, fmt, fmtDate }) {
  const { grossPay, regularPay, overtimePay, ssTax, medTax, federalTax, stateTax, cpp, ei, provincial, totalTax, netPay, hours, overtime, rate } = calc;

  return (
    <View style={onpayStyles.container}>
      <ScrollView style={onpayStyles.scroll} contentContainerStyle={onpayStyles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={onpayStyles.paper}>
          {/* Header */}
          <View style={onpayStyles.header}>
            <View>
              <Text style={onpayStyles.companyName}>{data.company || 'Company Name'}</Text>
              <Text style={onpayStyles.companyDetail}>{data.companyAddress || ''}</Text>
              <Text style={onpayStyles.companyDetail}>{data.companyCity || ''}, {type === 'us' ? data.companyState : data.companyProvince || ''}</Text>
            </View>
            <View style={onpayStyles.logoBadge}>
              <Text style={onpayStyles.logoText}>OnPay</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={onpayStyles.titleSection}>
            <Text style={onpayStyles.title}>Pay Stub</Text>
            <Text style={onpayStyles.period}>{fmtDate(data.startDate)} through {fmtDate(data.endDate)}</Text>
          </View>

          {/* Employee Card */}
          <View style={onpayStyles.card}>
            <Text style={onpayStyles.cardTitle}>Employee</Text>
            <View style={onpayStyles.cardRow}>
              <Text style={onpayStyles.cardLabel}>Name:</Text>
              <Text style={onpayStyles.cardValue}>{data.name || 'Employee Name'}</Text>
            </View>
            <View style={onpayStyles.cardRow}>
              <Text style={onpayStyles.cardLabel}>{type === 'us' ? 'SSN:' : 'SIN:'}</Text>
              <Text style={onpayStyles.cardValue}>***-**-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
            </View>
            <View style={onpayStyles.cardRow}>
              <Text style={onpayStyles.cardLabel}>Pay Date:</Text>
              <Text style={onpayStyles.cardValue}>{fmtDate(data.payDate)}</Text>
            </View>
          </View>

          {/* Earnings Card */}
          <View style={onpayStyles.card}>
            <Text style={onpayStyles.cardTitle}>Earnings</Text>
            <View style={onpayStyles.cardRow}>
              <Text style={onpayStyles.cardLabel}>{data.payType === 'salary' ? 'Salary' : 'Regular Pay'}</Text>
              <Text style={onpayStyles.cardValue}>{fmt(regularPay)}</Text>
            </View>
            {overtime > 0 && data.payType === 'hourly' && (
              <View style={onpayStyles.cardRow}>
                <Text style={onpayStyles.cardLabel}>Overtime</Text>
                <Text style={onpayStyles.cardValue}>{fmt(overtimePay)}</Text>
              </View>
            )}
            <View style={onpayStyles.cardTotalRow}>
              <Text style={onpayStyles.cardTotalLabel}>Gross Pay</Text>
              <Text style={onpayStyles.cardTotalValue}>{fmt(grossPay)}</Text>
            </View>
          </View>

          {/* Taxes Card */}
          <View style={onpayStyles.card}>
            <Text style={onpayStyles.cardTitle}>Taxes</Text>
            {type === 'us' ? (
              <>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>Federal Tax</Text><Text style={onpayStyles.cardValue}>{fmt(federalTax)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>Social Security</Text><Text style={onpayStyles.cardValue}>{fmt(ssTax)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>Medicare</Text><Text style={onpayStyles.cardValue}>{fmt(medTax)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>{data.state?.toUpperCase() || 'State'} Tax</Text><Text style={onpayStyles.cardValue}>{fmt(stateTax)}</Text></View>
              </>
            ) : (
              <>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>Federal Tax</Text><Text style={onpayStyles.cardValue}>{fmt(federalTax)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>CPP</Text><Text style={onpayStyles.cardValue}>{fmt(cpp)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>EI</Text><Text style={onpayStyles.cardValue}>{fmt(ei)}</Text></View>
                <View style={onpayStyles.cardRow}><Text style={onpayStyles.cardLabel}>{data.province?.toUpperCase() || 'Provincial'} Tax</Text><Text style={onpayStyles.cardValue}>{fmt(provincial)}</Text></View>
              </>
            )}
            <View style={onpayStyles.cardTotalRow}>
              <Text style={onpayStyles.cardTotalLabel}>Total Taxes</Text>
              <Text style={[onpayStyles.cardTotalValue, { color: '#dc2626' }]}>-{fmt(totalTax)}</Text>
            </View>
          </View>

          {/* Net Pay Banner */}
          <View style={onpayStyles.netPayBanner}>
            <Text style={onpayStyles.netPayLabel}>NET PAY</Text>
            <Text style={onpayStyles.netPayAmount}>{fmt(netPay)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============ GUSTO STYLES ============
const gustoStyles = StyleSheet.create({
  container: { backgroundColor: '#e5e5e5', borderRadius: 8, padding: 6, marginBottom: 12, height: 450 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  paper: { backgroundColor: '#fff', padding: 12, borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { marginBottom: 8 },
  logoArea: { marginBottom: 8 },
  logo: { fontSize: 16, fontWeight: '700', color: '#00a8a1' },
  title: { fontSize: 12, fontWeight: '700', color: '#000', marginBottom: 4 },
  payPeriod: { fontSize: 7, color: '#000', marginBottom: 2 },
  employeeDeposit: { fontSize: 7, color: '#000', marginBottom: 8 },
  infoBoxes: { flexDirection: 'row', marginBottom: 10 },
  infoBox: { flex: 1, backgroundColor: '#f8f8f8', padding: 8, marginRight: 4, borderRadius: 2 },
  infoBoxTitle: { fontSize: 7, fontWeight: '700', color: '#000', marginBottom: 4 },
  infoBoxText: { fontSize: 6, color: '#000', marginBottom: 1 },
  sectionHeader: { borderBottomWidth: 2, borderBottomColor: '#00a8a1', marginBottom: 6, paddingBottom: 2 },
  sectionTitle: { fontSize: 8, fontWeight: '700', color: '#000' },
  table: { marginBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', marginBottom: 2 },
  tableHeaderCell: { fontSize: 6, fontWeight: '700', color: '#000' },
  tableRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tableCell: { fontSize: 6, color: '#000' },
  tableCellUnderline: { textDecorationLine: 'underline' },
  taxColumns: { flexDirection: 'row', marginBottom: 8 },
  taxColumn: { flex: 1, marginRight: 4 },
  netPayBox: { backgroundColor: '#f8f8f8', padding: 10, borderRadius: 4, marginTop: 8 },
  netPayLabel: { fontSize: 8, fontWeight: '700', color: '#000' },
  netPayAmount: { fontSize: 14, fontWeight: '700', color: '#00a8a1', marginTop: 2 },
  netPayDeposit: { fontSize: 6, color: '#666', marginTop: 4 },
});

// ============ WORKDAY STYLES ============
const workdayStyles = StyleSheet.create({
  container: { backgroundColor: '#e5e5e5', borderRadius: 8, padding: 6, marginBottom: 12, height: 450 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  paper: { backgroundColor: '#fff', borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, overflow: 'hidden' },
  headerBar: { backgroundColor: '#0066cc', paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 12, fontWeight: '700', color: '#fff' },
  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  infoRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 5, color: '#666', textTransform: 'uppercase', marginBottom: 1 },
  infoValue: { fontSize: 7, color: '#000', fontWeight: '500', marginBottom: 4 },
  sectionHeader: { backgroundColor: '#0066cc', paddingVertical: 4, paddingHorizontal: 10 },
  sectionTitle: { fontSize: 8, fontWeight: '700', color: '#fff' },
  table: { paddingHorizontal: 10, paddingVertical: 4 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0066cc', paddingBottom: 2, marginBottom: 2 },
  tableHeaderCell: { fontSize: 6, fontWeight: '700', color: '#0066cc' },
  tableRow: { flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tableCell: { fontSize: 6, color: '#333' },
  tableTotalRow: { flexDirection: 'row', paddingVertical: 4, backgroundColor: '#f0f4f8', marginTop: 4 },
  tableTotalCell: { fontSize: 6, fontWeight: '700', color: '#000' },
  netPayBox: { backgroundColor: '#0066cc', padding: 12, margin: 10, borderRadius: 4 },
  netPayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netPayLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  netPayAmount: { fontSize: 18, fontWeight: '700', color: '#fff' },
  netPayDeposit: { fontSize: 6, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
});

// ============ ONPAY STYLES ============
const onpayStyles = StyleSheet.create({
  container: { backgroundColor: '#e5e5e5', borderRadius: 8, padding: 6, marginBottom: 12, height: 450 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  paper: { backgroundColor: '#fafafa', padding: 12, borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  companyName: { fontSize: 10, fontWeight: '700', color: '#000' },
  companyDetail: { fontSize: 6, color: '#666' },
  logoBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  logoText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  titleSection: { borderBottomWidth: 2, borderBottomColor: '#7c3aed', paddingBottom: 6, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800', color: '#7c3aed' },
  period: { fontSize: 7, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 6, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  cardTitle: { fontSize: 7, fontWeight: '700', color: '#7c3aed', marginBottom: 6, textTransform: 'uppercase' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  cardLabel: { fontSize: 6, color: '#666' },
  cardValue: { fontSize: 6, fontWeight: '600', color: '#000' },
  cardTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 4 },
  cardTotalLabel: { fontSize: 7, fontWeight: '700', color: '#000' },
  cardTotalValue: { fontSize: 8, fontWeight: '700', color: '#000' },
  netPayBanner: { backgroundColor: '#7c3aed', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  netPayLabel: { fontSize: 7, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  netPayAmount: { fontSize: 20, fontWeight: '800', color: '#fff' },
});

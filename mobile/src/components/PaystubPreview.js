import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export default function PaystubPreview({ data, type = 'us', template = 'template-a' }) {
  const formatCurrency = (num) => {
    const value = parseFloat(num) || 0;
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  // Calculate values
  const hours = parseFloat(data.hours) || 0;
  const overtime = parseFloat(data.overtime) || 0;
  const rate = parseFloat(data.rate) || 0;
  const annualSalary = parseFloat(data.annualSalary) || 0;

  let grossPay = 0;
  let regularPay = 0;
  let overtimePay = 0;

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
  const socialSecurity = grossPay * 0.062;
  const medicare = grossPay * 0.0145;
  const federal = grossPay * 0.12;
  const stateTax = grossPay * 0.05;
  
  // Canadian specific
  const cpp = grossPay * 0.0595;
  const ei = grossPay * 0.0163;
  const provincial = grossPay * 0.05;

  const totalDeductions = type === 'us' 
    ? socialSecurity + medicare + federal + stateTax
    : cpp + ei + federal + provincial;
  
  const netPay = grossPay - totalDeductions;

  // Render based on template
  if (template === 'template-c') {
    return <WorkdayTemplate data={data} type={type} calculations={{ grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate }} formatCurrency={formatCurrency} formatDate={formatDate} />;
  } else if (template === 'template-h') {
    return <OnPayTemplate data={data} type={type} calculations={{ grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate }} formatCurrency={formatCurrency} formatDate={formatDate} />;
  }
  
  // Default: Template A (Gusto)
  return <GustoTemplate data={data} type={type} calculations={{ grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate }} formatCurrency={formatCurrency} formatDate={formatDate} />;
}

// Template A: Gusto Style - Clean professional look with green accents
function GustoTemplate({ data, type, calculations, formatCurrency, formatDate }) {
  const { grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate } = calculations;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={[styles.paper, styles.gustoPaper]}>
          {/* Gusto Header */}
          <View style={styles.gustoHeader}>
            <View style={styles.gustoLogoSection}>
              <View style={styles.gustoLogo}>
                <Text style={styles.gustoLogoText}>gusto</Text>
              </View>
              <View>
                <Text style={styles.gustoCompanyName}>{data.company || 'COMPANY NAME'}</Text>
                <Text style={styles.gustoCompanyDetail}>{data.companyAddress || '123 Business Ave'}</Text>
                <Text style={styles.gustoCompanyDetail}>{data.companyCity || 'City'}, {type === 'us' ? data.companyState : data.companyProvince || 'ST'} {type === 'us' ? data.companyZip : data.companyPostalCode || '00000'}</Text>
              </View>
            </View>
            <View style={styles.gustoPayStubLabel}>
              <Text style={styles.gustoTitle}>Earnings Statement</Text>
              <Text style={styles.gustoPayPeriod}>Pay Period: {formatDate(data.startDate)} - {formatDate(data.endDate)}</Text>
            </View>
          </View>

          <View style={styles.gustoDivider} />

          {/* Employee Info */}
          <View style={styles.gustoEmployeeSection}>
            <View style={styles.gustoEmployeeLeft}>
              <Text style={styles.gustoLabel}>EMPLOYEE</Text>
              <Text style={styles.gustoEmployeeName}>{data.name || 'Employee Name'}</Text>
              <Text style={styles.gustoEmployeeDetail}>{data.address || '456 Home Street'}</Text>
              <Text style={styles.gustoEmployeeDetail}>{data.city || 'City'}, {type === 'us' ? data.state : data.province || 'ST'} {type === 'us' ? data.zip : data.postalCode || '00000'}</Text>
            </View>
            <View style={styles.gustoEmployeeRight}>
              <View style={styles.gustoInfoRow}>
                <Text style={styles.gustoInfoLabel}>{type === 'us' ? 'SSN:' : 'SIN:'}</Text>
                <Text style={styles.gustoInfoValue}>***-**-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
              </View>
              <View style={styles.gustoInfoRow}>
                <Text style={styles.gustoInfoLabel}>Pay Rate:</Text>
                <Text style={styles.gustoInfoValue}>{data.payType === 'hourly' ? `${formatCurrency(rate)}/hr` : 'Salary'}</Text>
              </View>
              <View style={styles.gustoInfoRow}>
                <Text style={styles.gustoInfoLabel}>Pay Date:</Text>
                <Text style={styles.gustoInfoValue}>{formatDate(data.payDate)}</Text>
              </View>
            </View>
          </View>

          {/* Earnings Table */}
          <View style={styles.gustoTableSection}>
            <View style={styles.gustoTableHeader}>
              <Text style={[styles.gustoTableHeaderText, { flex: 2 }]}>EARNINGS</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1, textAlign: 'center' }]}>HOURS</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1, textAlign: 'right' }]}>RATE</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1.2, textAlign: 'right' }]}>CURRENT</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1.2, textAlign: 'right' }]}>YTD</Text>
            </View>
            
            <View style={styles.gustoTableRow}>
              <Text style={[styles.gustoTableCell, { flex: 2 }]}>Regular Pay</Text>
              <Text style={[styles.gustoTableCell, { flex: 1, textAlign: 'center' }]}>{data.payType === 'hourly' ? hours.toFixed(2) : '-'}</Text>
              <Text style={[styles.gustoTableCell, { flex: 1, textAlign: 'right' }]}>{data.payType === 'hourly' ? formatCurrency(rate) : '-'}</Text>
              <Text style={[styles.gustoTableCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(regularPay)}</Text>
              <Text style={[styles.gustoTableCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(regularPay)}</Text>
            </View>

            {overtime > 0 && (
              <View style={styles.gustoTableRow}>
                <Text style={[styles.gustoTableCell, { flex: 2 }]}>Overtime</Text>
                <Text style={[styles.gustoTableCell, { flex: 1, textAlign: 'center' }]}>{overtime.toFixed(2)}</Text>
                <Text style={[styles.gustoTableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(rate * 1.5)}</Text>
                <Text style={[styles.gustoTableCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(overtimePay)}</Text>
                <Text style={[styles.gustoTableCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(overtimePay)}</Text>
              </View>
            )}

            <View style={styles.gustoTableRowTotal}>
              <Text style={[styles.gustoTableCellBold, { flex: 2 }]}>Gross Pay</Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1 }]}></Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1 }]}></Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(grossPay)}</Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(grossPay)}</Text>
            </View>
          </View>

          {/* Deductions Table */}
          <View style={styles.gustoTableSection}>
            <View style={styles.gustoTableHeader}>
              <Text style={[styles.gustoTableHeaderText, { flex: 3 }]}>DEDUCTIONS</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1.5, textAlign: 'right' }]}>CURRENT</Text>
              <Text style={[styles.gustoTableHeaderText, { flex: 1.5, textAlign: 'right' }]}>YTD</Text>
            </View>

            {type === 'us' ? (
              <>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>Federal Income Tax</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(federal)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>Social Security (FICA)</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(socialSecurity)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(socialSecurity)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>Medicare</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(medicare)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(medicare)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>State Income Tax ({data.state || 'ST'})</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(stateTax)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(stateTax)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>Federal Income Tax</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(federal)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>CPP Contributions</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(cpp)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(cpp)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>EI Premiums</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(ei)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(ei)}</Text>
                </View>
                <View style={styles.gustoTableRow}>
                  <Text style={[styles.gustoTableCell, { flex: 3 }]}>Provincial Tax ({data.province || 'ON'})</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(provincial)}</Text>
                  <Text style={[styles.gustoTableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(provincial)}</Text>
                </View>
              </>
            )}

            <View style={styles.gustoTableRowTotal}>
              <Text style={[styles.gustoTableCellBold, { flex: 3 }]}>Total Deductions</Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(totalDeductions)}</Text>
              <Text style={[styles.gustoTableCellBold, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(totalDeductions)}</Text>
            </View>
          </View>

          {/* Net Pay */}
          <View style={styles.gustoNetPaySection}>
            <View style={styles.gustoNetPayBox}>
              <Text style={styles.gustoNetPayLabel}>NET PAY</Text>
              <Text style={styles.gustoNetPayAmount}>{formatCurrency(netPay)}</Text>
            </View>
            {data.bankName && (
              <View style={styles.gustoDepositInfo}>
                <Text style={styles.gustoDepositLabel}>Direct Deposit to {data.bankName}</Text>
                <Text style={styles.gustoDepositAccount}>Account ending in {data.bank || '****'}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Template C: Workday Style - Corporate blue design
function WorkdayTemplate({ data, type, calculations, formatCurrency, formatDate }) {
  const { grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate } = calculations;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={[styles.paper, styles.workdayPaper]}>
          {/* Workday Header */}
          <View style={styles.workdayHeader}>
            <View style={styles.workdayLogoSection}>
              <View style={styles.workdayLogo}>
                <Text style={styles.workdayLogoText}>workday</Text>
              </View>
            </View>
            <Text style={styles.workdayTitle}>Payslip</Text>
          </View>

          {/* Blue accent bar */}
          <View style={styles.workdayAccent} />

          {/* Two column layout */}
          <View style={styles.workdayColumns}>
            <View style={styles.workdayColLeft}>
              <Text style={styles.workdayLabel}>Employee</Text>
              <Text style={styles.workdayValue}>{data.name || 'Employee Name'}</Text>
              <Text style={styles.workdaySmall}>{type === 'us' ? `SSN: ***-**-${data.ssn || '0000'}` : `SIN: ***-***-${data.sin || '000'}`}</Text>
              
              <Text style={[styles.workdayLabel, { marginTop: 8 }]}>Company</Text>
              <Text style={styles.workdayValue}>{data.company || 'Company Name'}</Text>
            </View>
            <View style={styles.workdayColRight}>
              <Text style={styles.workdayLabel}>Pay Period</Text>
              <Text style={styles.workdayValue}>{formatDate(data.startDate)} - {formatDate(data.endDate)}</Text>
              
              <Text style={[styles.workdayLabel, { marginTop: 8 }]}>Pay Date</Text>
              <Text style={styles.workdayValue}>{formatDate(data.payDate)}</Text>
            </View>
          </View>

          {/* Summary boxes */}
          <View style={styles.workdaySummaryRow}>
            <View style={styles.workdaySummaryBox}>
              <Text style={styles.workdaySummaryLabel}>Gross Earnings</Text>
              <Text style={styles.workdaySummaryValue}>{formatCurrency(grossPay)}</Text>
            </View>
            <View style={styles.workdaySummaryBox}>
              <Text style={styles.workdaySummaryLabel}>Deductions</Text>
              <Text style={[styles.workdaySummaryValue, { color: '#dc2626' }]}>-{formatCurrency(totalDeductions)}</Text>
            </View>
            <View style={[styles.workdaySummaryBox, styles.workdayNetBox]}>
              <Text style={styles.workdaySummaryLabel}>Net Pay</Text>
              <Text style={[styles.workdaySummaryValue, { color: '#fff' }]}>{formatCurrency(netPay)}</Text>
            </View>
          </View>

          {/* Earnings Details */}
          <View style={styles.workdaySection}>
            <Text style={styles.workdaySectionTitle}>Earnings</Text>
            <View style={styles.workdayDetailRow}>
              <Text style={styles.workdayDetailLabel}>Regular Pay</Text>
              <Text style={styles.workdayDetailValue}>{formatCurrency(regularPay)}</Text>
            </View>
            {overtime > 0 && (
              <View style={styles.workdayDetailRow}>
                <Text style={styles.workdayDetailLabel}>Overtime Pay</Text>
                <Text style={styles.workdayDetailValue}>{formatCurrency(overtimePay)}</Text>
              </View>
            )}
          </View>

          {/* Deductions Details */}
          <View style={styles.workdaySection}>
            <Text style={styles.workdaySectionTitle}>Deductions</Text>
            {type === 'us' ? (
              <>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>Federal Tax</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>Social Security</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(socialSecurity)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>Medicare</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(medicare)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>State Tax</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(stateTax)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>Federal Tax</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>CPP</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(cpp)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>EI</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(ei)}</Text>
                </View>
                <View style={styles.workdayDetailRow}>
                  <Text style={styles.workdayDetailLabel}>Provincial Tax</Text>
                  <Text style={styles.workdayDetailValue}>{formatCurrency(provincial)}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Template H: OnPay Style - Modern minimal design
function OnPayTemplate({ data, type, calculations, formatCurrency, formatDate }) {
  const { grossPay, regularPay, overtimePay, socialSecurity, medicare, federal, stateTax, cpp, ei, provincial, totalDeductions, netPay, hours, overtime, rate } = calculations;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={[styles.paper, styles.onpayPaper]}>
          {/* OnPay Header */}
          <View style={styles.onpayHeader}>
            <View>
              <Text style={styles.onpayCompany}>{data.company || 'COMPANY NAME'}</Text>
              <Text style={styles.onpayCompanyDetail}>{data.companyAddress || '123 Business Ave'}</Text>
              <Text style={styles.onpayCompanyDetail}>{data.companyCity || 'City'}, {type === 'us' ? data.companyState : data.companyProvince || 'ST'}</Text>
            </View>
            <View style={styles.onpayBadge}>
              <Text style={styles.onpayBadgeText}>OnPay</Text>
            </View>
          </View>

          <View style={styles.onpayTitleSection}>
            <Text style={styles.onpayTitle}>Pay Stub</Text>
            <Text style={styles.onpayPeriod}>{formatDate(data.startDate)} through {formatDate(data.endDate)}</Text>
          </View>

          {/* Employee Card */}
          <View style={styles.onpayCard}>
            <Text style={styles.onpayCardTitle}>Employee Information</Text>
            <View style={styles.onpayCardRow}>
              <Text style={styles.onpayCardLabel}>Name:</Text>
              <Text style={styles.onpayCardValue}>{data.name || 'Employee Name'}</Text>
            </View>
            <View style={styles.onpayCardRow}>
              <Text style={styles.onpayCardLabel}>{type === 'us' ? 'SSN:' : 'SIN:'}</Text>
              <Text style={styles.onpayCardValue}>***-**-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
            </View>
            <View style={styles.onpayCardRow}>
              <Text style={styles.onpayCardLabel}>Pay Date:</Text>
              <Text style={styles.onpayCardValue}>{formatDate(data.payDate)}</Text>
            </View>
          </View>

          {/* Earnings Card */}
          <View style={styles.onpayCard}>
            <Text style={styles.onpayCardTitle}>Earnings</Text>
            <View style={styles.onpayCardRow}>
              <Text style={styles.onpayCardLabel}>Regular Pay</Text>
              <Text style={styles.onpayCardValue}>{formatCurrency(regularPay)}</Text>
            </View>
            {overtime > 0 && (
              <View style={styles.onpayCardRow}>
                <Text style={styles.onpayCardLabel}>Overtime Pay</Text>
                <Text style={styles.onpayCardValue}>{formatCurrency(overtimePay)}</Text>
              </View>
            )}
            <View style={[styles.onpayCardRow, styles.onpayCardTotal]}>
              <Text style={styles.onpayCardTotalLabel}>Gross Pay</Text>
              <Text style={styles.onpayCardTotalValue}>{formatCurrency(grossPay)}</Text>
            </View>
          </View>

          {/* Deductions Card */}
          <View style={styles.onpayCard}>
            <Text style={styles.onpayCardTitle}>Deductions</Text>
            {type === 'us' ? (
              <>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>Federal Tax</Text><Text style={styles.onpayCardValue}>{formatCurrency(federal)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>Social Security</Text><Text style={styles.onpayCardValue}>{formatCurrency(socialSecurity)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>Medicare</Text><Text style={styles.onpayCardValue}>{formatCurrency(medicare)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>State Tax</Text><Text style={styles.onpayCardValue}>{formatCurrency(stateTax)}</Text></View>
              </>
            ) : (
              <>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>Federal Tax</Text><Text style={styles.onpayCardValue}>{formatCurrency(federal)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>CPP</Text><Text style={styles.onpayCardValue}>{formatCurrency(cpp)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>EI</Text><Text style={styles.onpayCardValue}>{formatCurrency(ei)}</Text></View>
                <View style={styles.onpayCardRow}><Text style={styles.onpayCardLabel}>Provincial Tax</Text><Text style={styles.onpayCardValue}>{formatCurrency(provincial)}</Text></View>
              </>
            )}
            <View style={[styles.onpayCardRow, styles.onpayCardTotal]}>
              <Text style={styles.onpayCardTotalLabel}>Total Deductions</Text>
              <Text style={[styles.onpayCardTotalValue, { color: '#dc2626' }]}>-{formatCurrency(totalDeductions)}</Text>
            </View>
          </View>

          {/* Net Pay Banner */}
          <View style={styles.onpayNetBanner}>
            <Text style={styles.onpayNetLabel}>NET PAY</Text>
            <Text style={styles.onpayNetAmount}>{formatCurrency(netPay)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.slate[200],
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    marginBottom: spacing.base,
    height: 420,
  },
  previewScroll: { flex: 1 },
  previewContent: { paddingBottom: spacing.sm },
  paper: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.base,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ========== GUSTO TEMPLATE STYLES ==========
  gustoPaper: { borderTopWidth: 3, borderTopColor: '#10b981' },
  gustoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  gustoLogoSection: { flexDirection: 'row', alignItems: 'flex-start' },
  gustoLogo: { backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginRight: 8 },
  gustoLogoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  gustoCompanyName: { fontSize: 10, fontWeight: '700', color: colors.slate[800] },
  gustoCompanyDetail: { fontSize: 6, color: colors.slate[600] },
  gustoPayStubLabel: { alignItems: 'flex-end' },
  gustoTitle: { fontSize: 11, fontWeight: '700', color: colors.slate[800] },
  gustoPayPeriod: { fontSize: 6, color: colors.slate[600] },
  gustoDivider: { height: 1, backgroundColor: '#10b981', marginVertical: spacing.sm },
  gustoEmployeeSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate[200] },
  gustoEmployeeLeft: { flex: 1 },
  gustoEmployeeRight: { alignItems: 'flex-end' },
  gustoLabel: { fontSize: 5, fontWeight: '600', color: '#10b981', marginBottom: 2, letterSpacing: 0.5 },
  gustoEmployeeName: { fontSize: 9, fontWeight: '600', color: colors.slate[800] },
  gustoEmployeeDetail: { fontSize: 6, color: colors.slate[600] },
  gustoInfoRow: { flexDirection: 'row', marginBottom: 2 },
  gustoInfoLabel: { fontSize: 6, color: colors.slate[500], marginRight: 4 },
  gustoInfoValue: { fontSize: 6, fontWeight: '600', color: colors.slate[800] },
  gustoTableSection: { marginBottom: spacing.sm },
  gustoTableHeader: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 4, paddingHorizontal: 4, borderRadius: 2 },
  gustoTableHeaderText: { fontSize: 5, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' },
  gustoTableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  gustoTableRowTotal: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, backgroundColor: colors.slate[50], borderRadius: 2 },
  gustoTableCell: { fontSize: 6, color: colors.slate[700] },
  gustoTableCellBold: { fontSize: 6, fontWeight: '700', color: colors.slate[800] },
  gustoNetPaySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 2, borderTopColor: '#10b981' },
  gustoNetPayBox: { backgroundColor: '#10b981', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.base },
  gustoNetPayLabel: { fontSize: 6, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  gustoNetPayAmount: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  gustoDepositInfo: { alignItems: 'flex-end' },
  gustoDepositLabel: { fontSize: 6, color: colors.slate[500] },
  gustoDepositAccount: { fontSize: 6, color: colors.slate[600] },

  // ========== WORKDAY TEMPLATE STYLES ==========
  workdayPaper: {},
  workdayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  workdayLogoSection: {},
  workdayLogo: { backgroundColor: '#0066cc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  workdayLogoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  workdayTitle: { fontSize: 14, fontWeight: '700', color: '#0066cc' },
  workdayAccent: { height: 3, backgroundColor: '#0066cc', marginBottom: spacing.sm },
  workdayColumns: { flexDirection: 'row', marginBottom: spacing.sm },
  workdayColLeft: { flex: 1 },
  workdayColRight: { flex: 1, alignItems: 'flex-end' },
  workdayLabel: { fontSize: 5, fontWeight: '600', color: '#0066cc', textTransform: 'uppercase' },
  workdayValue: { fontSize: 8, fontWeight: '600', color: colors.slate[800] },
  workdaySmall: { fontSize: 6, color: colors.slate[500] },
  workdaySummaryRow: { flexDirection: 'row', marginBottom: spacing.sm },
  workdaySummaryBox: { flex: 1, backgroundColor: colors.slate[50], padding: spacing.xs, marginRight: 4, borderRadius: 4, alignItems: 'center' },
  workdayNetBox: { backgroundColor: '#0066cc', marginRight: 0 },
  workdaySummaryLabel: { fontSize: 5, color: colors.slate[500], textTransform: 'uppercase' },
  workdaySummaryValue: { fontSize: 10, fontWeight: '700', color: colors.slate[800] },
  workdaySection: { marginBottom: spacing.sm },
  workdaySectionTitle: { fontSize: 7, fontWeight: '700', color: '#0066cc', marginBottom: 4, textTransform: 'uppercase' },
  workdayDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  workdayDetailLabel: { fontSize: 6, color: colors.slate[600] },
  workdayDetailValue: { fontSize: 6, fontWeight: '600', color: colors.slate[800] },

  // ========== ONPAY TEMPLATE STYLES ==========
  onpayPaper: { backgroundColor: '#fafafa' },
  onpayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  onpayCompany: { fontSize: 11, fontWeight: '700', color: colors.slate[800] },
  onpayCompanyDetail: { fontSize: 6, color: colors.slate[500] },
  onpayBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  onpayBadgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  onpayTitleSection: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  onpayTitle: { fontSize: 14, fontWeight: '800', color: '#7c3aed' },
  onpayPeriod: { fontSize: 7, color: colors.slate[500] },
  onpayCard: { backgroundColor: '#fff', borderRadius: 6, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.slate[200] },
  onpayCardTitle: { fontSize: 7, fontWeight: '700', color: '#7c3aed', marginBottom: 6, textTransform: 'uppercase' },
  onpayCardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  onpayCardLabel: { fontSize: 6, color: colors.slate[600] },
  onpayCardValue: { fontSize: 6, fontWeight: '600', color: colors.slate[800] },
  onpayCardTotal: { borderTopWidth: 1, borderTopColor: colors.slate[200], marginTop: 4, paddingTop: 4 },
  onpayCardTotalLabel: { fontSize: 7, fontWeight: '700', color: colors.slate[800] },
  onpayCardTotalValue: { fontSize: 8, fontWeight: '700', color: colors.slate[800] },
  onpayNetBanner: { backgroundColor: '#7c3aed', borderRadius: 8, padding: spacing.md, alignItems: 'center' },
  onpayNetLabel: { fontSize: 7, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  onpayNetAmount: { fontSize: 18, fontWeight: '800', color: '#fff' },
});

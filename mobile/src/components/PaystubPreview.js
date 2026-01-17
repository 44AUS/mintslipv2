import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export default function PaystubPreview({ data, type = 'us' }) {
  const formatCurrency = (num) => {
    const value = parseFloat(num) || 0;
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
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

  // YTD calculations (simplified - assume this is the first pay period)
  const ytdGross = grossPay;
  const ytdNet = netPay;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.previewScroll}
        contentContainerStyle={styles.previewContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Document Paper */}
        <View style={styles.paper}>
          {/* Header with Company Info */}
          <View style={styles.header}>
            <View style={styles.companySection}>
              <Text style={styles.companyName}>{data.company || 'COMPANY NAME'}</Text>
              <Text style={styles.companyAddress}>{data.companyAddress || '123 Business Ave'}</Text>
              <Text style={styles.companyAddress}>
                {data.companyCity || 'City'}, {type === 'us' ? data.companyState : data.companyProvince || 'ST'} {type === 'us' ? data.companyZip : data.companyPostalCode || '00000'}
              </Text>
              {data.companyPhone && <Text style={styles.companyAddress}>{data.companyPhone}</Text>}
            </View>
            <View style={styles.paystubLabel}>
              <Text style={styles.paystubTitle}>PAY STUB</Text>
              <Text style={styles.payPeriod}>Pay Period: {formatDate(data.startDate)} - {formatDate(data.endDate)}</Text>
              <Text style={styles.payDate}>Pay Date: {formatDate(data.payDate)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Employee Info */}
          <View style={styles.employeeSection}>
            <View style={styles.employeeLeft}>
              <Text style={styles.sectionLabel}>EMPLOYEE</Text>
              <Text style={styles.employeeName}>{data.name || 'Employee Name'}</Text>
              <Text style={styles.employeeDetail}>{data.address || '456 Home Street'}</Text>
              <Text style={styles.employeeDetail}>
                {data.city || 'City'}, {type === 'us' ? data.state : data.province || 'ST'} {type === 'us' ? data.zip : data.postalCode || '00000'}
              </Text>
            </View>
            <View style={styles.employeeRight}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{type === 'us' ? 'SSN:' : 'SIN:'}</Text>
                <Text style={styles.infoValue}>***-**-{type === 'us' ? (data.ssn || '0000') : (data.sin || '000')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pay Rate:</Text>
                <Text style={styles.infoValue}>
                  {data.payType === 'hourly' ? `${formatCurrency(rate)}/hr` : `${formatCurrency(annualSalary)}/yr`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pay Freq:</Text>
                <Text style={styles.infoValue}>{(data.payFrequency || 'biweekly').charAt(0).toUpperCase() + (data.payFrequency || 'biweekly').slice(1)}</Text>
              </View>
            </View>
          </View>

          {/* Earnings Table */}
          <View style={styles.tableSection}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>EARNINGS</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>HOURS</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>RATE</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>CURRENT</Text>
              <Text style={[styles.tableHeaderText, styles.col5]}>YTD</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>Regular</Text>
              <Text style={[styles.tableCell, styles.col2]}>{data.payType === 'hourly' ? hours.toFixed(2) : '-'}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{data.payType === 'hourly' ? formatCurrency(rate) : '-'}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(regularPay)}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(regularPay)}</Text>
            </View>

            {overtime > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>Overtime</Text>
                <Text style={[styles.tableCell, styles.col2]}>{overtime.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{formatCurrency(rate * 1.5)}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(overtimePay)}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(overtimePay)}</Text>
              </View>
            )}

            <View style={styles.tableRowTotal}>
              <Text style={[styles.tableCellBold, styles.col1]}>Gross Pay</Text>
              <Text style={[styles.tableCellBold, styles.col2]}></Text>
              <Text style={[styles.tableCellBold, styles.col3]}></Text>
              <Text style={[styles.tableCellBold, styles.col4]}>{formatCurrency(grossPay)}</Text>
              <Text style={[styles.tableCellBold, styles.col5]}>{formatCurrency(ytdGross)}</Text>
            </View>
          </View>

          {/* Deductions Table */}
          <View style={styles.tableSection}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDeduction]}>DEDUCTIONS</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>CURRENT</Text>
              <Text style={[styles.tableHeaderText, styles.colYtd]}>YTD</Text>
            </View>

            {type === 'us' ? (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>Federal Income Tax</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(federal)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>Social Security</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(socialSecurity)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(socialSecurity)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>Medicare</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(medicare)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(medicare)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>State Income Tax</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(stateTax)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(stateTax)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>Federal Income Tax</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(federal)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(federal)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>CPP Contributions</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(cpp)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(cpp)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>EI Premiums</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(ei)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(ei)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDeduction]}>Provincial Tax ({data.province || 'ON'})</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(provincial)}</Text>
                  <Text style={[styles.tableCell, styles.colYtd]}>{formatCurrency(provincial)}</Text>
                </View>
              </>
            )}

            <View style={styles.tableRowTotal}>
              <Text style={[styles.tableCellBold, styles.colDeduction]}>Total Deductions</Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>{formatCurrency(totalDeductions)}</Text>
              <Text style={[styles.tableCellBold, styles.colYtd]}>{formatCurrency(totalDeductions)}</Text>
            </View>
          </View>

          {/* Net Pay Section */}
          <View style={styles.netPaySection}>
            <View style={styles.netPayBox}>
              <Text style={styles.netPayLabel}>NET PAY</Text>
              <Text style={styles.netPayAmount}>{formatCurrency(netPay)}</Text>
            </View>
            {data.bankName && (
              <View style={styles.depositInfo}>
                <Text style={styles.depositLabel}>Direct Deposit</Text>
                <Text style={styles.depositBank}>{data.bankName}</Text>
                <Text style={styles.depositAccount}>Account: ****{data.bank || '0000'}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>This is a preview of your pay stub. Actual document may vary slightly.</Text>
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
    height: 400,
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    paddingBottom: spacing.sm,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.default,
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 7,
    color: colors.slate[600],
    lineHeight: 10,
  },
  paystubLabel: {
    alignItems: 'flex-end',
  },
  paystubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary.default,
    letterSpacing: 1,
  },
  payPeriod: {
    fontSize: 6,
    color: colors.slate[600],
    marginTop: 2,
  },
  payDate: {
    fontSize: 6,
    color: colors.slate[600],
  },
  divider: {
    height: 2,
    backgroundColor: colors.primary.default,
    marginVertical: spacing.sm,
  },
  employeeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  employeeLeft: {
    flex: 1,
  },
  employeeRight: {
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 6,
    fontWeight: '600',
    color: colors.slate[500],
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  employeeName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.foreground,
  },
  employeeDetail: {
    fontSize: 7,
    color: colors.slate[600],
    lineHeight: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 6,
    color: colors.slate[500],
    marginRight: 4,
  },
  infoValue: {
    fontSize: 6,
    fontWeight: '600',
    color: colors.foreground,
  },
  tableSection: {
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary.default,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  tableHeaderText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  tableRowTotal: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: colors.slate[50],
    borderRadius: 2,
  },
  tableCell: {
    fontSize: 6,
    color: colors.slate[700],
  },
  tableCellBold: {
    fontSize: 6,
    fontWeight: '700',
    color: colors.foreground,
  },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1.2, textAlign: 'right' },
  col5: { flex: 1.2, textAlign: 'right' },
  colDeduction: { flex: 3 },
  colAmount: { flex: 1.5, textAlign: 'right' },
  colYtd: { flex: 1.5, textAlign: 'right' },
  netPaySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary.default,
  },
  netPayBox: {
    backgroundColor: colors.primary.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.base,
  },
  netPayLabel: {
    fontSize: 7,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  netPayAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  depositInfo: {
    alignItems: 'flex-end',
  },
  depositLabel: {
    fontSize: 6,
    color: colors.slate[500],
    marginBottom: 1,
  },
  depositBank: {
    fontSize: 7,
    fontWeight: '600',
    color: colors.foreground,
  },
  depositAccount: {
    fontSize: 6,
    color: colors.slate[600],
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
  },
  footerText: {
    fontSize: 5,
    color: colors.slate[400],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

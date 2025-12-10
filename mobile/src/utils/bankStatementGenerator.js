import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateBankStatementHTML } from './bankStatementTemplates';

export const generateAndDownloadBankStatement = async (formData, template = 'template-a') => {
  try {
    console.log('Starting bank statement generation...', { formData, template });
    
    // Generate HTML
    const html = generateBankStatementHTML(formData, template);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html });
    
    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
    
    console.log('Bank statement downloaded successfully');
    return { success: true };
  } catch (error) {
    console.error('Error generating bank statement:', error);
    throw error;
  }
};

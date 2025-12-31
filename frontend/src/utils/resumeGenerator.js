import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

// Map font names to jsPDF built-in font families
// jsPDF supports: helvetica, times, courier
const getFontFamily = (fontName) => {
  const fontMap = {
    'Montserrat': 'helvetica',
    'Times New Roman': 'times',
    'Calibri': 'helvetica',
    'Arial': 'helvetica',
    'Helvetica': 'helvetica'
  };
  return fontMap[fontName] || 'helvetica';
};

// Format date - handle timezone issues
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr === "Present") return "Present";
  
  try {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const date = new Date(year, month, 15);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Template color schemes
const TEMPLATE_COLORS = {
  ats: {
    primary: [0, 0, 0],
    secondary: [51, 51, 51],
    text: [68, 68, 68],
    light: [128, 128, 128]
  },
  modern: {
    primary: [5, 150, 105],
    secondary: [4, 120, 87],
    text: [51, 65, 85],
    light: [100, 116, 139]
  },
  classic: {
    primary: [30, 41, 59],
    secondary: [51, 65, 85],
    text: [71, 85, 105],
    light: [100, 116, 139]
  }
};

// Format date - handle timezone issues
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr === "Present") return "Present";
  
  try {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const date = new Date(year, month, 15);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Generate PDF Resume
export const generateResumePDF = async (data, addWatermark = false) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 50;
  const template = data.template || 'ats';
  const colors = TEMPLATE_COLORS[template] || TEMPLATE_COLORS.ats;
  const fontFamily = getFontFamily(data.font || 'Calibri');
  const onePage = data.onePage || false;
  const sectionLayout = data.sectionLayout || 'standard';
  
  console.log("Resume Generator - Font:", data.font, "-> Custom font:", fontFamily);
  console.log("Resume Generator - Layout:", sectionLayout, "OnePage:", onePage, "Template:", template);
  
  // Adjust font sizes based on one-page mode
  const fontSizes = onePage ? {
    name: 16,
    section: 10,
    subheading: 9,
    body: 8,
    contact: 8
  } : {
    name: 20,
    section: 12,
    subheading: 11,
    body: 10,
    contact: 10
  };

  // Line heights
  const lineHeights = onePage ? {
    section: 12,
    body: 11,
    spacing: 6
  } : {
    section: 15,
    body: 14,
    spacing: 10
  };
  
  let y = margin;
  const leftMargin = template === "modern" ? margin + 10 : margin;

  // Helper functions
  const setColor = (colorArray) => {
    doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
  };

  // Only draw lines for non-ATS templates
  const drawLine = (yPos, color = colors.light) => {
    if (template !== "ats") {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, width - margin, yPos);
    }
  };
  
  const checkNewPage = (neededSpace) => {
    if (!onePage && y + neededSpace > height - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER SECTION =====
  const personalInfo = data.personalInfo || {};
  
  if (template === "modern") {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, 8, height, "F");
  } else if (template === "classic") {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, margin - 10, width - margin * 2, 3, "F");
    y += 5;
  }

  // Name
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(fontSizes.name);
  setColor(colors.primary);
  doc.text(personalInfo.fullName || "Your Name", leftMargin, y + 20);
  y += onePage ? 25 : 30;

  // Contact info
  doc.setFont(fontFamily, "normal");
  doc.setFontSize(fontSizes.contact);
  setColor(colors.light);
  
  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.website
  ].filter(Boolean);
  
  const separator = template === "ats" ? "  |  " : "  •  ";
  doc.text(contactItems.join(separator), leftMargin, y + 5);
  y += onePage ? 18 : 25;

  // ===== HELPER: Render Summary =====
  const renderSummary = () => {
    if (!data.professionalSummary) return;
    
    drawLine(y, colors.light);
    y += lineHeights.section;
    
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSizes.section);
    setColor(colors.primary);
    doc.text(template === "ats" ? "PROFESSIONAL SUMMARY" : "Professional Summary", leftMargin, y);
    y += lineHeights.section;
    
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(fontSizes.body);
    setColor(colors.text);
    
    const summaryLines = doc.splitTextToSize(data.professionalSummary, width - margin * 2 - (template === "modern" ? 10 : 0));
    summaryLines.forEach(line => {
      doc.text(line, leftMargin, y);
      y += lineHeights.body;
    });
    y += lineHeights.spacing;
  };

  // ===== HELPER: Render Skills =====
  const renderSkills = () => {
    if (!data.optimizedSkills) return;
    
    checkNewPage(80);
    
    drawLine(y, colors.light);
    y += lineHeights.section;
    
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSizes.section);
    setColor(colors.primary);
    doc.text(template === "ats" ? "SKILLS" : "Skills", leftMargin, y);
    y += lineHeights.section + 3;

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(fontSizes.body);
    setColor(colors.text);

    const allSkills = [
      ...(data.optimizedSkills.technical || []),
      ...(data.optimizedSkills.soft || []),
      ...(data.optimizedSkills.other || [])
    ].filter(Boolean);

    if (allSkills.length > 0) {
      const skillsText = allSkills.join("  •  ");
      const skillLines = doc.splitTextToSize(skillsText, width - margin * 2 - (template === "modern" ? 10 : 0));
      skillLines.forEach(line => {
        doc.text(line, leftMargin, y);
        y += lineHeights.body;
      });
    }
    y += lineHeights.spacing;
  };

  // ===== HELPER: Render Education =====
  const renderEducation = () => {
    if (!data.education || data.education.length === 0) return;
    
    checkNewPage(100);
    
    drawLine(y, colors.light);
    y += lineHeights.section;
    
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSizes.section);
    setColor(colors.primary);
    doc.text(template === "ats" ? "EDUCATION" : "Education", leftMargin, y);
    y += lineHeights.section + 5;

    data.education.forEach(edu => {
      doc.setFont(fontFamily, "bold");
      doc.setFontSize(fontSizes.subheading);
      setColor(colors.secondary);
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(" in ");
      doc.text(degreeText || "Degree", leftMargin, y);
      
      // Date on right
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(fontSizes.body);
      setColor(colors.light);
      doc.text(formatDate(edu.graduationDate), width - margin, y, { align: "right" });
      y += lineHeights.body;

      doc.setFont(fontFamily, "normal");
      setColor(colors.text);
      const institutionText = edu.gpa ? `${edu.institution} | GPA: ${edu.gpa}` : edu.institution;
      doc.text(institutionText || "", leftMargin, y);
      y += lineHeights.body + lineHeights.spacing;
    });
  };

  // ===== HELPER: Render Work Experience =====
  const renderExperience = () => {
    if (!data.optimizedExperience || data.optimizedExperience.length === 0) return;
    
    drawLine(y, colors.light);
    y += lineHeights.section;
    
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSizes.section);
    setColor(colors.primary);
    doc.text(template === "ats" ? "PROFESSIONAL EXPERIENCE" : "Professional Experience", leftMargin, y);
    y += lineHeights.section + 5;

    data.optimizedExperience.forEach((exp, index) => {
      checkNewPage(100);

      // Position & Company
      doc.setFont(fontFamily, "bold");
      doc.setFontSize(fontSizes.subheading);
      setColor(colors.secondary);
      doc.text(exp.position || "Position", leftMargin, y);
      
      // Dates on right
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(fontSizes.body);
      setColor(colors.light);
      const dateRange = `${formatDate(exp.startDate)} - ${exp.current ? "Present" : formatDate(exp.endDate)}`;
      doc.text(dateRange, width - margin, y, { align: "right" });
      y += lineHeights.body;

      // Company & Location
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(fontSizes.body);
      setColor(colors.text);
      const companyLine = [exp.company, exp.location].filter(Boolean).join(" | ");
      doc.text(companyLine, leftMargin, y);
      y += lineHeights.body + 3;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFont(fontFamily, "normal");
        doc.setFontSize(fontSizes.body);
        setColor(colors.text);
        
        exp.bullets.forEach(bullet => {
          if (!bullet) return;
          
          checkNewPage(50);

          const bulletText = `• ${bullet}`;
          const lines = doc.splitTextToSize(bulletText, width - margin * 2 - 20);
          
          lines.forEach((line, lineIndex) => {
            doc.text(lineIndex === 0 ? line : `  ${line}`, leftMargin + 5, y);
            y += lineHeights.body;
          });
        });
      }
      y += lineHeights.spacing;
    });
  };

  // ===== RENDER SECTIONS BASED ON LAYOUT =====
  
  // Always render summary first
  renderSummary();

  if (sectionLayout === "compact") {
    // Compact/Highlighted layout: Skills & Education after Summary, then Experience
    renderSkills();
    renderEducation();
    renderExperience();
  } else {
    // Standard layout: Experience, then Education, then Skills
    renderExperience();
    renderEducation();
    renderSkills();
  }

  // Add watermark if preview
  if (addWatermark) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont(fontFamily, "bold");
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200);
      doc.text("PREVIEW", width / 2, height / 2, {
        align: "center",
        angle: 45
      });
    }
  }

  return doc;
};

// Generate DOCX Resume
export const generateResumeDOCX = async (data) => {
  const fontName = data.font || 'Calibri';
  const sectionLayout = data.sectionLayout || 'standard';
  
  // Map font names for DOCX
  const docxFont = {
    'Montserrat': 'Calibri',
    'Times New Roman': 'Times New Roman',
    'Calibri': 'Calibri',
    'Arial': 'Arial',
    'Helvetica': 'Helvetica'
  }[fontName] || 'Calibri';

  const personalInfo = data.personalInfo || {};
  
  // Header
  const headerParagraphs = [
    new Paragraph({
      children: [
        new TextRun({
          text: personalInfo.fullName || "Your Name",
          bold: true,
          size: 32,
          font: docxFont
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin,
            personalInfo.website
          ].filter(Boolean).join("  |  "),
          size: 20,
          font: docxFont
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  ];

  // Summary Section
  const summarySection = data.professionalSummary ? [
    new Paragraph({
      text: "PROFESSIONAL SUMMARY",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.professionalSummary,
          size: 22,
          font: docxFont
        })
      ],
      spacing: { after: 200 }
    })
  ] : [];

  // Skills Section
  const allSkills = data.optimizedSkills ? [
    ...(data.optimizedSkills.technical || []),
    ...(data.optimizedSkills.soft || []),
    ...(data.optimizedSkills.other || [])
  ].filter(Boolean) : [];

  const skillsSection = allSkills.length > 0 ? [
    new Paragraph({
      text: "SKILLS",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: allSkills.join("  •  "),
          size: 22,
          font: docxFont
        })
      ],
      spacing: { after: 200 }
    })
  ] : [];

  // Education Section
  const educationSection = data.education && data.education.length > 0 ? [
    new Paragraph({
      text: "EDUCATION",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
    }),
    ...data.education.flatMap(edu => [
      new Paragraph({
        children: [
          new TextRun({
            text: [edu.degree, edu.field].filter(Boolean).join(" in "),
            bold: true,
            size: 24,
            font: docxFont
          }),
          new TextRun({
            text: `    ${formatDate(edu.graduationDate)}`,
            size: 20,
            font: docxFont
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: edu.gpa ? `${edu.institution} | GPA: ${edu.gpa}` : edu.institution,
            size: 22,
            font: docxFont
          })
        ],
        spacing: { after: 150 }
      })
    ])
  ] : [];

  // Experience Section
  const experienceSection = data.optimizedExperience && data.optimizedExperience.length > 0 ? [
    new Paragraph({
      text: "PROFESSIONAL EXPERIENCE",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
    }),
    ...data.optimizedExperience.flatMap(exp => [
      new Paragraph({
        children: [
          new TextRun({
            text: exp.position || "Position",
            bold: true,
            size: 24,
            font: docxFont
          }),
          new TextRun({
            text: `    ${formatDate(exp.startDate)} - ${exp.current ? "Present" : formatDate(exp.endDate)}`,
            size: 20,
            font: docxFont
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: [exp.company, exp.location].filter(Boolean).join(" | "),
            size: 22,
            font: docxFont
          })
        ],
        spacing: { after: 100 }
      }),
      ...(exp.bullets || []).filter(Boolean).map(bullet =>
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${bullet}`,
              size: 22,
              font: docxFont
            })
          ],
          spacing: { after: 50 }
        })
      ),
      new Paragraph({ spacing: { after: 150 } })
    ])
  ] : [];

  // Combine sections based on layout
  let bodySections;
  if (sectionLayout === "compact") {
    bodySections = [
      ...summarySection,
      ...skillsSection,
      ...educationSection,
      ...experienceSection
    ];
  } else {
    bodySections = [
      ...summarySection,
      ...experienceSection,
      ...educationSection,
      ...skillsSection
    ];
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        ...headerParagraphs,
        ...bodySections
      ]
    }]
  });

  return Packer.toBlob(doc);
};

// Generate and download both formats
export const generateAndDownloadResume = async (data) => {
  const zip = new JSZip();
  
  // Generate PDF
  const pdfDoc = await generateResumePDF(data, false);
  const pdfBlob = pdfDoc.output("blob");
  zip.file("resume.pdf", pdfBlob);
  
  // Generate DOCX
  const docxBlob = await generateResumeDOCX(data);
  zip.file("resume.docx", docxBlob);
  
  // Download zip
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const fileName = `${(data.personalInfo?.fullName || "resume").replace(/\s+/g, "_")}_Resume.zip`;
  saveAs(zipBlob, fileName);
};

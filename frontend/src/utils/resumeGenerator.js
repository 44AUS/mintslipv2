import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";

// Template color schemes
const TEMPLATE_COLORS = {
  ats: {
    primary: [0, 0, 0],
    secondary: [60, 60, 60],
    accent: [40, 40, 40],
    text: [30, 30, 30],
    light: [100, 100, 100]
  },
  modern: {
    primary: [5, 150, 105], // Green
    secondary: [30, 41, 59],
    accent: [16, 185, 129],
    text: [30, 41, 59],
    light: [100, 116, 139]
  },
  classic: {
    primary: [30, 41, 59], // Dark slate
    secondary: [51, 65, 85],
    accent: [71, 85, 105],
    text: [30, 41, 59],
    light: [100, 116, 139]
  }
};

// Format date - handle timezone issues
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr === "Present") return "Present";
  
  try {
    // Parse the date parts directly to avoid timezone issues
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
      const date = new Date(year, month, 15); // Use 15th to avoid any timezone edge cases
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Map font names to jsPDF font families
const getFontFamily = (fontName) => {
  const fontMap = {
    'Montserrat': 'helvetica', // jsPDF doesn't have Montserrat, use helvetica
    'Times New Roman': 'times',
    'Calibri': 'helvetica', // jsPDF doesn't have Calibri, use helvetica
    'Arial': 'helvetica',
    'Helvetica': 'helvetica'
  };
  return fontMap[fontName] || 'helvetica';
};

// Generate PDF Resume
export const generateResumePDF = async (data, addWatermark = false) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 50;
  const colors = TEMPLATE_COLORS[data.template] || TEMPLATE_COLORS.ats;
  
  let y = margin;

  // Helper functions
  const setColor = (colorArray) => {
    doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
  };

  const drawLine = (y, color = colors.light) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, width - margin, y);
  };

  // Header Section
  const personalInfo = data.personalInfo || {};
  
  if (data.template === "modern") {
    // Modern template - colored left bar
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, 8, height, "F");
  } else if (data.template === "classic") {
    // Classic template - top border
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, margin - 10, width - margin * 2, 3, "F");
    y += 5;
  }

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.template === "ats" ? 20 : 24);
  setColor(colors.primary);
  doc.text(personalInfo.fullName || "Your Name", data.template === "modern" ? margin + 10 : margin, y + 20);
  y += 30;

  // Contact info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(colors.light);
  
  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.website
  ].filter(Boolean);
  
  if (data.template === "ats") {
    doc.text(contactItems.join("  |  "), margin, y + 5);
  } else {
    doc.text(contactItems.join("  •  "), data.template === "modern" ? margin + 10 : margin, y + 5);
  }
  y += 25;

  // Professional Summary
  if (data.professionalSummary) {
    drawLine(y, colors.light);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(colors.primary);
    doc.text(data.template === "ats" ? "PROFESSIONAL SUMMARY" : "Professional Summary", 
             data.template === "modern" ? margin + 10 : margin, y);
    y += 15;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(colors.text);
    
    const summaryLines = doc.splitTextToSize(data.professionalSummary, width - margin * 2 - (data.template === "modern" ? 10 : 0));
    summaryLines.forEach(line => {
      doc.text(line, data.template === "modern" ? margin + 10 : margin, y);
      y += 14;
    });
    y += 10;
  }

  // Work Experience
  if (data.optimizedExperience && data.optimizedExperience.length > 0) {
    drawLine(y, colors.light);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(colors.primary);
    doc.text(data.template === "ats" ? "PROFESSIONAL EXPERIENCE" : "Professional Experience", 
             data.template === "modern" ? margin + 10 : margin, y);
    y += 20;

    data.optimizedExperience.forEach((exp, index) => {
      // Check if we need a new page
      if (y > height - 100) {
        doc.addPage();
        y = margin;
      }

      // Position & Company
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setColor(colors.secondary);
      doc.text(exp.position || "Position", data.template === "modern" ? margin + 10 : margin, y);
      
      // Date on right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setColor(colors.light);
      const dateText = `${formatDate(exp.startDate)} - ${exp.endDate === "Present" ? "Present" : formatDate(exp.endDate)}`;
      doc.text(dateText, width - margin, y, { align: "right" });
      y += 14;

      // Company & Location
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setColor(colors.text);
      const companyLocation = [exp.company, exp.location].filter(Boolean).join(" | ");
      doc.text(companyLocation, data.template === "modern" ? margin + 10 : margin, y);
      y += 16;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFontSize(10);
        setColor(colors.text);
        
        exp.bullets.forEach(bullet => {
          if (!bullet) return;
          
          // Check for page break
          if (y > height - 50) {
            doc.addPage();
            y = margin;
          }

          const bulletText = `• ${bullet}`;
          const lines = doc.splitTextToSize(bulletText, width - margin * 2 - 20);
          
          lines.forEach((line, lineIndex) => {
            doc.text(lineIndex === 0 ? line : `  ${line}`, 
                     data.template === "modern" ? margin + 15 : margin + 5, y);
            y += 13;
          });
        });
      }
      y += 10;
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    // Check for page break
    if (y > height - 100) {
      doc.addPage();
      y = margin;
    }

    drawLine(y, colors.light);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(colors.primary);
    doc.text(data.template === "ats" ? "EDUCATION" : "Education", 
             data.template === "modern" ? margin + 10 : margin, y);
    y += 20;

    data.education.forEach(edu => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setColor(colors.secondary);
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(" in ");
      doc.text(degreeText || "Degree", data.template === "modern" ? margin + 10 : margin, y);
      
      // Date on right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setColor(colors.light);
      doc.text(formatDate(edu.graduationDate), width - margin, y, { align: "right" });
      y += 14;

      doc.setFont("helvetica", "normal");
      setColor(colors.text);
      const institutionText = edu.gpa ? `${edu.institution} | GPA: ${edu.gpa}` : edu.institution;
      doc.text(institutionText || "", data.template === "modern" ? margin + 10 : margin, y);
      y += 20;
    });
  }

  // Skills
  if (data.optimizedSkills) {
    // Check for page break
    if (y > height - 80) {
      doc.addPage();
      y = margin;
    }

    drawLine(y, colors.light);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(colors.primary);
    doc.text(data.template === "ats" ? "SKILLS" : "Skills", 
             data.template === "modern" ? margin + 10 : margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(colors.text);

    const allSkills = [
      ...(data.optimizedSkills.technical || []),
      ...(data.optimizedSkills.soft || []),
      ...(data.optimizedSkills.other || [])
    ].filter(Boolean);

    if (allSkills.length > 0) {
      const skillsText = allSkills.join("  •  ");
      const skillLines = doc.splitTextToSize(skillsText, width - margin * 2 - (data.template === "modern" ? 10 : 0));
      skillLines.forEach(line => {
        doc.text(line, data.template === "modern" ? margin + 10 : margin, y);
        y += 14;
      });
    }
  }

  // Add watermark if preview
  if (addWatermark) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "bold");
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
  const personalInfo = data.personalInfo || {};
  
  // Create sections
  const children = [];

  // Header - Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: personalInfo.fullName || "Your Name",
          bold: true,
          size: 36,
          color: data.template === "modern" ? "059669" : data.template === "classic" ? "1e293b" : "000000"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  // Contact Info
  const contactItems = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.website
  ].filter(Boolean);

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactItems.join("  |  "),
          size: 20,
          color: "64748b"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  // Professional Summary
  if (data.professionalSummary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: 24,
            color: data.template === "modern" ? "059669" : "1e293b"
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE }
        }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.professionalSummary,
            size: 22
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  // Work Experience
  if (data.optimizedExperience && data.optimizedExperience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL EXPERIENCE",
            bold: true,
            size: 24,
            color: data.template === "modern" ? "059669" : "1e293b"
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE }
        }
      })
    );

    data.optimizedExperience.forEach(exp => {
      // Position and Date
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.position || "Position",
              bold: true,
              size: 22
            }),
            new TextRun({
              text: `\t${formatDate(exp.startDate)} - ${exp.endDate === "Present" ? "Present" : formatDate(exp.endDate)}`,
              size: 20,
              color: "64748b"
            })
          ],
          tabStops: [{ type: "right", position: 9000 }],
          spacing: { before: 150 }
        })
      );

      // Company and Location
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [exp.company, exp.location].filter(Boolean).join(" | "),
              size: 20,
              italics: true
            })
          ],
          spacing: { after: 100 }
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          if (!bullet) return;
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: bullet,
                  size: 20
                })
              ],
              bullet: { level: 0 },
              spacing: { after: 50 }
            })
          );
        });
      }
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: 24,
            color: data.template === "modern" ? "059669" : "1e293b"
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE }
        }
      })
    );

    data.education.forEach(edu => {
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(" in ");
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: degreeText || "Degree",
              bold: true,
              size: 22
            }),
            new TextRun({
              text: `\t${formatDate(edu.graduationDate)}`,
              size: 20,
              color: "64748b"
            })
          ],
          tabStops: [{ type: "right", position: 9000 }],
          spacing: { before: 100 }
        })
      );

      const institutionText = edu.gpa ? `${edu.institution} | GPA: ${edu.gpa}` : edu.institution;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: institutionText || "",
              size: 20,
              italics: true
            })
          ],
          spacing: { after: 100 }
        })
      );
    });
  }

  // Skills
  if (data.optimizedSkills) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: 24,
            color: data.template === "modern" ? "059669" : "1e293b"
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { color: "e2e8f0", size: 1, style: BorderStyle.SINGLE }
        }
      })
    );

    const allSkills = [
      ...(data.optimizedSkills.technical || []),
      ...(data.optimizedSkills.soft || []),
      ...(data.optimizedSkills.other || [])
    ].filter(Boolean);

    if (allSkills.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: allSkills.join("  •  "),
              size: 20
            })
          ]
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720
          }
        }
      },
      children: children
    }]
  });

  return doc;
};

// Generate and download resume as ZIP
export const generateAndDownloadResume = async (data) => {
  try {
    const zip = new JSZip();
    const fileName = (data.personalInfo?.fullName || "Resume").replace(/[^a-zA-Z0-9]/g, "_");
    
    // Generate PDF
    const pdfDoc = await generateResumePDF(data, false);
    const pdfBlob = pdfDoc.output("blob");
    zip.file(`${fileName}_Resume.pdf`, pdfBlob);

    // Generate DOCX
    const docxDoc = await generateResumeDOCX(data);
    const docxBlob = await Packer.toBlob(docxDoc);
    zip.file(`${fileName}_Resume.docx`, docxBlob);

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${fileName}_Resume_Files.zip`);

    return true;
  } catch (error) {
    console.error("Error generating resume:", error);
    throw error;
  }
};

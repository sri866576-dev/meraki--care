import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BillPdfData {
  hospital: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  invoice: {
    no: string;
    date: string; // formatted
    time: string;
  };
  patient: {
    name: string;
    phone: string;
    age: number;
    gender?: string;
    address?: string;
    doctor?: string;
  };
  medicines: Array<{ name: string; quantity: number; unit_price: number; amount: number }>;
  tests: Array<{ name: string; amount: number }>;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

const TEAL: [number, number, number] = [38, 110, 110];
const ORANGE: [number, number, number] = [217, 134, 56];
const SLATE: [number, number, number] = [52, 64, 75];
const LIGHT: [number, number, number] = [245, 247, 247];

function rupees(n: number) {
  return `Rs. ${n.toFixed(2)}`;
}

// Simple integer-to-words for Indian numbering
function numToWords(num: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  }
  const whole = Math.floor(num);
  const paise = Math.round((num - whole) * 100);
  let words = inWords(whole) + " Rupees";
  if (paise > 0) words += " and " + inWords(paise) + " Paise";
  return words + " Only";
}

export function generateBillPdf(data: BillPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;

  // ===== Header band =====
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 80, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 80, W, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(data.hospital.name, M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const addrLine = [data.hospital.address, data.hospital.phone, data.hospital.email]
    .filter(Boolean)
    .join("  •  ");
  doc.text(addrLine || " ", M, 56);
  if (data.hospital.gstin) {
    doc.text(`GSTIN: ${data.hospital.gstin}`, M, 70);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE", W - M, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Invoice #: ${data.invoice.no}`, W - M, 60, { align: "right" });
  doc.text(`${data.invoice.date}  ${data.invoice.time}`, W - M, 72, { align: "right" });

  // ===== Patient block =====
  let y = 110;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, W - M * 2, 76, 6, 6, "F");
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Patient Details", M + 12, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const col1X = M + 12;
  const col2X = M + (W - M * 2) / 2;
  doc.text(`Name: `, col1X, y + 36);
  doc.setFont("helvetica", "bold");
  doc.text(data.patient.name, col1X + 38, y + 36);
  doc.setFont("helvetica", "normal");
  doc.text(`Phone: ${data.patient.phone}`, col1X, y + 52);
  doc.text(`Age / Gender: ${data.patient.age} / ${data.patient.gender || "-"}`, col2X, y + 36);
  doc.text(`Doctor: ${data.patient.doctor || "—"}`, col2X, y + 52);
  if (data.patient.address) {
    doc.text(`Address: ${data.patient.address.substring(0, 80)}`, col1X, y + 68);
  }

  y += 96;

  // ===== Medicines table =====
  if (data.medicines.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Medicine", "Qty", "Unit Price", "Amount"]],
      body: data.medicines.map((m, i) => [
        i + 1,
        m.name,
        m.quantity,
        rupees(m.unit_price),
        rupees(m.amount),
      ]),
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: SLATE },
      alternateRowStyles: { fillColor: [250, 252, 252] },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 50, halign: "center" },
        3: { cellWidth: 90, halign: "right" },
        4: { cellWidth: 90, halign: "right" },
      },
      margin: { left: M, right: M },
      didDrawPage: () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...TEAL);
        doc.text("Medicines", M, y - 6);
      },
    });
    // @ts-expect-error autoTable adds lastAutoTable
    y = doc.lastAutoTable.finalY + 16;
  }

  // ===== Tests table =====
  if (data.tests.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Medical Test", "Amount"]],
      body: data.tests.map((t, i) => [i + 1, t.name, rupees(t.amount)]),
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: SLATE },
      alternateRowStyles: { fillColor: [250, 252, 252] },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 110, halign: "right" },
      },
      margin: { left: M, right: M },
      didDrawPage: () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...TEAL);
        doc.text("Medical Tests", M, y - 6);
      },
    });
    // @ts-expect-error autoTable adds lastAutoTable
    y = doc.lastAutoTable.finalY + 16;
  }

  // ===== Totals block =====
  const boxW = 240;
  const boxX = W - M - boxW;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(boxX, y, boxX + boxW, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text("Subtotal", boxX, y);
  doc.text(rupees(data.subtotal), boxX + boxW, y, { align: "right" });
  y += 16;
  doc.text(`GST (${data.gstPercent}%)`, boxX, y);
  doc.text(rupees(data.gstAmount), boxX + boxW, y, { align: "right" });
  y += 6;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.8);
  doc.line(boxX, y, boxX + boxW, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEAL);
  doc.text("Grand Total", boxX, y);
  doc.text(rupees(data.total), boxX + boxW, y, { align: "right" });

  // amount in words
  y += 24;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(`Amount in words: ${numToWords(data.total)}`, M, y);

  // ===== Footer =====
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.5);
  doc.line(M, H - 60, W - M, H - 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for choosing " + data.hospital.name + ". Get well soon.", M, H - 42);
  doc.text("This is a computer-generated invoice.", M, H - 30);
  doc.setFont("helvetica", "bold");
  doc.text("Authorized Signature", W - M, H - 30, { align: "right" });
  doc.setDrawColor(...SLATE);
  doc.line(W - M - 120, H - 42, W - M, H - 42);

  return doc;
}

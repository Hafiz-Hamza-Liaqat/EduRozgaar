import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '../../components/common/Button';
import { v1Api } from '../../services/listingsService';

const PAGE_MARGIN_MM = 8;

function waitForImages(root) {
  const imgs = root.querySelectorAll('img');
  return Promise.all([...imgs].map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

async function captureElement(target) {
  const clone = target.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.minHeight = 'auto';
  clone.style.overflow = 'visible';
  document.body.appendChild(clone);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await waitForImages(clone);

  const captureHeight = Math.max(clone.scrollHeight, target.scrollHeight);
  const captureWidth = Math.max(clone.scrollWidth, target.scrollWidth);

  try {
    return await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      height: captureHeight,
      width: captureWidth,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    document.body.removeChild(clone);
  }
}

export function ResumeDownload({ previewRef, fileName = 'Strideto-Resume' }) {
  const { t } = useTranslation('resume');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const wrapper = previewRef?.current;
    if (!wrapper) {
      window.alert(t('previewNotReady'));
      return;
    }
    const target = wrapper.querySelector('.resume-preview');
    if (!target) {
      window.alert(t('previewNotReady'));
      return;
    }

    setDownloading(true);
    try {
      const canvas = await captureElement(target);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentHeight = pageHeight - PAGE_MARGIN_MM * 2;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeightMm = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeightMm;
      let position = PAGE_MARGIN_MM;

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightMm);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = PAGE_MARGIN_MM + (heightLeft - imgHeightMm);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightMm);
        heightLeft -= contentHeight;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(`${i} / ${totalPages}`, pageWidth - PAGE_MARGIN_MM, pageHeight - 4, { align: 'right' });
      }

      pdf.save(`${fileName.replace(/[^a-zA-Z0-9-_]/g, '-')}.pdf`);
      v1Api.analyticsEvent({ eventType: 'resume_download' }).catch(() => {});
    } catch (err) {
      console.error(err);
      window.alert(t('pdfDownloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={downloading} className="w-full sm:w-auto">
      {downloading ? t('generatingPdf') : t('downloadResumePdf')}
    </Button>
  );
}

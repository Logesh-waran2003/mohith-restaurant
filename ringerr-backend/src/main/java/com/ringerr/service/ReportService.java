package com.ringerr.service;

import com.ringerr.dto.BestSellerDto;
import com.ringerr.dto.PeakHourDto;
import com.ringerr.dto.RevenueReportDto;
import com.ringerr.entity.Order;
import com.ringerr.entity.Order.OrderStatus;
import com.ringerr.repository.OrderRepository;

// Apache POI — use fully-qualified or explicit imports to avoid clashes with OpenPDF
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;       // POI Font — takes precedence in Excel section
import org.apache.poi.ss.usermodel.Row;         // POI Row
import org.apache.poi.ss.usermodel.Cell;        // POI Cell
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

// OpenPDF — import everything except the clashing names (Font/Row/Cell handled via FQN)
import com.lowagie.text.Document;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final OrderRepository orderRepository;

    public ReportService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // ── date helpers ────────────────────────────────────────────────────────────

    private LocalDateTime[] dateRange(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from;
        switch (period == null ? "daily" : period.toLowerCase()) {
            case "weekly"  -> from = LocalDate.now().minusDays(6).atStartOfDay();
            case "monthly" -> from = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            default        -> from = LocalDate.now().atStartOfDay();
        }
        return new LocalDateTime[]{from, now};
    }

    // ── revenue ─────────────────────────────────────────────────────────────────

    public RevenueReportDto getRevenue(String period) {
        LocalDateTime[] range = dateRange(period);
        LocalDateTime from = range[0];
        LocalDateTime to   = range[1];

        BigDecimal revenue = orderRepository.sumRevenueByDateRange(from, to);
        if (revenue == null) revenue = BigDecimal.ZERO;
        long count = orderRepository.countPaidOrdersByDateRange(from, to);

        return new RevenueReportDto(period == null ? "daily" : period, from, to, revenue, count);
    }

    // ── best sellers ─────────────────────────────────────────────────────────────

    public List<BestSellerDto> getBestSellers(int limit) {
        List<Object[]> rows = orderRepository.findBestSellers();
        List<BestSellerDto> result = new ArrayList<>();
        int max = Math.min(limit, rows.size());
        for (int i = 0; i < max; i++) {
            Object[] row = rows.get(i);
            Long       menuItemId   = ((Number) row[0]).longValue();
            String     menuItemName = (String) row[1];
            long       totalQty     = ((Number) row[2]).longValue();
            BigDecimal totalRev     = new BigDecimal(row[3].toString());
            result.add(new BestSellerDto(menuItemId, menuItemName, totalQty, totalRev));
        }
        return result;
    }

    // ── peak hours ───────────────────────────────────────────────────────────────

    public List<PeakHourDto> getPeakHours() {
        LocalDateTime from = LocalDate.now().atStartOfDay();
        LocalDateTime to   = from.plusDays(1);

        List<Object[]> rows = orderRepository.findOrdersByHour(from, to);

        long[] counts = new long[24];
        for (Object[] row : rows) {
            int  hour  = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            if (hour >= 0 && hour < 24) counts[hour] = count;
        }

        List<PeakHourDto> result = new ArrayList<>(24);
        for (int h = 0; h < 24; h++) {
            result.add(new PeakHourDto(h, counts[h]));
        }
        return result;
    }

    // ── Excel export ─────────────────────────────────────────────────────────────

    public byte[] exportExcel(String period) throws IOException {
        LocalDateTime[] range  = dateRange(period);
        LocalDateTime   from   = range[0];
        LocalDateTime   to     = range[1];
        List<Order>     orders = orderRepository.findByCreatedAtBetweenAndStatus(from, to, OrderStatus.PAID);

        try (XSSFWorkbook wb  = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ── Revenue sheet ─────────────────────────────────────
            Sheet      revSheet   = wb.createSheet("Revenue");
            CellStyle  hdrStyle   = wb.createCellStyle();
            Font       hdrFont    = wb.createFont();   // POI Font
            hdrFont.setBold(true);
            hdrStyle.setFont(hdrFont);

            Row    hdrRow  = revSheet.createRow(0);   // POI Row
            String[] cols  = {"Order ID", "Table", "Total Amount", "Created At"};
            for (int i = 0; i < cols.length; i++) {
                Cell c = hdrRow.createCell(i);         // POI Cell
                c.setCellValue(cols[i]);
                c.setCellStyle(hdrStyle);
            }

            int        rowIdx = 1;
            BigDecimal total  = BigDecimal.ZERO;
            for (Order o : orders) {
                Row r = revSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(o.getId());
                r.createCell(1).setCellValue(o.getTable() != null ? "T-" + o.getTable().getTableNumber() : "");
                r.createCell(2).setCellValue(o.getTotalAmount().doubleValue());
                r.createCell(3).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
                total = total.add(o.getTotalAmount());
            }
            Row  sumRow  = revSheet.createRow(rowIdx + 1);
            Cell sumLbl  = sumRow.createCell(1);
            sumLbl.setCellValue("Total Revenue");
            sumLbl.setCellStyle(hdrStyle);
            Cell sumVal  = sumRow.createCell(2);
            sumVal.setCellValue(total.doubleValue());
            sumVal.setCellStyle(hdrStyle);
            for (int i = 0; i < cols.length; i++) revSheet.autoSizeColumn(i);

            // ── Best Sellers sheet ─────────────────────────────────
            Sheet  bsSheet  = wb.createSheet("Best Sellers");
            Row    bsHdr    = bsSheet.createRow(0);
            String[] bsCols = {"Rank", "Item Name", "Qty Sold", "Revenue"};
            for (int i = 0; i < bsCols.length; i++) {
                Cell c = bsHdr.createCell(i);
                c.setCellValue(bsCols[i]);
                c.setCellStyle(hdrStyle);
            }
            List<BestSellerDto> sellers = getBestSellers(20);
            for (int i = 0; i < sellers.size(); i++) {
                BestSellerDto s = sellers.get(i);
                Row r = bsSheet.createRow(i + 1);
                r.createCell(0).setCellValue(i + 1);
                r.createCell(1).setCellValue(s.getMenuItemName());
                r.createCell(2).setCellValue(s.getTotalQty());
                r.createCell(3).setCellValue(s.getTotalRevenue().doubleValue());
            }
            for (int i = 0; i < bsCols.length; i++) bsSheet.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── PDF export ────────────────────────────────────────────────────────────────

    public byte[] exportPdf(String period) throws IOException {
        LocalDateTime[] range  = dateRange(period);
        LocalDateTime   from   = range[0];
        LocalDateTime   to     = range[1];
        List<Order>     orders = orderRepository.findByCreatedAtBetweenAndStatus(from, to, OrderStatus.PAID);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Use FQN for OpenPDF Font to avoid clash with POI Font imported above
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            com.lowagie.text.Font subFont   = FontFactory.getFont(FontFactory.HELVETICA, 11);
            com.lowagie.text.Font boldFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            com.lowagie.text.Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

            doc.add(new Paragraph("Ringerr — Revenue Report", titleFont));
            doc.add(new Paragraph(
                    "Period: " + (period == null ? "daily" : period) +
                    "  |  From: " + from.toLocalDate() + "  To: " + to.toLocalDate(), subFont));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Orders", boldFont));
            doc.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.5f, 2f, 3f});

            for (String h : new String[]{"Order ID", "Table", "Amount (₹)", "Date"}) {
                PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
                cell.setBackgroundColor(new java.awt.Color(26, 31, 46));
                table.addCell(cell);
            }

            BigDecimal total = BigDecimal.ZERO;
            for (Order o : orders) {
                table.addCell(new Phrase(String.valueOf(o.getId()), smallFont));
                table.addCell(new Phrase(o.getTable() != null ? "T-" + o.getTable().getTableNumber() : "-", smallFont));
                table.addCell(new Phrase(o.getTotalAmount().toString(), smallFont));
                table.addCell(new Phrase(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "-", smallFont));
                total = total.add(o.getTotalAmount());
            }
            doc.add(table);
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("Total Revenue: ₹" + total, boldFont));
            doc.add(new Paragraph("Total Orders: " + orders.size(), boldFont));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Best Sellers", boldFont));
            doc.add(new Paragraph(" "));

            PdfPTable bsTable = new PdfPTable(4);
            bsTable.setWidthPercentage(100);
            for (String h : new String[]{"Rank", "Item", "Qty Sold", "Revenue (₹)"}) {
                PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
                cell.setBackgroundColor(new java.awt.Color(26, 31, 46));
                bsTable.addCell(cell);
            }
            List<BestSellerDto> sellers = getBestSellers(10);
            for (int i = 0; i < sellers.size(); i++) {
                BestSellerDto s = sellers.get(i);
                bsTable.addCell(new Phrase(String.valueOf(i + 1), smallFont));
                bsTable.addCell(new Phrase(s.getMenuItemName(), smallFont));
                bsTable.addCell(new Phrase(String.valueOf(s.getTotalQty()), smallFont));
                bsTable.addCell(new Phrase(s.getTotalRevenue().toString(), smallFont));
            }
            doc.add(bsTable);

            doc.close();
            return out.toByteArray();
        }
    }
}

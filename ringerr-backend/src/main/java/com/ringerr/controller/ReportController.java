package com.ringerr.controller;

import com.ringerr.dto.BestSellerDto;
import com.ringerr.dto.PeakHourDto;
import com.ringerr.dto.RevenueReportDto;
import com.ringerr.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * GET /api/reports/revenue?period=daily|weekly|monthly
     */
    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportDto> getRevenue(
            @RequestParam(defaultValue = "daily") String period) {
        return ResponseEntity.ok(reportService.getRevenue(period));
    }

    /**
     * GET /api/reports/best-sellers?limit=10
     */
    @GetMapping("/best-sellers")
    public ResponseEntity<List<BestSellerDto>> getBestSellers(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reportService.getBestSellers(limit));
    }

    /**
     * GET /api/reports/peak-hours
     */
    @GetMapping("/peak-hours")
    public ResponseEntity<List<PeakHourDto>> getPeakHours() {
        return ResponseEntity.ok(reportService.getPeakHours());
    }

    /**
     * GET /api/reports/export/excel?period=daily|weekly|monthly
     */
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "daily") String period) throws IOException {
        byte[] data = reportService.exportExcel(period);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"ringerr-report-" + period + ".xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    /**
     * GET /api/reports/export/pdf?period=daily|weekly|monthly
     */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(defaultValue = "daily") String period) throws IOException {
        byte[] data = reportService.exportPdf(period);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"ringerr-report-" + period + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}

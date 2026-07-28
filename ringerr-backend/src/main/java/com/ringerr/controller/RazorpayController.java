package com.ringerr.controller;

import com.ringerr.service.RazorpayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/razorpay")
public class RazorpayController {

    private final RazorpayService razorpayService;

    public RazorpayController(RazorpayService razorpayService) {
        this.razorpayService = razorpayService;
    }

    /**
     * POST /api/razorpay/create-order
     * Body: { "amount": 250.00, "receipt": "order_table5_123" }
     * Returns: { "orderId": "order_xxx", "amount": 25000, "currency": "INR", "keyId": "rzp_xxx" }
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String receipt = body.getOrDefault("receipt", "rcpt_" + System.currentTimeMillis()).toString();
            Map<String, Object> order = razorpayService.createOrder(amount, receipt);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/razorpay/verify
     * Body: { "razorpayOrderId": "order_xxx", "razorpayPaymentId": "pay_xxx", "razorpaySignature": "sig_xxx" }
     * Returns: { "verified": true/false }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        String razorpayOrderId  = body.get("razorpayOrderId");
        String razorpayPaymentId = body.get("razorpayPaymentId");
        String razorpaySignature = body.get("razorpaySignature");

        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        boolean verified = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (verified) {
            return ResponseEntity.ok(Map.of("verified", true));
        } else {
            return ResponseEntity.status(400).body(Map.of("verified", false, "error", "Signature mismatch"));
        }
    }
}

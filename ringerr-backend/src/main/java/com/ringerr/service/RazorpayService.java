package com.ringerr.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class RazorpayService {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    /**
     * Creates a Razorpay order on the server side.
     * Returns the razorpay order id and amount (in paise).
     */
    public Map<String, Object> createOrder(BigDecimal amountInRupees, String receiptId) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject orderRequest = new JSONObject();
        // Razorpay expects amount in paise (smallest currency unit)
        long amountPaise = amountInRupees.multiply(BigDecimal.valueOf(100)).longValue();
        orderRequest.put("amount", amountPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", receiptId);
        orderRequest.put("payment_capture", 1);

        Order order = client.orders.create(orderRequest);

        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.get("id").toString());
        result.put("amount", amountPaise);
        result.put("currency", "INR");
        result.put("keyId", keyId);
        return result;
    }

    /**
     * Verifies Razorpay payment signature using HMAC SHA-256.
     * Signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
     */
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String message = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(keySecret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(message.getBytes("UTF-8"));
            // Convert to hex
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equals(razorpaySignature);
        } catch (Exception e) {
            return false;
        }
    }
}

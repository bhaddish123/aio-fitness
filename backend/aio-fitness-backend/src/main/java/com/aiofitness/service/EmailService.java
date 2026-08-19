package com.aiofitness.service;

import com.aiofitness.dto.InquiryRequest;
import com.aiofitness.model.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${notify.email}")
    private String notifyEmail;

    private static final String SITE_URL   = "https://everettleecoaching.com";
    private static final String LOCATION   = "Based in PA, Online offered worldwide";
    private static final String PHONE      = "(215) 970-1446";
    private static final String EMAIL      = "everettleefitness@gmail.com";
    private static final String LOGO_URL   = "https://i.imgur.com/QiuHwns.png";
    private static final String TRAINERIZE_URL = "https://everettleecoaching.trainerize.com/app/login";
    private static final String IG_URL     = "https://www.instagram.com/everettxlee/";
    private static final String LI_URL     = "https://www.linkedin.com/in/everett-lee-661a56172/";

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy 'at' h:mm a z");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /* ── Public email methods ─────────────────────────────────── */

    public void sendConfirmation(Booking booking) {
        String time = formatTime(booking);
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 24px">Your session has been confirmed! We look forward to seeing you.</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                  <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Session Details</td></tr>
                  <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Location</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">%s</td></tr>
                  </table></td></tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;color:rgba(245,243,240,0.55)">Need to cancel? You have until 24 hours before your session.</p>
                <p style="margin:0 0 24px;text-align:center">
                  <a href="%s/cancel/%s" style="display:inline-block;padding:12px 28px;background:transparent;color:#D4AF37;border:1px solid #D4AF37;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">Cancel Booking</a>
                </p>
                """.formatted(
                esc(booking.getClientName()),
                booking.getSessionType().getName(),
                time,
                LOCATION,
                SITE_URL, booking.getCancellationToken()
        );
        send(booking.getClientEmail(), "Booking Confirmed — AIO Fitness", body);
    }

    public void sendCancellation(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 16px">Your session on <strong>%s</strong> has been cancelled and your refund has been processed.</p>
                <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">Refunds typically appear within 5–10 business days depending on your bank.</p>
                <p style="margin:0 0 24px;text-align:center">
                  <a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Book Another Session</a>
                </p>
                """.formatted(
                esc(booking.getClientName()),
                formatTime(booking),
                SITE_URL
        );
        send(booking.getClientEmail(), "Booking Cancelled — AIO Fitness", body);
    }

    public void sendFailedPayment(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 16px">We were unable to confirm your booking for <strong>%s</strong>. Your reservation has expired and the slot has been released.</p>
                <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">No charge was made to your account. You're welcome to try booking again.</p>
                <p style="margin:0 0 24px;text-align:center">
                  <a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Try Again</a>
                </p>
                """.formatted(
                esc(booking.getClientName()),
                formatTime(booking),
                SITE_URL
        );
        send(booking.getClientEmail(), "Booking Not Completed — AIO Fitness", body);
    }

    public void send24hReminder(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 24px">This is a friendly reminder that your session is <strong>tomorrow</strong>. We'll see you there!</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                  <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Session Details</td></tr>
                  <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Location</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">%s</td></tr>
                  </table></td></tr>
                </table>
                """.formatted(
                esc(booking.getClientName()),
                booking.getSessionType().getName(),
                formatTime(booking),
                LOCATION
        );
        send(booking.getClientEmail(), "Session Tomorrow — AIO Fitness", body);
    }

    public void send2hReminder(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 24px">Your session starts in <strong>2 hours</strong>. Get ready!</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                  <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Session Details</td></tr>
                  <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Location</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">%s</td></tr>
                  </table></td></tr>
                </table>
                """.formatted(
                esc(booking.getClientName()),
                booking.getSessionType().getName(),
                formatTime(booking),
                LOCATION
        );
        send(booking.getClientEmail(), "Session in 2 Hours — AIO Fitness", body);
    }

    public void sendPostSession(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 16px">Thanks for training with us today — great work out there! We hope you felt the results.</p>
                <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">Consistency is everything. When you're ready for your next session, we're here.</p>
                <p style="margin:0 0 24px;text-align:center">
                  <a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Book Your Next Session</a>
                </p>
                """.formatted(
                esc(booking.getClientName()),
                SITE_URL
        );
        send(booking.getClientEmail(), "Thanks for Training With Us — AIO Fitness", body);
    }

    public void sendInquiry(InquiryRequest req) {
        String toEverett = """
                <p style="margin:0 0 16px">New coaching inquiry received.</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                  <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Inquiry Details</td></tr>
                  <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Package</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Name</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6)">Email</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Phone</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6)">Goals</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Questions</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">%s</td></tr>
                  </table></td></tr>
                </table>
                """.formatted(
                esc(req.packageName()),
                esc(req.clientName()),
                esc(req.clientEmail()),
                req.clientPhone() != null && !req.clientPhone().isBlank() ? esc(req.clientPhone()) : "n/a",
                esc(req.goals()),
                req.questions() != null && !req.questions().isBlank() ? esc(req.questions()) : "n/a"
        );
        send(notifyEmail, "New Inquiry: " + req.packageName() + " — " + req.clientName(), toEverett);

        String toClient = """
                <p style="margin:0 0 16px">Hi <strong>%s</strong>,</p>
                <p style="margin:0 0 16px">Thanks for reaching out about <strong>%s</strong> coaching. Everett will review your information and be in touch shortly to discuss your goals and next steps.</p>
                <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">In the meantime, feel free to explore the site to learn more about what we offer.</p>
                <p style="margin:0 0 24px;text-align:center">
                  <a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Visit AIO Fitness</a>
                </p>
                """.formatted(esc(req.clientName()), esc(req.packageName()), SITE_URL);
        send(req.clientEmail(), "Your Inquiry — AIO Fitness", toClient);
    }

    public void sendAdminBookingNotification(Booking booking) {
        String body = """
                <p style="margin:0 0 16px">A new session has been booked.</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                  <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Booking Details</td></tr>
                  <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Client</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Email</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6)">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">%s</td></tr>
                    <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">%s</td></tr>
                  </table></td></tr>
                </table>
                """.formatted(
                esc(booking.getClientName()),
                esc(booking.getClientEmail()),
                booking.getSessionType().getName(),
                formatTime(booking)
        );
        send(notifyEmail, "New Booking — " + booking.getClientName(), body);
    }

    /* ── Preview (dev only) ───────────────────────────────────── */

    public String previewHtml(String type) {
        String body = switch (type) {
            case "cancellation" -> """
                    <p style="margin:0 0 16px">Hi <strong>John Doe</strong>,</p>
                    <p style="margin:0 0 16px">Your session on <strong>Friday, August 8 2026 at 10:00 AM EDT</strong> has been cancelled and your refund has been processed.</p>
                    <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">Refunds typically appear within 5–10 business days depending on your bank.</p>
                    <p style="margin:0 0 24px;text-align:center"><a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Book Another Session</a></p>
                    """.formatted(SITE_URL);
            case "reminder24" -> """
                    <p style="margin:0 0 16px">Hi <strong>John Doe</strong>,</p>
                    <p style="margin:0 0 24px">This is a friendly reminder that your session is <strong>tomorrow</strong>. We'll see you there!</p>
                    <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                      <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Session Details</td></tr>
                      <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                        <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">Personal Training — 1 Hour</td></tr>
                        <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">Saturday, August 9 2026 at 10:00 AM EDT</td></tr>
                        <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Location</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">Devon, PA</td></tr>
                      </table></td></tr>
                    </table>
                    """;
            case "post" -> """
                    <p style="margin:0 0 16px">Hi <strong>John Doe</strong>,</p>
                    <p style="margin:0 0 16px">Thanks for training with us today — great work out there! We hope you felt the results.</p>
                    <p style="margin:0 0 24px;color:rgba(245,243,240,0.6);font-size:14px">Consistency is everything. When you're ready for your next session, we're here.</p>
                    <p style="margin:0 0 24px;text-align:center"><a href="%s" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#0a0a09;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">Book Your Next Session</a></p>
                    """.formatted(SITE_URL);
            default -> """
                    <p style="margin:0 0 16px">Hi <strong>John Doe</strong>,</p>
                    <p style="margin:0 0 24px">Your session has been confirmed! We look forward to seeing you.</p>
                    <table style="width:100%%;border-collapse:collapse;margin-bottom:24px">
                      <tr><td style="padding:10px 14px;background:#1a1917;border-radius:6px 6px 0 0;color:#D4AF37;font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase">Session Details</td></tr>
                      <tr><td style="padding:0"><table style="width:100%%;border-collapse:collapse">
                        <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);width:120px">Session</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee">Personal Training — 1 Hour</td></tr>
                        <tr><td style="padding:10px 14px;background:#0f0f0e;font-size:13px;color:rgba(245,243,240,0.6)">Date &amp; Time</td><td style="padding:10px 14px;background:#0f0f0e;font-size:14px;color:#f5f3ee">Friday, August 8 2026 at 10:00 AM EDT</td></tr>
                        <tr><td style="padding:10px 14px;background:#111110;font-size:13px;color:rgba(245,243,240,0.6);border-radius:0 0 0 6px">Location</td><td style="padding:10px 14px;background:#111110;font-size:14px;color:#f5f3ee;border-radius:0 0 6px 0">Devon, PA</td></tr>
                      </table></td></tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:13px;color:rgba(245,243,240,0.55)">Need to cancel? You have until 24 hours before your session.</p>
                    <p style="margin:0 0 24px;text-align:center"><a href="#" style="display:inline-block;padding:12px 28px;background:transparent;color:#D4AF37;border:1px solid #D4AF37;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">Cancel Booking</a></p>
                    """;
        };
        return buildEmail(body);
    }

    /* ── Internals ────────────────────────────────────────────── */

    private void send(String to, String subject, String bodyHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(buildEmail(bodyHtml), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }

    private String buildEmail(String bodyHtml) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIO Fitness</title></head>
                <body style="margin:0;padding:0;background-color:#0a0a09;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a09;padding:40px 16px">
                    <tr><td align="center">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#131311;border-radius:12px;overflow:hidden;border:1px solid rgba(212,175,55,0.15)">

                        <!-- Gold top bar -->
                        <tr><td style="height:4px;background:linear-gradient(90deg,#8C6D1F,#D4AF37,#F9E180,#D4AF37,#8C6D1F)"></td></tr>

                        <!-- Logo -->
                        <tr><td align="center" style="padding:32px 32px 24px">
                          <a href="%s"><img src="%s" alt="AIO Fitness" width="120" style="display:block;height:auto;max-width:120px"></a>
                        </td></tr>

                        <!-- Body -->
                        <tr><td style="padding:0 32px 32px;color:#f5f3ee;font-size:15px;line-height:1.7">
                          %s
                        </td></tr>

                        <!-- Divider -->
                        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid rgba(212,175,55,0.2);margin:0"></td></tr>

                        <!-- Signature footer -->
                        <tr><td style="padding:24px 32px;text-align:center">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#f5f3ee;letter-spacing:.3px">Everett Lee</p>
                          <p style="margin:0 0 12px;font-size:13px;color:#D4AF37;letter-spacing:.5px;text-transform:uppercase">AIO Fitness</p>
                          <p style="margin:0 0 4px;font-size:13px;color:rgba(245,243,240,0.55)">%s</p>
                          <p style="margin:0 0 16px;font-size:13px;color:rgba(245,243,240,0.55)">
                            <a href="tel:+12159701446" style="color:rgba(245,243,240,0.55);text-decoration:none">%s</a>
                            &nbsp;·&nbsp;
                            <a href="mailto:%s" style="color:rgba(245,243,240,0.55);text-decoration:none">%s</a>
                          </p>
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                            <tr>
                              <td style="padding:0 4px"><a href="%s" style="display:inline-block;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:20px;color:#D4AF37;text-decoration:none;font-size:12px;font-weight:600">Trainerize</a></td>
                              <td style="padding:0 4px"><a href="%s" style="display:inline-block;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:20px;color:#D4AF37;text-decoration:none;font-size:12px;font-weight:600">Instagram</a></td>
                              <td style="padding:0 4px"><a href="%s" style="display:inline-block;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:20px;color:#D4AF37;text-decoration:none;font-size:12px;font-weight:600">LinkedIn</a></td>
                            </tr>
                          </table>
                        </td></tr>

                        <!-- Copyright -->
                        <tr><td style="padding:0 32px 24px;text-align:center">
                          <p style="margin:0;font-size:11px;color:rgba(245,243,240,0.3)">&copy; %d AIO Fitness. All rights reserved.</p>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                SITE_URL, LOGO_URL,
                bodyHtml,
                LOCATION, PHONE, EMAIL, EMAIL,
                TRAINERIZE_URL, IG_URL, LI_URL,
                java.time.Year.now().getValue()
        );
    }

    private String formatTime(Booking booking) {
        return ZonedDateTime.ofInstant(booking.getStartTime(), ZoneId.of("America/New_York"))
                .format(FORMATTER);
    }

    private static String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}

package com.a3fit.service;

import com.a3fit.model.Booking;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    private static final String LOCATION = "Devon, PA";
    private static final String REBOOK_URL = "http://localhost:5173";
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy 'at' h:mm a z");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendConfirmation(Booking booking) {
        String time = formatTime(booking);
        String body = """
                Hi %s,

                Your session has been confirmed!

                Session: %s
                Date & Time: %s
                Location: %s

                To cancel your booking, click the link below:
                %s/cancel/%s

                We look forward to seeing you!

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                booking.getSessionType().getName(),
                time,
                LOCATION,
                REBOOK_URL, booking.getCancellationToken()
        );
        send(booking.getClientEmail(), "Booking Confirmed — A3 Fitness", body);
    }

    public void sendCancellation(Booking booking) {
        String body = """
                Hi %s,

                Your session on %s has been cancelled and your refund has been processed.

                Ready to rebook? Visit us at:
                %s

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                formatTime(booking),
                REBOOK_URL
        );
        send(booking.getClientEmail(), "Booking Cancelled — A3 Fitness", body);
    }

    public void sendFailedPayment(Booking booking) {
        String body = """
                Hi %s,

                We were unable to confirm your booking for %s. Your reservation has expired and the slot has been released.

                Please visit us to book again:
                %s

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                formatTime(booking),
                REBOOK_URL
        );
        send(booking.getClientEmail(), "Booking Not Completed — A3 Fitness", body);
    }

    public void send24hReminder(Booking booking) {
        String body = """
                Hi %s,

                This is a reminder that your session is tomorrow!

                Session: %s
                Date & Time: %s
                Location: %s

                See you soon!

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                booking.getSessionType().getName(),
                formatTime(booking),
                LOCATION
        );
        send(booking.getClientEmail(), "Session Tomorrow — A3 Fitness", body);
    }

    public void send2hReminder(Booking booking) {
        String body = """
                Hi %s,

                Your session starts in 2 hours!

                Session: %s
                Date & Time: %s
                Location: %s

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                booking.getSessionType().getName(),
                formatTime(booking),
                LOCATION
        );
        send(booking.getClientEmail(), "Session in 2 Hours — A3 Fitness", body);
    }

    public void sendPostSession(Booking booking) {
        String body = """
                Hi %s,

                Thanks for training with us today! We hope your session was great.

                Ready to book your next session?
                %s

                — A3 Fitness
                """.formatted(
                booking.getClientName(),
                REBOOK_URL
        );
        send(booking.getClientEmail(), "Thanks for Training With Us — A3 Fitness", body);
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private String formatTime(Booking booking) {
        return ZonedDateTime.ofInstant(booking.getStartTime(), ZoneId.of("America/New_York"))
                .format(FORMATTER);
    }
}

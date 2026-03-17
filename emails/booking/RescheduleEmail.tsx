import * as React from "react";
import { Html, Head, Preview, Body, Container, Heading, Text, Hr, Section } from "react-email";

type RescheduleEmailProps = {
  organizationName: string;
  serviceName: string;
  staffName: string;
  customerName: string;
  oldStartTimeLabel: string;
  oldEndTimeLabel: string;
  newStartTimeLabel: string;
  newEndTimeLabel: string;
  reference: string;
  manageUrl: string;
};

export function RescheduleEmail(props: RescheduleEmailProps) {
  const {
    organizationName,
    serviceName,
    staffName,
    customerName,
    oldStartTimeLabel,
    oldEndTimeLabel,
    newStartTimeLabel,
    newEndTimeLabel,
    reference,
    manageUrl,
  } = props;

  const previewText = `Your booking at ${organizationName} has been rescheduled`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Booking rescheduled</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Your booking at {organizationName} has been successfully rescheduled. Here are the
            updated details:
          </Text>
          <Section style={cardStyle}>
            <Text style={labelStyle}>
              Service: <span style={valueStyle}>{serviceName}</span>
            </Text>
            <Text style={labelStyle}>
              Staff: <span style={valueStyle}>{staffName}</span>
            </Text>
            <Text style={labelStyle}>
              Previous time:{" "}
              <span style={valueStyle}>
                {oldStartTimeLabel} – {oldEndTimeLabel}
              </span>
            </Text>
            <Text style={labelStyle}>
              New time:{" "}
              <span style={valueStyle}>
                {newStartTimeLabel} – {newEndTimeLabel}
              </span>
            </Text>
            <Text style={labelStyle}>
              Reference: <span style={valueStyle}>{reference}</span>
            </Text>
          </Section>
          <Text style={textStyle}>
            You can review your booking or make further changes from the link below:
          </Text>
          <Text style={textStyle}>
            <a href={manageUrl} style={linkStyle}>
              View / manage booking
            </a>
          </Text>
          <Hr style={hrStyle} />
          <Text style={mutedStyle}>We look forward to seeing you at the new time.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const containerStyle: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px 16px",
  maxWidth: "520px",
  backgroundColor: "#ffffff",
};

const headingStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "12px",
};

const textStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#111827",
};

const cardStyle: React.CSSProperties = {
  marginTop: "16px",
  marginBottom: "16px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  margin: "4px 0",
  color: "#374151",
};

const valueStyle: React.CSSProperties = {
  fontWeight: 500,
};

const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};

const hrStyle: React.CSSProperties = {
  marginTop: "24px",
  marginBottom: "12px",
  borderColor: "#e5e7eb",
};

const mutedStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
};


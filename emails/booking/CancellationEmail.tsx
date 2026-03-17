import * as React from "react";
import { Html, Head, Preview, Body, Container, Heading, Text, Hr, Section } from "react-email";

type CancellationEmailProps = {
  organizationName: string;
  serviceName: string;
  staffName: string;
  customerName: string;
  startTimeLabel: string;
  endTimeLabel: string;
  reference: string;
  manageUrl: string;
  refundedAmountLabel?: string;
};

export function CancellationEmail(props: CancellationEmailProps) {
  const {
    organizationName,
    serviceName,
    staffName,
    customerName,
    startTimeLabel,
    endTimeLabel,
    reference,
    manageUrl,
    refundedAmountLabel,
  } = props;

  const previewText = `Your booking at ${organizationName} has been cancelled`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Booking cancelled</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Your booking at {organizationName} has been cancelled. Here are the details:
          </Text>
          <Section style={cardStyle}>
            <Text style={labelStyle}>
              Service: <span style={valueStyle}>{serviceName}</span>
            </Text>
            <Text style={labelStyle}>
              Staff: <span style={valueStyle}>{staffName}</span>
            </Text>
            <Text style={labelStyle}>
              When:{" "}
              <span style={valueStyle}>
                {startTimeLabel} – {endTimeLabel}
              </span>
            </Text>
            <Text style={labelStyle}>
              Reference: <span style={valueStyle}>{reference}</span>
            </Text>
          </Section>
          {refundedAmountLabel ? (
            <Text style={textStyle}>
              A refund of {refundedAmountLabel} has been initiated, and it may take a few days to
              appear on your statement.
            </Text>
          ) : null}
          <Text style={textStyle}>
            If this was a mistake or you need to rebook, you can contact {organizationName} directly
            or create a new booking from their public page.
          </Text>
          <Text style={textStyle}>
            <a href={manageUrl} style={linkStyle}>
              View booking history
            </a>
          </Text>
          <Hr style={hrStyle} />
          <Text style={mutedStyle}>Thank you for letting us know.</Text>
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


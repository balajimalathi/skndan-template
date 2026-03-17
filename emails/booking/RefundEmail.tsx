import * as React from "react";
import { Html, Head, Preview, Body, Container, Heading, Text, Hr, Section } from "react-email";

type RefundEmailProps = {
  organizationName: string;
  serviceName: string;
  customerName: string;
  reference: string;
  refundedAmountLabel: string;
  paymentGatewayLabel: string;
};

export function RefundEmail(props: RefundEmailProps) {
  const { organizationName, serviceName, customerName, reference, refundedAmountLabel, paymentGatewayLabel } =
    props;

  const previewText = `Your refund from ${organizationName} is on the way`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Refund issued</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            A refund has been issued for your booking at {organizationName}. The details are below:
          </Text>
          <Section style={cardStyle}>
            <Text style={labelStyle}>
              Service: <span style={valueStyle}>{serviceName}</span>
            </Text>
            <Text style={labelStyle}>
              Reference: <span style={valueStyle}>{reference}</span>
            </Text>
            <Text style={labelStyle}>
              Amount refunded: <span style={valueStyle}>{refundedAmountLabel}</span>
            </Text>
            <Text style={labelStyle}>
              Payment method: <span style={valueStyle}>{paymentGatewayLabel}</span>
            </Text>
          </Section>
          <Text style={textStyle}>
            Depending on your bank or card issuer, it may take a few business days for the refund to
            appear on your statement.
          </Text>
          <Hr style={hrStyle} />
          <Text style={mutedStyle}>If you have any questions, please contact {organizationName}.</Text>
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

const hrStyle: React.CSSProperties = {
  marginTop: "24px",
  marginBottom: "12px",
  borderColor: "#e5e7eb",
};

const mutedStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
};


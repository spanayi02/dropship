import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from "@react-email/components";
import { STORE_NAME } from "../resend";

export interface ShippingNotificationEmailProps {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery: string;
  items: {
    title: string;
    quantity: number;
  }[];
  orderUrl: string;
}

export function ShippingNotificationEmail({
  orderNumber,
  customerName,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  items,
  orderUrl,
}: ShippingNotificationEmailProps) {
  const storeName = STORE_NAME;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Great news! Your order {orderNumber} has shipped and is on its way.
      </Preview>
      <Body style={body}>
        {/* ── Header ── */}
        <Section style={header}>
          <Text style={headerStoreName}>{storeName}</Text>
          <Text style={headerTagline}>Shipping Update</Text>
        </Section>

        <Container style={container}>
          {/* ── Hero ── */}
          <Section style={heroSection}>
            <Row>
              <Column align="center">
                <table
                  align="center"
                  cellPadding="0"
                  cellSpacing="0"
                  border={0}
                  style={{ margin: "0 auto" }}
                >
                  <tr>
                    <td>
                      {/* Truck icon */}
                      <div style={iconWrapper}>
                        <svg
                          width="44"
                          height="44"
                          viewBox="0 0 44 44"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ display: "block" }}
                        >
                          <circle cx="22" cy="22" r="22" fill="#10b981" />
                          <path
                            d="M10 17h16v11H10z"
                            fill="white"
                            fillOpacity="0.2"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M26 20h4l3 4v4h-7V20z"
                            fill="white"
                            fillOpacity="0.2"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                          <circle cx="14" cy="29" r="2" fill="white" />
                          <circle cx="30" cy="29" r="2" fill="white" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
            <Text style={heroHeading}>Your order is on its way!</Text>
            <Text style={heroSubtext}>
              Hi {customerName}, great news — your order{" "}
              <strong>{orderNumber}</strong> has been picked up by the carrier
              and is headed your direction.
            </Text>
          </Section>

          {/* ── Tracking Number ── */}
          <Section style={trackingSection}>
            <Text style={trackingLabel}>Tracking Number</Text>
            {trackingUrl ? (
              <Link href={trackingUrl} style={trackingLink}>
                {trackingNumber}
              </Link>
            ) : (
              <Text style={trackingValue}>{trackingNumber}</Text>
            )}
          </Section>

          {/* ── Track Package CTA ── */}
          <Section style={ctaSection}>
            {trackingUrl ? (
              <Button href={trackingUrl} style={ctaButtonPrimary}>
                Track Package
              </Button>
            ) : (
              <Text style={noTrackingNote}>
                Use the tracking number above on your carrier&apos;s website to
                follow your shipment.
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          {/* ── Estimated Delivery ── */}
          <Section style={deliverySection}>
            <Row>
              <Column style={deliveryIconCol}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: "block", marginTop: "2px" }}
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 5v5l3 3"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Column>
              <Column style={deliveryTextCol}>
                <Text style={deliveryLabel}>Estimated Delivery</Text>
                <Text style={deliveryDate}>{estimatedDelivery}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Items in Shipment ── */}
          <Section style={sectionPadding}>
            <Text style={sectionHeading}>Items in This Shipment</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemBulletCol}>
                  <div style={itemBullet} />
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemTitle}>{item.title}</Text>
                </Column>
                <Column style={itemQtyCol}>
                  <Text style={itemQty}>× {item.quantity}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          {/* ── View Order CTA ── */}
          <Section style={viewOrderSection}>
            <Text style={viewOrderText}>Want to see full order details?</Text>
            <Button href={orderUrl} style={ctaButtonSecondary}>
              View Order
            </Button>
          </Section>

          <Hr style={divider} />

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Text style={footerStoreName}>{storeName}</Text>
            <Text style={footerText}>
              Questions? Email us at{" "}
              <Link
                href={`mailto:support@${storeName.toLowerCase()}.com`}
                style={footerLink}
              >
                support@{storeName.toLowerCase()}.com
              </Link>
            </Text>
            <Text style={footerUnsubscribe}>
              You received this email because you placed an order with{" "}
              {storeName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingNotificationEmail;

// ─── Styles ────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "600px",
  margin: "0 auto",
  overflow: "hidden",
  border: "1px solid #e4e4e7",
};

const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 40px",
  textAlign: "center",
};

const headerStoreName: React.CSSProperties = {
  color: "#10b981",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const headerTagline: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "2px",
  margin: 0,
  textTransform: "uppercase",
};

const heroSection: React.CSSProperties = {
  padding: "40px 40px 32px",
  textAlign: "center",
};

const iconWrapper: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "20px",
};

const heroHeading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0 0 12px",
};

const heroSubtext: React.CSSProperties = {
  color: "#71717a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 auto",
  maxWidth: "420px",
};

const trackingSection: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #10b981",
  borderRadius: "0 6px 6px 0",
  margin: "0 40px",
  padding: "16px 20px",
};

const trackingLabel: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  margin: "0 0 6px",
  textTransform: "uppercase",
};

const trackingLink: React.CSSProperties = {
  color: "#14532d",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  textDecoration: "underline",
};

const trackingValue: React.CSSProperties = {
  color: "#14532d",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  margin: 0,
};

const ctaSection: React.CSSProperties = {
  padding: "28px 40px 0",
  textAlign: "center",
};

const ctaButtonPrimary: React.CSSProperties = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
  letterSpacing: "0.2px",
};

const noTrackingNote: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
  textAlign: "center",
};

const divider: React.CSSProperties = {
  borderColor: "#f4f4f5",
  margin: "24px 0",
};

const deliverySection: React.CSSProperties = {
  padding: "0 40px",
};

const deliveryIconCol: React.CSSProperties = {
  width: "28px",
  verticalAlign: "top",
};

const deliveryTextCol: React.CSSProperties = {
  verticalAlign: "top",
};

const deliveryLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "0.5px",
  margin: "0 0 2px",
  textTransform: "uppercase",
};

const deliveryDate: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "700",
  margin: 0,
};

const sectionPadding: React.CSSProperties = {
  padding: "0 40px",
};

const sectionHeading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const itemRow: React.CSSProperties = {
  marginBottom: "10px",
};

const itemBulletCol: React.CSSProperties = {
  width: "16px",
  verticalAlign: "middle",
};

const itemBullet: React.CSSProperties = {
  backgroundColor: "#10b981",
  borderRadius: "50%",
  width: "6px",
  height: "6px",
  display: "inline-block",
};

const itemDetailsCol: React.CSSProperties = {
  paddingLeft: "8px",
  verticalAlign: "middle",
};

const itemTitle: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  margin: 0,
};

const itemQtyCol: React.CSSProperties = {
  textAlign: "right",
  verticalAlign: "middle",
};

const itemQty: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  fontWeight: "600",
  margin: 0,
};

const viewOrderSection: React.CSSProperties = {
  padding: "4px 40px 28px",
  textAlign: "center",
};

const viewOrderText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: "0 0 16px",
};

const ctaButtonSecondary: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  letterSpacing: "0.2px",
};

const footerSection: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderTop: "1px solid #f4f4f5",
  padding: "24px 40px",
  textAlign: "center",
};

const footerStoreName: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const footerText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0 0 8px",
};

const footerLink: React.CSSProperties = {
  color: "#10b981",
  textDecoration: "none",
};

const footerUnsubscribe: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: 0,
};

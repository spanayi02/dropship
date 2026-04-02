import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from "@react-email/components";
import { formatPrice } from "@/lib/utils";
import { STORE_NAME } from "../resend";

export interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: {
    title: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  orderUrl: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shippingCost,
  total,
  shippingAddress,
  orderUrl,
}: OrderConfirmationEmailProps) {
  const storeName = STORE_NAME;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Order {orderNumber} confirmed — thank you for shopping with {storeName}!
      </Preview>
      <Body style={body}>
        {/* ── Header ── */}
        <Section style={header}>
          <Text style={headerStoreName}>{storeName}</Text>
          <Text style={headerTagline}>Order Confirmed</Text>
        </Section>

        <Container style={container}>
          {/* ── Hero ── */}
          <Section style={heroSection}>
            {/* SVG checkmark circle */}
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
                      <div style={checkmarkWrapper}>
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ display: "block" }}
                        >
                          <circle cx="20" cy="20" r="20" fill="#10b981" />
                          <path
                            d="M12 20.5L17.5 26L28 15"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
            <Text style={heroHeading}>
              Thank you for your order, {customerName}!
            </Text>
            <Text style={heroSubtext}>
              We&apos;ve received your order and are getting it ready. You&apos;ll
              receive a shipping confirmation once it&apos;s on its way.
            </Text>
          </Section>

          {/* ── Order Number ── */}
          <Section style={orderNumberSection}>
            <Text style={orderNumberLabel}>Order number</Text>
            <Text style={orderNumberValue}>{orderNumber}</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Items ── */}
          <Section style={sectionPadding}>
            <Text style={sectionHeading}>Order Summary</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageCol}>
                  {item.image ? (
                    <Img
                      src={item.image}
                      alt={item.title}
                      width="64"
                      height="64"
                      style={itemImage}
                    />
                  ) : (
                    <div style={itemImagePlaceholder}>
                      <Text style={itemImagePlaceholderText}>
                        {item.title.charAt(0).toUpperCase()}
                      </Text>
                    </div>
                  )}
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemTitle}>{item.title}</Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                  {item.quantity > 1 && (
                    <Text style={itemUnitPrice}>
                      {formatPrice(item.price)} each
                    </Text>
                  )}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          {/* ── Order Totals ── */}
          <Section style={sectionPadding}>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValue}>{formatPrice(subtotal)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Shipping</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValue}>
                  {shippingCost === 0 ? (
                    <span style={{ color: "#10b981" }}>FREE</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </Text>
              </Column>
            </Row>
            <Hr style={summaryDivider} />
            <Row>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatPrice(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Shipping Address ── */}
          <Section style={sectionPadding}>
            <Text style={sectionHeading}>Shipping To</Text>
            <div style={addressBox}>
              <Text style={addressText}>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </Text>
              <Text style={addressText}>{shippingAddress.street}</Text>
              <Text style={addressText}>
                {shippingAddress.city}, {shippingAddress.state}{" "}
                {shippingAddress.postalCode}
              </Text>
              <Text style={addressText}>{shippingAddress.country}</Text>
            </div>
          </Section>

          {/* ── CTA ── */}
          <Section style={ctaSection}>
            <Button href={orderUrl} style={ctaButton}>
              Track Your Order
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

export default OrderConfirmationEmail;

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

const checkmarkWrapper: React.CSSProperties = {
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

const orderNumberSection: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #10b981",
  borderRadius: "0 6px 6px 0",
  margin: "0 40px 0",
  padding: "16px 20px",
};

const orderNumberLabel: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const orderNumberValue: React.CSSProperties = {
  color: "#14532d",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: "#f4f4f5",
  margin: "24px 0",
};

const sectionPadding: React.CSSProperties = {
  padding: "0 40px",
};

const sectionHeading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const itemRow: React.CSSProperties = {
  marginBottom: "16px",
};

const itemImageCol: React.CSSProperties = {
  width: "72px",
  verticalAlign: "top",
};

const itemImage: React.CSSProperties = {
  borderRadius: "6px",
  border: "1px solid #e4e4e7",
  display: "block",
  objectFit: "cover",
};

const itemImagePlaceholder: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  border: "1px solid #e4e4e7",
  width: "64px",
  height: "64px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const itemImagePlaceholderText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "22px",
  fontWeight: "700",
  margin: 0,
  textAlign: "center",
  lineHeight: "64px",
};

const itemDetailsCol: React.CSSProperties = {
  paddingLeft: "12px",
  verticalAlign: "top",
};

const itemTitle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
  lineHeight: "1.4",
};

const itemQty: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: 0,
};

const itemPriceCol: React.CSSProperties = {
  textAlign: "right",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const itemPrice: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const itemUnitPrice: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: 0,
};

const summaryRow: React.CSSProperties = {
  marginBottom: "8px",
};

const summaryLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: 0,
};

const summaryValue: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  margin: 0,
};

const summaryDivider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "12px 0",
};

const totalLabel: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "700",
  margin: 0,
};

const totalValue: React.CSSProperties = {
  color: "#18181b",
  fontSize: "18px",
  fontWeight: "700",
  margin: 0,
};

const addressBox: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  padding: "16px 20px",
};

const addressText: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 2px",
};

const ctaSection: React.CSSProperties = {
  padding: "32px 40px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
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

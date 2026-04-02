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

export interface WelcomeEmailProps {
  name: string;
  shopUrl: string;
}

export function WelcomeEmail({ name, shopUrl }: WelcomeEmailProps) {
  const storeName = STORE_NAME;
  const firstName = name.split(" ")[0];

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Welcome to {storeName}, {firstName}! Your account is ready — start
        discovering great products.
      </Preview>
      <Body style={body}>
        {/* ── Header ── */}
        <Section style={header}>
          <Text style={headerStoreName}>{storeName}</Text>
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
                      {/* Wave / welcome icon */}
                      <div style={emojiWrapper}>
                        <Text style={waveEmoji}>👋</Text>
                      </div>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
            <Text style={heroHeading}>Welcome, {firstName}!</Text>
            <Text style={heroSubtext}>
              Your {storeName} account is all set. We&apos;re thrilled to have
              you — discover thousands of curated products shipped straight to
              your door.
            </Text>
          </Section>

          {/* ── Features ── */}
          <Section style={featuresSection}>
            <Row style={featureRow}>
              <Column style={featureIconCol}>
                <div style={featureIconWrapper}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block" }}
                  >
                    <path
                      d="M3 4h14l-1.5 9H4.5L3 4z"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="7" cy="16" r="1.5" fill="#10b981" />
                    <circle cx="13" cy="16" r="1.5" fill="#10b981" />
                  </svg>
                </div>
              </Column>
              <Column style={featureTextCol}>
                <Text style={featureTitle}>Easy Shopping</Text>
                <Text style={featureDesc}>
                  Browse thousands of products with fast, reliable delivery.
                </Text>
              </Column>
            </Row>
            <Row style={featureRow}>
              <Column style={featureIconCol}>
                <div style={featureIconWrapper}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block" }}
                  >
                    <path
                      d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6l2-6z"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Column>
              <Column style={featureTextCol}>
                <Text style={featureTitle}>Curated Selection</Text>
                <Text style={featureDesc}>
                  Hand-picked products across every category you love.
                </Text>
              </Column>
            </Row>
            <Row style={featureRow}>
              <Column style={featureIconCol}>
                <div style={featureIconWrapper}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block" }}
                  >
                    <rect
                      x="2"
                      y="4"
                      width="16"
                      height="12"
                      rx="2"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M2 8h16"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M6 12h2M10 12h4"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </Column>
              <Column style={featureTextCol}>
                <Text style={featureTitle}>Secure Checkout</Text>
                <Text style={featureDesc}>
                  Payments are protected by Stripe — safe and encrypted.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── CTA ── */}
          <Section style={ctaSection}>
            <Button href={shopUrl} style={ctaButton}>
              Start Shopping
            </Button>
          </Section>

          {/* ── Divider + reassurance ── */}
          <Hr style={divider} />

          <Section style={reassuranceSection}>
            <Text style={reassuranceText}>
              Need help?{" "}
              <Link
                href={`mailto:support@${storeName.toLowerCase()}.com`}
                style={reassuranceLink}
              >
                Our team is here for you.
              </Link>
            </Text>
          </Section>

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Text style={footerStoreName}>{storeName}</Text>
            <Text style={footerUnsubscribe}>
              You received this email because you created an account with{" "}
              {storeName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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
  margin: 0,
  textTransform: "uppercase",
};

const heroSection: React.CSSProperties = {
  padding: "40px 40px 32px",
  textAlign: "center",
};

const emojiWrapper: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "16px",
};

const waveEmoji: React.CSSProperties = {
  fontSize: "48px",
  lineHeight: "1",
  margin: 0,
};

const heroHeading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0 0 12px",
};

const heroSubtext: React.CSSProperties = {
  color: "#71717a",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 auto",
  maxWidth: "420px",
};

const featuresSection: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderTop: "1px solid #f4f4f5",
  borderBottom: "1px solid #f4f4f5",
  padding: "24px 40px",
};

const featureRow: React.CSSProperties = {
  marginBottom: "20px",
};

const featureIconCol: React.CSSProperties = {
  width: "40px",
  verticalAlign: "top",
};

const featureIconWrapper: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #d1fae5",
  borderRadius: "8px",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
};

const featureTextCol: React.CSSProperties = {
  paddingLeft: "12px",
  verticalAlign: "top",
};

const featureTitle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const featureDesc: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
};

const ctaSection: React.CSSProperties = {
  padding: "36px 40px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "16px 40px",
  textDecoration: "none",
  letterSpacing: "0.2px",
};

const divider: React.CSSProperties = {
  borderColor: "#f4f4f5",
  margin: "0",
};

const reassuranceSection: React.CSSProperties = {
  padding: "20px 40px",
  textAlign: "center",
};

const reassuranceText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: 0,
};

const reassuranceLink: React.CSSProperties = {
  color: "#10b981",
  textDecoration: "none",
  fontWeight: "500",
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

const footerUnsubscribe: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: 0,
};

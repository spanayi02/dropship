import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Preview,
  Img,
} from "@react-email/components";
import { STORE_NAME } from "../resend";

export interface ReviewRequestEmailProps {
  customerName: string;
  orderNumber: string;
  items: { title: string; productId: string; image?: string }[];
}

export function ReviewRequestEmail({
  customerName,
  orderNumber,
  items,
}: ReviewRequestEmailProps) {
  const firstName = customerName.split(" ")[0];
  const shopUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        How was your order {orderNumber}? Leave a quick review and help others shop smarter.
      </Preview>
      <Body style={body}>
        <Section style={header}>
          <Text style={headerStoreName}>{STORE_NAME}</Text>
        </Section>

        <Container style={container}>
          <Section style={heroSection}>
            <Text style={starRow}>⭐⭐⭐⭐⭐</Text>
            <Text style={heroHeading}>How did we do, {firstName}?</Text>
            <Text style={heroSubtext}>
              Your order <strong>{orderNumber}</strong> was delivered a week ago.
              We&apos;d love to hear what you think — your review helps other
              shoppers and helps us keep improving.
            </Text>
          </Section>

          {items.slice(0, 3).map((item) => (
            <Section key={item.productId} style={itemRow}>
              {item.image && (
                <Img
                  src={item.image}
                  alt={item.title}
                  width={56}
                  height={56}
                  style={itemImage}
                />
              )}
              <div style={itemInfo}>
                <Text style={itemTitle}>{item.title}</Text>
                <Link
                  href={`${shopUrl}/products/${item.productId}#reviews`}
                  style={reviewLink}
                >
                  Leave a review →
                </Link>
              </div>
            </Section>
          ))}

          <Section style={ctaSection}>
            <Button href={`${shopUrl}/account/orders`} style={ctaButton}>
              View My Orders &amp; Leave Reviews
            </Button>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              You received this because you ordered from{" "}
              <Link href={shopUrl} style={footerLink}>
                {STORE_NAME}
              </Link>
              . Unsubscribe preferences available in your{" "}
              <Link href={`${shopUrl}/account`} style={footerLink}>
                account settings
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ReviewRequestEmail;

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
  padding: "40px 40px 24px",
  textAlign: "center",
};

const starRow: React.CSSProperties = {
  fontSize: "28px",
  letterSpacing: "4px",
  margin: "0 0 16px",
};

const heroHeading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "26px",
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

const itemRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "16px 40px",
  borderTop: "1px solid #f4f4f5",
};

const itemImage: React.CSSProperties = {
  borderRadius: "6px",
  objectFit: "cover",
  flexShrink: 0,
};

const itemInfo: React.CSSProperties = {
  paddingLeft: "16px",
};

const itemTitle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const reviewLink: React.CSSProperties = {
  color: "#10b981",
  fontSize: "13px",
  fontWeight: "500",
  textDecoration: "none",
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
  padding: "14px 36px",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#f4f4f5",
  margin: 0,
};

const footerSection: React.CSSProperties = {
  padding: "20px 40px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: "#71717a",
  textDecoration: "underline",
};

import type { Locale } from "@/lib/i18n";

/**
 * Content for the store's information and legal pages.
 *
 * Anything the owner must supply is written as a [[PLACEHOLDER]] marker and
 * rendered as a highlighted chip, so an unfilled detail is impossible to miss
 * rather than quietly shipping as invented text. Fill these in before taking
 * real orders — see README, "Before you take real orders".
 *
 * The consumer-rights text follows EU Directive 2011/83/EU (14-day right of
 * withdrawal) and the GDPR. It is a working baseline, not legal advice: have
 * it reviewed before a full launch.
 */

export type LegalSlug =
  | "about"
  | "contact"
  | "faq"
  | "shipping"
  | "returns"
  | "privacy"
  | "terms"
  | "cookies";

export const LEGAL_SLUGS: LegalSlug[] = [
  "about",
  "contact",
  "faq",
  "shipping",
  "returns",
  "privacy",
  "terms",
  "cookies",
];

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/** Date the wording below was last revised. Bump it when you edit the text. */
export const LEGAL_LAST_UPDATED = "2026-09-22";

const EN: Record<LegalSlug, LegalPage> = {
  about: {
    title: "About WishlistAZ",
    intro:
      "A short, hand-checked catalogue instead of a marketplace with fifty thousand near-identical listings.",
    sections: [
      {
        heading: "What we do",
        body: [
          "We pick a small number of products across electronics, home, fashion, sports and beauty, check that each one has a supplier we can actually reach, and price it from the real supplier cost rather than from a number that makes a discount badge look good.",
          "Most of what we sell ships from a warehouse inside the EU, which is why orders usually arrive in a few working days without a customs bill at the door.",
        ],
      },
      {
        heading: "How we choose",
        body: [
          "A product goes on the site only when a supplier passes a check: they answer messages, they hold stock they say they hold, and their shipping times survive contact with reality. When a supplier stops meeting that, the product comes off.",
          "We do not run a fake sale. A struck-through price is a price the product actually sold at.",
        ],
      },
      {
        heading: "Who runs it",
        body: [
          "WishlistAZ is operated by [[COMPANY_LEGAL_NAME]], registered in [[COMPANY_REGISTRATION_COUNTRY]] under company number [[COMPANY_NUMBER]], VAT [[VAT_NUMBER]], at [[COMPANY_ADDRESS]].",
          "Support email is answered by a person, not a ticket robot.",
        ],
      },
    ],
  },

  contact: {
    title: "Contact us",
    intro: "One inbox, answered by a person, usually within one working day.",
    sections: [
      {
        heading: "Email",
        body: [
          "[[SUPPORT_EMAIL]] for anything: an order, a return, a question before you buy, or a problem with the site.",
          "If you are writing about an existing order, include the order number. It is in your confirmation email and in your account under Orders.",
        ],
      },
      {
        heading: "When we reply",
        body: [
          "Monday to Friday, [[SUPPORT_HOURS]]. Messages sent over the weekend are answered on the next working day.",
        ],
      },
      {
        heading: "Postal address",
        body: [
          "[[COMPANY_LEGAL_NAME]], [[COMPANY_ADDRESS]].",
          "Please do not send returns to this address without emailing first: returns are collected at the address we give you in the return instructions, which depends on the supplier that shipped your order.",
        ],
      },
    ],
  },

  faq: {
    title: "Frequently asked questions",
    intro: "The questions we actually get asked, answered plainly.",
    sections: [
      {
        heading: "How long does delivery take?",
        body: [
          "Most orders ship from an EU warehouse and arrive within 3 to 7 working days. A few products ship from further away and say so on the product page, with their own delivery estimate. We show the estimate for the supplier that will actually fulfil your order, not a generic promise.",
        ],
      },
      {
        heading: "Do I pay customs or import VAT?",
        body: [
          "Not on orders that ship from inside the EU, which is most of them. Where a product ships from outside the EU, the product page says so and VAT is settled at checkout, so nothing is collected at your door.",
        ],
      },
      {
        heading: "Can I change or cancel an order?",
        body: [
          "Email us as soon as possible. If the supplier has not dispatched it yet we can usually stop it. Once it has shipped, the 14-day right of withdrawal applies instead, which is explained on the returns page.",
        ],
      },
      {
        heading: "Do you ship outside the EU?",
        body: [
          "Currently we ship to [[SHIPPING_COUNTRIES]]. If your country is not on the list, the checkout will tell you before you pay.",
        ],
      },
      {
        heading: "Is my card safe?",
        body: [
          "Payments are handled by Stripe. Card details are entered on Stripe's own checkout and never reach our servers.",
        ],
      },
    ],
  },

  shipping: {
    title: "Shipping",
    intro: "What it costs, how long it takes, and what happens if it goes wrong.",
    sections: [
      {
        heading: "Cost",
        body: [
          "Flat-rate shipping applies to every order, and shipping is free above the threshold shown in the header and at checkout. The exact amount for your basket is always shown before you pay.",
        ],
      },
      {
        heading: "Dispatch and delivery",
        body: [
          "Orders are passed to the supplier the same working day where possible. Dispatch normally happens within one working day, and delivery within 3 to 7 working days for EU-warehouse products.",
          "Each product page shows the dispatch and transit time for the supplier that will fulfil it, so you can see the real estimate before you buy.",
        ],
      },
      {
        heading: "Tracking",
        body: [
          "You get an email with a tracking number as soon as the parcel is scanned by the carrier. You can also follow the order in your account under Orders.",
        ],
      },
      {
        heading: "If a parcel is late or lost",
        body: [
          "Email [[SUPPORT_EMAIL]] with the order number. If tracking has not moved for seven working days we chase the carrier and, if it cannot be found, we reship or refund. You do not have to argue with the courier yourself.",
        ],
      },
      {
        heading: "Split deliveries",
        body: [
          "An order containing products from different suppliers may arrive in more than one parcel, at no extra cost to you. Each parcel gets its own tracking number.",
        ],
      },
    ],
  },

  returns: {
    title: "Returns and right of withdrawal",
    intro:
      "You have 14 days to change your mind, as EU consumer law requires, plus your statutory rights if something is faulty.",
    sections: [
      {
        heading: "Your 14-day right of withdrawal",
        body: [
          "Under EU Directive 2011/83/EU you may withdraw from your purchase within 14 days of receiving the goods, without giving a reason. To do so, tell us clearly before the 14 days are up, by email to [[SUPPORT_EMAIL]].",
          "After telling us, you have a further 14 days to send the goods back. We refund within 14 days of receiving the goods back, or of proof that you sent them, whichever comes first.",
        ],
      },
      {
        heading: "What you get back",
        body: [
          "The price of the goods plus the standard delivery cost you originally paid. If you chose a more expensive delivery option, we refund the standard rate.",
          "The refund goes back to the payment method you used. We do not charge a restocking fee.",
        ],
      },
      {
        heading: "Who pays return postage",
        body: [
          "You pay the cost of sending the goods back, unless the item is faulty, damaged or not what was ordered. In that case we pay, and we send you a prepaid label.",
        ],
      },
      {
        heading: "Condition of returned goods",
        body: [
          "You may handle the goods as you would in a shop. If the goods lose value because you handled them beyond that, we may reduce the refund accordingly.",
        ],
      },
      {
        heading: "Exceptions",
        body: [
          "The right of withdrawal does not apply to sealed goods that are not suitable for return for health or hygiene reasons once unsealed, to goods made to your specification, or to sealed audio or video recordings and software once unsealed. This is the standard list in Article 16 of the Directive.",
        ],
      },
      {
        heading: "If something is faulty",
        body: [
          "Separately from the 14-day right, you have a statutory guarantee: goods must match their description and be fit for purpose. If something arrives faulty, email us with a photo and we will repair, replace or refund. This right lasts two years from delivery.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    intro: "What we collect, why we collect it, and what you can make us do about it.",
    sections: [
      {
        heading: "Who is responsible",
        body: [
          "The data controller is [[COMPANY_LEGAL_NAME]], [[COMPANY_ADDRESS]]. For any question about your data, write to [[PRIVACY_EMAIL]].",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "When you order: your name, email, delivery address, phone number if you give one, and what you bought. We need this to fulfil the contract with you.",
          "When you create an account: the same, plus a password we store only as a hash, never in readable form.",
          "Automatically: basic technical data such as your IP address and browser, used to keep the site working and secure.",
          "We never see or store your card number. Payment details go directly to Stripe.",
        ],
      },
      {
        heading: "Why we are allowed to",
        body: [
          "To perform the contract when you order, which covers processing and delivering it. For our legitimate interest in preventing fraud and keeping the site up. To comply with the law, which is why invoices are kept for the statutory period. And on your consent for the newsletter and for non-essential cookies, either of which you can withdraw at any time.",
        ],
      },
      {
        heading: "Who else sees it",
        body: [
          "The supplier who ships your order receives the delivery address, because otherwise the parcel cannot arrive. Stripe processes payment. Our email provider sends order and shipping notifications. Our hosting provider runs the site.",
          "We do not sell your data, and we do not share it for anyone else's advertising.",
        ],
      },
      {
        heading: "Transfers outside the EU",
        body: [
          "Some suppliers are outside the EU. Where your delivery address is sent to them, the transfer is covered by the European Commission's standard contractual clauses, and only the data needed to deliver the parcel is sent.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Order records for the statutory retention period of [[RETENTION_YEARS]] years. Account data until you delete the account. Newsletter data until you unsubscribe.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask for a copy of your data, correct it, have it deleted, restrict or object to processing, and receive it in a portable format. Write to [[PRIVACY_EMAIL]] and we answer within one month.",
          "You can also complain to your national data protection authority. In Cyprus that is the Office of the Commissioner for Personal Data Protection.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms and conditions",
    intro: "The agreement between you and us when you buy something here.",
    sections: [
      {
        heading: "Who you are contracting with",
        body: [
          "These terms apply to every order placed on this site, operated by [[COMPANY_LEGAL_NAME]], company number [[COMPANY_NUMBER]], VAT [[VAT_NUMBER]], at [[COMPANY_ADDRESS]].",
        ],
      },
      {
        heading: "When the contract is formed",
        body: [
          "Your order is an offer to buy. The contract exists once we send you the order confirmation email. If we cannot fulfil an order, for example because a supplier turns out to be out of stock, we tell you and refund in full.",
        ],
      },
      {
        heading: "Prices",
        body: [
          "Prices are in euro and include VAT at the applicable rate. Delivery cost is shown separately before you pay. We try hard to keep prices correct; if an obvious pricing error slips through, we may cancel the order and refund you rather than hold you to it.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "Payment is taken at checkout through Stripe. We accept the cards and methods shown at checkout.",
        ],
      },
      {
        heading: "Delivery and risk",
        body: [
          "Delivery estimates are estimates, not guarantees. Risk in the goods passes to you when you, or someone you nominate, takes physical possession of them.",
        ],
      },
      {
        heading: "Cancellation and returns",
        body: [
          "Your 14-day right of withdrawal and your statutory guarantee are set out on the returns page, which forms part of these terms.",
        ],
      },
      {
        heading: "Our liability",
        body: [
          "Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law. Otherwise our liability for any order is limited to the amount you paid for it.",
        ],
      },
      {
        heading: "Governing law and disputes",
        body: [
          "These terms are governed by the law of [[GOVERNING_LAW_COUNTRY]], without removing any protection you have under the mandatory consumer law of the country you live in.",
          "You can also use the European Commission's online dispute resolution platform at ec.europa.eu/consumers/odr.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookies",
    intro: "What we store on your device, and how to say no to the optional parts.",
    sections: [
      {
        heading: "Strictly necessary",
        body: [
          "These make the site work and cannot be switched off: the session cookie that keeps you signed in, the cookie that remembers your cart, the one that remembers whether you chose English or Greek, and the record of your cookie choice itself.",
          "No consent is required for these, because without them the site cannot do what you asked it to do.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "We use analytics only if you accept it. It tells us which pages people actually use, in aggregate. Decline and none of it is set.",
        ],
      },
      {
        heading: "Marketing",
        body: [
          "We do not set advertising or cross-site tracking cookies.",
        ],
      },
      {
        heading: "Changing your mind",
        body: [
          "Use the cookie settings link in the footer at any time. You can also clear cookies in your browser, which resets the banner.",
        ],
      },
    ],
  },
};

const EL: Record<LegalSlug, LegalPage> = {
  about: {
    title: "Σχετικά με το WishlistAZ",
    intro:
      "Μια σύντομη, ελεγμένη λίστα προϊόντων αντί για μια αγορά με πενήντα χιλιάδες σχεδόν πανομοιότυπες καταχωρίσεις.",
    sections: [
      {
        heading: "Τι κάνουμε",
        body: [
          "Διαλέγουμε λίγα προϊόντα σε ηλεκτρονικά, σπίτι, μόδα, αθλητικά και ομορφιά, ελέγχουμε ότι το καθένα έχει προμηθευτή που απαντάει πραγματικά, και το τιμολογούμε από το πραγματικό κόστος και όχι από έναν αριθμό που κάνει την έκπτωση να φαίνεται μεγάλη.",
          "Τα περισσότερα φεύγουν από αποθήκη μέσα στην ΕΕ, γι' αυτό και οι παραγγελίες φτάνουν συνήθως σε λίγες εργάσιμες χωρίς λογαριασμό τελωνείου στην πόρτα.",
        ],
      },
      {
        heading: "Πώς επιλέγουμε",
        body: [
          "Ένα προϊόν μπαίνει στο site μόνο όταν ο προμηθευτής περάσει έλεγχο: απαντάει σε μηνύματα, έχει όντως το στοκ που λέει, και οι χρόνοι αποστολής του αντέχουν στην πράξη. Όταν πάψει να ισχύει αυτό, το προϊόν βγαίνει.",
          "Δεν κάνουμε ψεύτικες προσφορές. Μια διαγραμμένη τιμή είναι τιμή στην οποία πουλήθηκε πραγματικά το προϊόν.",
        ],
      },
      {
        heading: "Ποιος το λειτουργεί",
        body: [
          "Το WishlistAZ λειτουργεί από την [[COMPANY_LEGAL_NAME]], εγγεγραμμένη στην [[COMPANY_REGISTRATION_COUNTRY]] με αριθμό μητρώου [[COMPANY_NUMBER]], ΑΦΜ [[VAT_NUMBER]], με έδρα [[COMPANY_ADDRESS]].",
          "Στα email υποστήριξης απαντάει άνθρωπος.",
        ],
      },
    ],
  },

  contact: {
    title: "Επικοινωνία",
    intro: "Ένα inbox, απαντάει άνθρωπος, συνήθως μέσα σε μία εργάσιμη.",
    sections: [
      {
        heading: "Email",
        body: [
          "[[SUPPORT_EMAIL]] για οτιδήποτε: παραγγελία, επιστροφή, απορία πριν αγοράσεις ή πρόβλημα με το site.",
          "Αν γράφεις για υπάρχουσα παραγγελία, βάλε τον αριθμό παραγγελίας. Είναι στο email επιβεβαίωσης και στον λογαριασμό σου, στις Παραγγελίες.",
        ],
      },
      {
        heading: "Πότε απαντάμε",
        body: [
          "Δευτέρα έως Παρασκευή, [[SUPPORT_HOURS]]. Ό,τι σταλεί το σαββατοκύριακο απαντιέται την επόμενη εργάσιμη.",
        ],
      },
      {
        heading: "Ταχυδρομική διεύθυνση",
        body: [
          "[[COMPANY_LEGAL_NAME]], [[COMPANY_ADDRESS]].",
          "Μη στείλεις επιστροφή σε αυτή τη διεύθυνση χωρίς να μας γράψεις πρώτα: οι επιστροφές παραλαμβάνονται στη διεύθυνση που σου δίνουμε στις οδηγίες επιστροφής, και εξαρτάται από τον προμηθευτή που έστειλε την παραγγελία.",
        ],
      },
    ],
  },

  faq: {
    title: "Συχνές ερωτήσεις",
    intro: "Οι ερωτήσεις που μας κάνουν πραγματικά, με ξεκάθαρες απαντήσεις.",
    sections: [
      {
        heading: "Πόσο κάνει να έρθει;",
        body: [
          "Οι περισσότερες παραγγελίες φεύγουν από αποθήκη στην ΕΕ και φτάνουν σε 3 με 7 εργάσιμες. Λίγα προϊόντα φεύγουν από πιο μακριά και το λένε στη σελίδα τους, με δική τους εκτίμηση παράδοσης. Δείχνουμε την εκτίμηση του προμηθευτή που θα εκτελέσει όντως την παραγγελία σου.",
        ],
      },
      {
        heading: "Θα πληρώσω τελωνείο ή ΦΠΑ εισαγωγής;",
        body: [
          "Όχι σε παραγγελίες που φεύγουν μέσα από την ΕΕ, δηλαδή στις περισσότερες. Όπου ένα προϊόν φεύγει εκτός ΕΕ, η σελίδα του το λέει και ο ΦΠΑ τακτοποιείται στο ταμείο, οπότε δεν σου ζητείται τίποτα στην πόρτα.",
        ],
      },
      {
        heading: "Μπορώ να αλλάξω ή να ακυρώσω παραγγελία;",
        body: [
          "Γράψε μας όσο πιο γρήγορα γίνεται. Αν ο προμηθευτής δεν την έχει στείλει ακόμα, συνήθως προλαβαίνουμε. Αφού φύγει, ισχύει το δικαίωμα υπαναχώρησης 14 ημερών, που εξηγείται στη σελίδα επιστροφών.",
        ],
      },
      {
        heading: "Στέλνετε εκτός ΕΕ;",
        body: [
          "Προς το παρόν στέλνουμε σε [[SHIPPING_COUNTRIES]]. Αν η χώρα σου δεν είναι στη λίστα, το ταμείο θα σου το πει πριν πληρώσεις.",
        ],
      },
      {
        heading: "Είναι ασφαλής η κάρτα μου;",
        body: [
          "Οι πληρωμές γίνονται μέσω Stripe. Τα στοιχεία της κάρτας μπαίνουν στο δικό τους ταμείο και δεν φτάνουν ποτέ στους δικούς μας servers.",
        ],
      },
    ],
  },

  shipping: {
    title: "Αποστολές",
    intro: "Τι κοστίζει, πόσο κάνει, και τι γίνεται αν κάτι πάει στραβά.",
    sections: [
      {
        heading: "Κόστος",
        body: [
          "Ισχύει ενιαία χρέωση αποστολής, και η αποστολή είναι δωρεάν πάνω από το όριο που φαίνεται στην κορυφή και στο ταμείο. Το ακριβές ποσό για το καλάθι σου φαίνεται πάντα πριν πληρώσεις.",
        ],
      },
      {
        heading: "Αποστολή και παράδοση",
        body: [
          "Οι παραγγελίες περνούν στον προμηθευτή την ίδια εργάσιμη όπου γίνεται. Η αποστολή γίνεται συνήθως μέσα σε μία εργάσιμη και η παράδοση σε 3 με 7 εργάσιμες για προϊόντα από αποθήκη ΕΕ.",
          "Κάθε σελίδα προϊόντος δείχνει τον χρόνο αποστολής και μεταφοράς του προμηθευτή που θα το εκτελέσει.",
        ],
      },
      {
        heading: "Παρακολούθηση",
        body: [
          "Λαμβάνεις email με αριθμό αποστολής μόλις το δέμα σκαναριστεί από τον μεταφορέα. Μπορείς επίσης να δεις την παραγγελία στον λογαριασμό σου.",
        ],
      },
      {
        heading: "Αν αργήσει ή χαθεί",
        body: [
          "Γράψε στο [[SUPPORT_EMAIL]] με τον αριθμό παραγγελίας. Αν το tracking δεν έχει κουνηθεί για επτά εργάσιμες, κυνηγάμε εμείς τον μεταφορέα και, αν δεν βρεθεί, ξαναστέλνουμε ή επιστρέφουμε τα χρήματα. Δεν χρειάζεται να τσακωθείς εσύ με την courier.",
        ],
      },
      {
        heading: "Χωριστές παραδόσεις",
        body: [
          "Παραγγελία με προϊόντα από διαφορετικούς προμηθευτές μπορεί να έρθει σε παραπάνω από ένα δέματα, χωρίς επιπλέον χρέωση. Κάθε δέμα έχει δικό του αριθμό αποστολής.",
        ],
      },
    ],
  },

  returns: {
    title: "Επιστροφές και δικαίωμα υπαναχώρησης",
    intro:
      "Έχεις 14 ημέρες να αλλάξεις γνώμη, όπως ορίζει το ευρωπαϊκό δίκαιο καταναλωτή, και επιπλέον τα νόμιμα δικαιώματά σου αν κάτι είναι ελαττωματικό.",
    sections: [
      {
        heading: "Το δικαίωμα υπαναχώρησης 14 ημερών",
        body: [
          "Βάσει της Οδηγίας 2011/83/ΕΕ μπορείς να υπαναχωρήσεις μέσα σε 14 ημέρες από την παραλαβή, χωρίς να δώσεις λόγο. Αρκεί να μας το δηλώσεις ξεκάθαρα πριν περάσουν οι 14 ημέρες, με email στο [[SUPPORT_EMAIL]].",
          "Αφού μας ενημερώσεις, έχεις άλλες 14 ημέρες να στείλεις πίσω τα προϊόντα. Επιστρέφουμε τα χρήματα μέσα σε 14 ημέρες από την παραλαβή τους ή από την απόδειξη ότι τα έστειλες, όποιο γίνει πρώτο.",
        ],
      },
      {
        heading: "Τι παίρνεις πίσω",
        body: [
          "Την αξία των προϊόντων συν το κόστος της βασικής αποστολής που πλήρωσες. Αν διάλεξες ακριβότερη μέθοδο, επιστρέφουμε το ποσό της βασικής.",
          "Η επιστροφή γίνεται στον τρόπο πληρωμής που χρησιμοποίησες. Δεν χρεώνουμε τέλος επαναποθήκευσης.",
        ],
      },
      {
        heading: "Ποιος πληρώνει την επιστροφή",
        body: [
          "Τα έξοδα αποστολής πίσω τα καλύπτεις εσύ, εκτός αν το προϊόν είναι ελαττωματικό, χτυπημένο ή λάθος. Σε αυτή την περίπτωση τα καλύπτουμε εμείς και σου στέλνουμε προπληρωμένο voucher.",
        ],
      },
      {
        heading: "Κατάσταση προϊόντων",
        body: [
          "Μπορείς να χειριστείς τα προϊόντα όπως θα έκανες σε κατάστημα. Αν χάσουν αξία επειδή τα χειρίστηκες πέραν αυτού, μπορούμε να μειώσουμε ανάλογα την επιστροφή.",
        ],
      },
      {
        heading: "Εξαιρέσεις",
        body: [
          "Το δικαίωμα υπαναχώρησης δεν ισχύει για σφραγισμένα προϊόντα που δεν επιστρέφονται για λόγους υγείας ή υγιεινής αφού ανοιχτούν, για προϊόντα φτιαγμένα στις προδιαγραφές σου, και για σφραγισμένες εγγραφές ήχου, εικόνας ή λογισμικό αφού ανοιχτούν. Είναι η τυπική λίστα του άρθρου 16 της Οδηγίας.",
        ],
      },
      {
        heading: "Αν κάτι είναι ελαττωματικό",
        body: [
          "Ανεξάρτητα από τις 14 ημέρες, έχεις νόμιμη εγγύηση: τα προϊόντα πρέπει να ανταποκρίνονται στην περιγραφή και να είναι κατάλληλα για τη χρήση τους. Αν κάτι έρθει ελαττωματικό, στείλε μας φωτογραφία και επισκευάζουμε, αντικαθιστούμε ή επιστρέφουμε χρήματα. Το δικαίωμα αυτό ισχύει για δύο χρόνια από την παράδοση.",
        ],
      },
    ],
  },

  privacy: {
    title: "Πολιτική απορρήτου",
    intro: "Τι συλλέγουμε, γιατί, και τι μπορείς να μας υποχρεώσεις να κάνουμε.",
    sections: [
      {
        heading: "Ποιος είναι υπεύθυνος",
        body: [
          "Υπεύθυνος επεξεργασίας είναι η [[COMPANY_LEGAL_NAME]], [[COMPANY_ADDRESS]]. Για οτιδήποτε αφορά τα δεδομένα σου, γράψε στο [[PRIVACY_EMAIL]].",
        ],
      },
      {
        heading: "Τι συλλέγουμε",
        body: [
          "Όταν παραγγέλνεις: όνομα, email, διεύθυνση παράδοσης, τηλέφωνο αν το δώσεις, και τι αγόρασες. Τα χρειαζόμαστε για να εκτελέσουμε τη σύμβαση.",
          "Όταν φτιάχνεις λογαριασμό: τα ίδια, συν κωδικό που αποθηκεύεται μόνο ως hash, ποτέ σε αναγνώσιμη μορφή.",
          "Αυτόματα: βασικά τεχνικά δεδομένα όπως η IP και ο browser, για να δουλεύει και να είναι ασφαλές το site.",
          "Δεν βλέπουμε ούτε αποθηκεύουμε ποτέ τον αριθμό της κάρτας σου. Πάει απευθείας στη Stripe.",
        ],
      },
      {
        heading: "Με ποια νομική βάση",
        body: [
          "Για την εκτέλεση της σύμβασης όταν παραγγέλνεις. Για το έννομο συμφέρον μας να αποτρέπουμε απάτες και να κρατάμε το site όρθιο. Για συμμόρφωση με τον νόμο, γι' αυτό και τα παραστατικά κρατιούνται για τη νόμιμη περίοδο. Και με τη συγκατάθεσή σου για το newsletter και για τα μη απαραίτητα cookies, που μπορείς να ανακαλέσεις οποτεδήποτε.",
        ],
      },
      {
        heading: "Ποιος άλλος τα βλέπει",
        body: [
          "Ο προμηθευτής που στέλνει την παραγγελία σου λαμβάνει τη διεύθυνση παράδοσης, αλλιώς δεν μπορεί να φτάσει το δέμα. Η Stripe επεξεργάζεται την πληρωμή. Ο πάροχος email στέλνει τις ειδοποιήσεις. Ο πάροχος φιλοξενίας τρέχει το site.",
          "Δεν πουλάμε τα δεδομένα σου και δεν τα μοιραζόμαστε για διαφήμιση τρίτων.",
        ],
      },
      {
        heading: "Διαβιβάσεις εκτός ΕΕ",
        body: [
          "Κάποιοι προμηθευτές είναι εκτός ΕΕ. Όπου στέλνεται σε αυτούς η διεύθυνση παράδοσης, η διαβίβαση καλύπτεται από τις τυποποιημένες συμβατικές ρήτρες της Ευρωπαϊκής Επιτροπής και στέλνονται μόνο τα δεδομένα που χρειάζονται για την παράδοση.",
        ],
      },
      {
        heading: "Πόσο τα κρατάμε",
        body: [
          "Τα παραστατικά παραγγελιών για τη νόμιμη περίοδο των [[RETENTION_YEARS]] ετών. Τα δεδομένα λογαριασμού μέχρι να τον διαγράψεις. Τα δεδομένα newsletter μέχρι να διαγραφείς.",
        ],
      },
      {
        heading: "Τα δικαιώματά σου",
        body: [
          "Μπορείς να ζητήσεις αντίγραφο των δεδομένων σου, διόρθωση, διαγραφή, περιορισμό ή εναντίωση στην επεξεργασία, και φορητότητα. Γράψε στο [[PRIVACY_EMAIL]] και απαντάμε εντός ενός μήνα.",
          "Μπορείς επίσης να υποβάλεις καταγγελία στην εθνική αρχή προστασίας δεδομένων. Στην Κύπρο είναι το Γραφείο Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα.",
        ],
      },
    ],
  },

  terms: {
    title: "Όροι χρήσης",
    intro: "Η συμφωνία ανάμεσα σε εσένα και εμάς όταν αγοράζεις από εδώ.",
    sections: [
      {
        heading: "Με ποιον συμβάλλεσαι",
        body: [
          "Οι όροι ισχύουν για κάθε παραγγελία στο site, που λειτουργεί από την [[COMPANY_LEGAL_NAME]], αριθμός μητρώου [[COMPANY_NUMBER]], ΑΦΜ [[VAT_NUMBER]], έδρα [[COMPANY_ADDRESS]].",
        ],
      },
      {
        heading: "Πότε καταρτίζεται η σύμβαση",
        body: [
          "Η παραγγελία σου είναι πρόταση για αγορά. Η σύμβαση υπάρχει μόλις σου στείλουμε το email επιβεβαίωσης. Αν δεν μπορούμε να εκτελέσουμε μια παραγγελία, για παράδειγμα επειδή ο προμηθευτής τελικά δεν έχει στοκ, σου το λέμε και επιστρέφουμε ολόκληρο το ποσό.",
        ],
      },
      {
        heading: "Τιμές",
        body: [
          "Οι τιμές είναι σε ευρώ και περιλαμβάνουν ΦΠΑ με τον ισχύοντα συντελεστή. Το κόστος αποστολής φαίνεται χωριστά πριν πληρώσεις. Προσπαθούμε να κρατάμε τις τιμές σωστές· αν περάσει προφανές λάθος τιμής, μπορούμε να ακυρώσουμε την παραγγελία και να σε αποζημιώσουμε αντί να σε δεσμεύσουμε.",
        ],
      },
      {
        heading: "Πληρωμή",
        body: [
          "Η πληρωμή γίνεται στο ταμείο μέσω Stripe. Δεχόμαστε τις κάρτες και τις μεθόδους που φαίνονται στο ταμείο.",
        ],
      },
      {
        heading: "Παράδοση και κίνδυνος",
        body: [
          "Οι χρόνοι παράδοσης είναι εκτιμήσεις, όχι εγγυήσεις. Ο κίνδυνος των προϊόντων περνά σε εσένα όταν εσύ, ή όποιος ορίσεις, τα παραλάβει.",
        ],
      },
      {
        heading: "Ακύρωση και επιστροφές",
        body: [
          "Το δικαίωμα υπαναχώρησης 14 ημερών και η νόμιμη εγγύηση περιγράφονται στη σελίδα επιστροφών, που αποτελεί μέρος αυτών των όρων.",
        ],
      },
      {
        heading: "Η ευθύνη μας",
        body: [
          "Τίποτα εδώ δεν περιορίζει ευθύνη για θάνατο ή σωματική βλάβη από αμέλεια, για απάτη, ή για οτιδήποτε άλλο δεν επιτρέπεται να περιοριστεί από τον νόμο. Κατά τα λοιπά, η ευθύνη μας για κάθε παραγγελία περιορίζεται στο ποσό που πλήρωσες γι' αυτήν.",
        ],
      },
      {
        heading: "Εφαρμοστέο δίκαιο και διαφορές",
        body: [
          "Οι όροι διέπονται από το δίκαιο της [[GOVERNING_LAW_COUNTRY]], χωρίς να αφαιρείται καμία προστασία που σου δίνει το αναγκαστικό δίκαιο καταναλωτή της χώρας διαμονής σου.",
          "Μπορείς επίσης να χρησιμοποιήσεις την πλατφόρμα ηλεκτρονικής επίλυσης διαφορών της Ευρωπαϊκής Επιτροπής, στο ec.europa.eu/consumers/odr.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookies",
    intro: "Τι αποθηκεύουμε στη συσκευή σου, και πώς λες όχι στα προαιρετικά.",
    sections: [
      {
        heading: "Απολύτως απαραίτητα",
        body: [
          "Κάνουν το site να δουλεύει και δεν απενεργοποιούνται: το cookie συνεδρίας που σε κρατά συνδεδεμένο, αυτό που θυμάται το καλάθι, αυτό που θυμάται αν διάλεξες ελληνικά ή αγγλικά, και η ίδια η καταγραφή της επιλογής σου για τα cookies.",
          "Δεν απαιτείται συγκατάθεση γι' αυτά, γιατί χωρίς αυτά το site δεν μπορεί να κάνει αυτό που του ζήτησες.",
        ],
      },
      {
        heading: "Στατιστικά",
        body: [
          "Χρησιμοποιούμε στατιστικά μόνο αν τα αποδεχτείς. Μας λένε ποιες σελίδες χρησιμοποιούνται πραγματικά, συγκεντρωτικά. Αν αρνηθείς, δεν μπαίνει κανένα.",
        ],
      },
      {
        heading: "Μάρκετινγκ",
        body: [
          "Δεν βάζουμε cookies διαφήμισης ή παρακολούθησης μεταξύ ιστότοπων.",
        ],
      },
      {
        heading: "Αν αλλάξεις γνώμη",
        body: [
          "Χρησιμοποίησε τον σύνδεσμο ρυθμίσεων cookies στο υποσέλιδο οποτεδήποτε. Μπορείς επίσης να καθαρίσεις τα cookies από τον browser, που επαναφέρει το μήνυμα.",
        ],
      },
    ],
  },
};

const BY_LOCALE: Record<Locale, Record<LegalSlug, LegalPage>> = { en: EN, el: EL };

export function getLegalPage(slug: LegalSlug, locale: Locale): LegalPage {
  return BY_LOCALE[locale][slug];
}

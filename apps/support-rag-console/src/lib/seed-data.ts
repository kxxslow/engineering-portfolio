import type {
  KnowledgeArticle,
  ReviewDecision,
  SourceChunk,
  SupportTicket
} from "./rag";

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "kb-returns",
    title: "Returns and refunds policy",
    category: "Orders",
    owner: "Support Ops",
    updatedAt: "2026-08-01T09:00:00-07:00",
    status: "published"
  },
  {
    id: "kb-discounts",
    title: "Promotions and discount handling",
    category: "Checkout",
    owner: "Revenue Ops",
    updatedAt: "2026-08-03T11:15:00-07:00",
    status: "published"
  },
  {
    id: "kb-shipping",
    title: "Shipping exception playbook",
    category: "Fulfillment",
    owner: "Fulfillment Ops",
    updatedAt: "2026-07-26T15:20:00-07:00",
    status: "published"
  },
  {
    id: "kb-damaged-items",
    title: "Damaged item replacement",
    category: "Orders",
    owner: "Care Quality",
    updatedAt: "2026-08-04T14:10:00-07:00",
    status: "published"
  },
  {
    id: "kb-warranty",
    title: "Warranty eligibility guide",
    category: "Product Support",
    owner: "Product Care",
    updatedAt: "2026-07-22T10:05:00-07:00",
    status: "published"
  },
  {
    id: "kb-gift-cards",
    title: "Gift card balance policy",
    category: "Checkout",
    owner: "Revenue Ops",
    updatedAt: "2026-07-18T16:40:00-07:00",
    status: "published"
  },
  {
    id: "kb-invoices",
    title: "Invoice and VAT receipts",
    category: "Billing",
    owner: "Billing Ops",
    updatedAt: "2026-08-02T08:45:00-07:00",
    status: "published"
  },
  {
    id: "kb-address-change",
    title: "Address changes before shipment",
    category: "Fulfillment",
    owner: "Fulfillment Ops",
    updatedAt: "2026-07-12T13:35:00-07:00",
    status: "published"
  },
  {
    id: "kb-exchanges",
    title: "Exchange size policy",
    category: "Orders",
    owner: "Support Ops",
    updatedAt: "2026-07-08T12:25:00-07:00",
    status: "published"
  }
];

export const sourceChunks: SourceChunk[] = [
  {
    id: "chunk-return-window",
    articleId: "kb-returns",
    heading: "Return window",
    content:
      "Unused items can be returned within 30 days of delivery. Agents should confirm the order number or receipt before authorizing a return.",
    keywords: ["return", "refund", "days", "receipt", "order", "unused"],
    facts: [
      {
        id: "fact-return-window-30",
        statement: "Unused items can be returned within 30 days of delivery."
      },
      {
        id: "fact-return-receipt-required",
        statement: "Agents should confirm the order number or receipt before authorizing a return."
      }
    ]
  },
  {
    id: "chunk-refund-method",
    articleId: "kb-returns",
    heading: "Refund method",
    content:
      "After the returned item passes inspection, refunds are issued to the original payment method. Support must not promise instant refunds.",
    keywords: ["refund", "payment", "inspection", "return", "method"],
    facts: [
      {
        id: "fact-refund-original-method",
        statement: "Refunds are issued to the original payment method after inspection."
      },
      {
        id: "fact-no-instant-refund-promise",
        statement: "Support must not promise instant refunds."
      }
    ]
  },
  {
    id: "chunk-discount-rules",
    articleId: "kb-discounts",
    heading: "Discount code rules",
    content:
      "Only one promo code can be applied to an order. If a documented promo fails, support may request a manual goodwill credit for review.",
    keywords: ["discount", "promo", "code", "coupon", "credit", "stack"],
    facts: [
      {
        id: "fact-discount-one-code",
        statement: "Only one promo code can be applied to an order."
      },
      {
        id: "fact-discount-goodwill-credit",
        statement: "Support may request a manual goodwill credit when a documented promo fails."
      }
    ]
  },
  {
    id: "chunk-shipping-delay",
    articleId: "kb-shipping",
    heading: "Delayed delivery",
    content:
      "For delivery delays over five business days, agents may offer a tracking investigation and shipping-status follow-up.",
    keywords: ["shipping", "delivery", "delay", "tracking", "fulfillment"],
    facts: [
      {
        id: "fact-shipping-investigation",
        statement: "Delivery delays over five business days qualify for a tracking investigation."
      },
      {
        id: "fact-shipping-status-follow-up",
        statement: "Support should schedule a shipping-status follow-up while a tracking investigation is open."
      }
    ]
  },
  {
    id: "chunk-damaged-replacement",
    articleId: "kb-damaged-items",
    heading: "Damaged package review",
    content:
      "Customers should provide photos of the damaged packaging and item. A replacement can be offered after the damage review is approved.",
    keywords: ["damaged", "damage", "replacement", "photo", "photos", "package", "packaging", "item", "review"],
    facts: [
      {
        id: "fact-damaged-photo-required",
        statement: "Support should request photos of the damaged packaging and item before replacing it."
      },
      {
        id: "fact-damaged-replacement-after-review",
        statement: "A replacement can be offered after the damage review is approved."
      }
    ]
  },
  {
    id: "chunk-warranty-eligibility",
    articleId: "kb-warranty",
    heading: "Warranty eligibility",
    content:
      "Warranty coverage is available for manufacturing defects within one year of purchase. Support should collect proof of purchase before confirming coverage.",
    keywords: ["warranty", "defect", "manufacturing", "eligibility", "proof", "purchase", "coverage"],
    facts: [
      {
        id: "fact-warranty-one-year",
        statement: "Warranty coverage is available for manufacturing defects within one year."
      },
      {
        id: "fact-warranty-proof-purchase",
        statement: "Support should collect proof of purchase before confirming warranty coverage."
      }
    ]
  },
  {
    id: "chunk-gift-card-balance",
    articleId: "kb-gift-cards",
    heading: "Gift card balance",
    content:
      "Support can help customers check the remaining gift card balance. Gift cards can be applied at checkout when the card number is available.",
    keywords: ["gift", "card", "balance", "checkout", "number", "remaining"],
    facts: [
      {
        id: "fact-gift-card-balance-check",
        statement: "Support can help the customer check the remaining gift card balance."
      },
      {
        id: "fact-gift-card-checkout-apply",
        statement: "Gift cards can be applied at checkout when the card number is available."
      }
    ]
  },
  {
    id: "chunk-invoice-vat",
    articleId: "kb-invoices",
    heading: "Invoice and VAT receipts",
    content:
      "Customers can download invoices from order history after the order is paid. VAT receipt requests require the business name and tax registration details.",
    keywords: ["invoice", "vat", "receipt", "billing", "paid", "business", "tax", "order"],
    facts: [
      {
        id: "fact-invoice-self-serve",
        statement: "Customers can download invoices from order history after the order is paid."
      },
      {
        id: "fact-vat-business-details",
        statement: "VAT receipt requests require the business name and tax registration details."
      }
    ]
  },
  {
    id: "chunk-address-before-shipment",
    articleId: "kb-address-change",
    heading: "Before fulfillment",
    content:
      "Address changes can be requested before the order leaves fulfillment. Support should confirm the updated address before changing the shipment.",
    keywords: ["address", "change", "shipment", "fulfillment", "shipping", "before", "confirm", "updated"],
    facts: [
      {
        id: "fact-address-before-fulfillment",
        statement: "Address changes can be requested before the order leaves fulfillment."
      },
      {
        id: "fact-address-confirmation-required",
        statement: "Support should confirm the updated address before changing the shipment."
      }
    ]
  },
  {
    id: "chunk-size-exchange",
    articleId: "kb-exchanges",
    heading: "Size exchange",
    content:
      "Size exchanges follow the same 30-day window as returns. Exchange requests require the original order number and the requested replacement size.",
    keywords: ["exchange", "size", "replacement", "order", "return", "window"],
    facts: [
      {
        id: "fact-exchange-30-day-window",
        statement: "Size exchanges follow the same 30-day window as returns."
      },
      {
        id: "fact-exchange-size-required",
        statement: "Exchange requests require the original order number and the requested replacement size."
      }
    ]
  }
];

export const supportTickets: SupportTicket[] = [
  {
    id: "ticket-return-iris",
    customerName: "Iris Chen",
    subject: "Return request for unused backpack",
    question:
      "The customer received a backpack 18 days ago, says it is unused, and wants to know whether a refund is possible.",
    channel: "email",
    priority: "normal",
    status: "open",
    intent: "return_policy",
    createdAt: "2026-08-10T09:12:00-07:00"
  },
  {
    id: "ticket-discount-omar",
    customerName: "Omar Patel",
    subject: "Promo code and holiday sale",
    question:
      "The customer asks whether a welcome discount code can stack with the holiday sale and whether support can issue credit.",
    channel: "chat",
    priority: "normal",
    status: "needs_review",
    intent: "discount_stack",
    createdAt: "2026-08-10T09:38:00-07:00"
  },
  {
    id: "ticket-account-nora",
    customerName: "Nora Reyes",
    subject: "Password reset and account export",
    question:
      "The customer wants support to reset their password and email a full account transcript export.",
    channel: "email",
    priority: "high",
    status: "escalated",
    intent: "account_data_export",
    createdAt: "2026-08-10T10:04:00-07:00"
  },
  {
    id: "ticket-shipping-lena",
    customerName: "Lena Park",
    subject: "Delivery ETA after carrier delay",
    question:
      "The customer says the delivery is six business days late and wants to know whether support can investigate the tracking status.",
    channel: "chat",
    priority: "normal",
    status: "open",
    intent: "shipping_delay",
    createdAt: "2026-08-10T10:18:00-07:00"
  },
  {
    id: "ticket-damage-miles",
    customerName: "Miles Grant",
    subject: "Damaged lamp replacement",
    question:
      "The customer received a damaged lamp, can send photos, and asks whether support can promise an overnight replacement immediately.",
    channel: "email",
    priority: "high",
    status: "needs_review",
    intent: "damaged_item_replacement",
    createdAt: "2026-08-10T10:29:00-07:00"
  },
  {
    id: "ticket-warranty-sana",
    customerName: "Sana Ito",
    subject: "Warranty eligibility for zipper defect",
    question:
      "The customer bought a bag eight months ago and reports a zipper defect. They can provide proof of purchase.",
    channel: "email",
    priority: "normal",
    status: "open",
    intent: "warranty_eligibility",
    createdAt: "2026-08-10T10:41:00-07:00"
  },
  {
    id: "ticket-gift-card-theo",
    customerName: "Theo Kim",
    subject: "Gift card balance and payout",
    question:
      "The customer wants to check a remaining gift card balance and asks whether support can cash out the unused amount.",
    channel: "chat",
    priority: "normal",
    status: "needs_review",
    intent: "gift_card_balance",
    createdAt: "2026-08-10T10:52:00-07:00"
  },
  {
    id: "ticket-invoice-mina",
    customerName: "Mina Torres",
    subject: "VAT receipt for paid order",
    question:
      "The customer needs an invoice for a paid order and asks what business details are required for a VAT receipt.",
    channel: "email",
    priority: "normal",
    status: "open",
    intent: "invoice_receipt",
    createdAt: "2026-08-10T11:04:00-07:00"
  },
  {
    id: "ticket-address-eli",
    customerName: "Eli Morgan",
    subject: "Address change after shipment",
    question:
      "The customer entered the wrong address and asks whether support can reroute a package after carrier handoff.",
    channel: "chat",
    priority: "high",
    status: "escalated",
    intent: "address_change",
    createdAt: "2026-08-10T11:16:00-07:00"
  }
];

export const reviewDecisions: ReviewDecision[] = [
  {
    id: "review-return-approve",
    draftId: "draft-ticket-return-iris",
    decision: "approve",
    reviewerName: "Maya, Support Lead",
    notes: "Grounded in returns policy. Send after adding the order number.",
    decidedAt: "2026-08-10T10:45:00-07:00"
  },
  {
    id: "review-discount-edits",
    draftId: "draft-ticket-discount-omar",
    decision: "request_edits",
    reviewerName: "Maya, Support Lead",
    notes: "Remove the stacking claim. Keep one-code rule and manual credit option.",
    decidedAt: "2026-08-10T10:48:00-07:00"
  },
  {
    id: "review-account-escalate",
    draftId: "draft-ticket-account-nora",
    decision: "escalate",
    reviewerName: "Maya, Support Lead",
    notes: "No approved source for account export or password reset. Escalate to privacy queue.",
    decidedAt: "2026-08-10T10:51:00-07:00"
  },
  {
    id: "review-shipping-approve",
    draftId: "draft-ticket-shipping-lena",
    decision: "approve",
    reviewerName: "Maya, Support Lead",
    notes: "Shipping investigation and follow-up are both grounded in the fulfillment source.",
    decidedAt: "2026-08-10T11:01:00-07:00"
  },
  {
    id: "review-damage-edits",
    draftId: "draft-ticket-damage-miles",
    decision: "request_edits",
    reviewerName: "Maya, Support Lead",
    notes: "Remove the overnight replacement promise until a damage review is approved.",
    decidedAt: "2026-08-10T11:07:00-07:00"
  },
  {
    id: "review-warranty-approve",
    draftId: "draft-ticket-warranty-sana",
    decision: "approve",
    reviewerName: "Maya, Support Lead",
    notes: "Warranty timing and proof-of-purchase requirement are both supported.",
    decidedAt: "2026-08-10T11:14:00-07:00"
  },
  {
    id: "review-invoice-edits",
    draftId: "draft-ticket-invoice-mina",
    decision: "request_edits",
    reviewerName: "Maya, Support Lead",
    notes: "Add the paid-order condition before sending the VAT receipt instructions.",
    decidedAt: "2026-08-10T11:23:00-07:00"
  },
  {
    id: "review-address-escalate",
    draftId: "draft-ticket-address-eli",
    decision: "escalate",
    reviewerName: "Maya, Support Lead",
    notes: "Carrier-handoff reroute is unsupported and should move to fulfillment escalation.",
    decidedAt: "2026-08-10T11:31:00-07:00"
  }
];

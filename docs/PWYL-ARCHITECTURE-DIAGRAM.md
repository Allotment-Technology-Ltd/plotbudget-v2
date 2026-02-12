# PWYL Pricing - Architecture Overview

## System Architecture

```mermaid
graph TB
    subgraph User_Flow[User Experience]
        A[Visit /pricing] --> B{Feature Flags}
        B -->|PWYL=true| C[PWYL Matrix]
        B -->|Fixed=true| D[Fixed Matrix Legacy]
        B -->|Neither| C
        
        C --> E[Select Amount<br/>£0-£20 slider]
        E --> F[Presets: £0 £3 £5 £10]
        E --> G[Custom: e.g. £7.50]
        
        F --> H[Click Start Premium]
        G --> H
    end
    
    subgraph Checkout_Logic[Checkout Processing]
        H --> I[/api/checkout?product=pwyl&amount=3.00]
        I --> J{Amount Check}
        
        J -->|£0| K[Skip Polar<br/>Direct DB]
        J -->|Preset| L[Use Price ID]
        J -->|Custom| M[Create Ad-hoc Price]
        
        K --> N[Grant Premium<br/>No Payment]
        L --> O[Polar Checkout]
        M --> O
    end
    
    subgraph Payment_Processing[Payment & Fulfillment]
        O --> P[User Pays<br/>on Polar]
        P --> Q[subscription.created<br/>webhook]
        
        Q --> R[Validate Signature]
        R --> S[Extract Metadata]
        S --> T[Upsert Subscription]
        T --> U[Store PWYL Amount]
        
        N --> V[Create Local Sub]
        V --> U
        
        U --> W[Redirect to<br/>Dashboard Success]
    end
    
    subgraph Settings_Display[Settings Management]
        W --> X[Settings Tab]
        X --> Y{Subscription Type}
        Y -->|PWYL| Z[Show: Premium £3/mo<br/>Change Amount]
        Y -->|Fixed| AA[Show: Premium £4.99/mo<br/>Manage]
        Y -->|Free Premium| AB[Show: Premium Free<br/>Community Supporter]
    end
    
    style C fill:#e1f5e1
    style K fill:#fff3cd
    style N fill:#d1ecf1
    style Z fill:#e1f5e1
```

## Component Hierarchy

```
PricingPage
├── PricingHeaderNavClient
└── [Conditional Rendering]
    ├── PWYLPricingMatrix (when PWYL enabled)
    │   ├── TierCard (Trial)
    │   ├── TierCard (Free)
    │   └── PWYLPremiumCard
    │       ├── PricingAmountSelector
    │       │   ├── PresetButtons [£0 £3 £5 £10]
    │       │   ├── Slider [0-20]
    │       │   └── CustomInput
    │       ├── FeatureList
    │       └── CTAButton → /api/checkout?product=pwyl&amount=X
    │
    └── FixedPricingMatrix (when fixed enabled)
        ├── TierCard (Trial)
        ├── TierCard (Free)
        └── TierCard (Premium £4.99)
```

## Data Flow

### Checkout Request
```
GET /api/checkout?product=pwyl&amount=3.00&household_id=abc&user_id=xyz
```

### Polar Checkout Creation (Option 1: Custom Prices)
```json
{
  "product_price_create": {
    "product_id": "pwyl_base_product_uuid",
    "type": "recurring",
    "recurring_interval": "month",
    "price_amount": 300,
    "price_currency": "GBP"
  },
  "success_url": "https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}",
  "metadata": {
    "household_id": "abc",
    "user_id": "xyz",
    "pwyl_amount": "3.00",
    "pricing_mode": "pwyl"
  }
}
```

### Polar Checkout Creation (Option 2: Preset Prices)
```json
{
  "products": ["pwyl_price_3_uuid"],
  "success_url": "https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}",
  "metadata": {
    "household_id": "abc",
    "user_id": "xyz",
    "pwyl_amount": "3.00",
    "pricing_mode": "pwyl"
  }
}
```

### Webhook Payload (subscription.created)
```json
{
  "type": "subscription.created",
  "data": {
    "id": "polar_sub_123",
    "status": "active",
    "product_id": "pwyl_base_product_uuid",
    "price_id": "dynamic_price_uuid",
    "metadata": {
      "household_id": "abc",
      "user_id": "xyz",
      "pwyl_amount": "3.00",
      "pricing_mode": "pwyl"
    }
  }
}
```

### Database Write
```sql
INSERT INTO public.subscriptions (
  household_id,
  polar_subscription_id,
  polar_product_id,
  status,
  current_tier,
  pwyl_amount_gbp  -- New column (optional)
) VALUES (
  'abc',
  'polar_sub_123',
  'pwyl_base_product_uuid',
  'active',
  'pro',
  3.00
);
```

## Feature Flag Decision Tree

```mermaid
graph TD
    Start[User visits /pricing] --> Check1{PRICING_ENABLED?}
    Check1 -->|false| Redirect[Redirect to dashboard]
    Check1 -->|true| Check2{Which Model?}
    
    Check2 --> Check3{PWYL_ENABLED?}
    Check3 -->|true| PWYL[Show PWYL Matrix]
    Check3 -->|false| Check4{FIXED_ENABLED?}
    
    Check4 -->|true| Fixed[Show Fixed Matrix]
    Check4 -->|false| Default[Default: PWYL Matrix]
    
    PWYL --> UserSelect[User selects amount]
    Fixed --> UserClick[User clicks preset CTA]
    
    style PWYL fill:#e1f5e1
    style Fixed fill:#ffe6e6
    style Default fill:#e1f5e1
```

## Migration Path for Existing Users

```mermaid
graph LR
    subgraph Legacy_Users[Legacy Fixed-Price Users]
        A1[Subscribed £4.99/mo] --> B1[Keep existing subscription]
        A2[Subscribed £49.99/yr] --> B2[Keep existing subscription]
        B1 --> C[Settings shows Fixed plan]
        B2 --> C
    end
    
    subgraph New_Users[New PWYL Users]
        D[New user visits /pricing] --> E[Sees PWYL matrix]
        E --> F[Selects £3/mo]
        F --> G[Completes checkout]
        G --> H[Settings shows PWYL £3/mo]
    end
    
    subgraph Optional_Migration[Optional: Migrate Legacy to PWYL]
        C --> I[Email campaign]
        I --> J[Cancel current sub]
        J --> K[Resubscribe with PWYL]
        K --> H
    end
    
    style A1 fill:#ffe6e6
    style A2 fill:#ffe6e6
    style E fill:#e1f5e1
    style F fill:#e1f5e1
```

## Implementation Phases

```mermaid
gantt
    title PWYL Pricing Implementation
    dateFormat  YYYY-MM-DD
    
    section Research
    Verify Polar API support :done, r1, 2026-02-12, 1d
    
    section Setup
    Create PWYL product in Polar :r2, after r1, 1d
    Create preset prices :r3, after r2, 1d
    Add feature flags & env vars :r4, after r3, 1d
    
    section UI Components
    Build amount selector :c1, after r4, 2d
    Build PWYL matrix :c2, after c1, 1d
    Update pricing page :c3, after c2, 1d
    
    section Backend
    Modify checkout route :b1, after r4, 2d
    Update webhook handler :b2, after b1, 1d
    Add £0 handling logic :b3, after b2, 1d
    
    section Testing
    Test PWYL flow :t1, after c3, 2d
    Test webhooks :t2, after b3, 1d
    Test £0 subscriptions :t3, after b3, 1d
    
    section Deployment
    Deploy to staging :d1, after t1, 1d
    Production rollout :d2, after d1, 1d
```

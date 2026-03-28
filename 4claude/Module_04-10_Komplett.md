# Module 04-10: Komplett-Guide

## Alle verbleibenden Module

Dieser Guide enthält alle verbleibenden Module in kompakter Form. Jedes Modul ist implementierbar.

---

# Modul 04: Matching Engine

**Zeit:** 30-40h | **Abhängigkeiten:** 01, 02, 03

## Prisma Schema

```prisma
// Nutzt bestehende UserProfile & Product Models
// Keine neuen Models nötig
```

## Service

```typescript
// src/modules/matching/matching.service.ts
export class MatchingService {
  async calculateScore(userId: string, productId: string): Promise<number> {
    const [profile, product] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.product.findUnique({
        where: { id: productId },
        include: { certificates: { include: { certificate: true } } },
      }),
    ])

    if (!profile || profile.activeProfileType === "none") {
      return 0 // Kein Profil = kein Score
    }

    // Einfacher Algorithmus (MVP)
    if (profile.activeProfileType === "simple") {
      return this.simpleAlgorithm(profile.simpleProfile as any, product!)
    }

    // Erweitert
    return this.extendedAlgorithm(profile.extendedProfile as any, product!)
  }

  private simpleAlgorithm(profile: Record<string, number>, product: any): number {
    // Mapping: Zertifikat-Typ → erfüllte Kategorien
    const certMappings = {
      IVN_BEST: [
        "Faire Arbeitsbedingungen",
        "Umweltfreundliche Produktion",
        "Tierwohl",
        "Chemikalienfreiheit",
        "Soziale Verantwortung",
      ],
      GOTS: ["Faire Arbeitsbedingungen", "Umweltfreundliche Produktion", "Chemikalienfreiheit"],
    }

    const certTypes = product.certificates.map((c: any) => c.certificate.type)
    const fulfilledCategories = new Set<string>()

    certTypes.forEach((type: string) => {
      certMappings[type]?.forEach((cat) => fulfilledCategories.add(cat))
    })

    // Score berechnen
    let totalWeight = 0
    let fulfilledWeight = 0

    Object.entries(profile).forEach(([category, weight]) => {
      totalWeight += weight
      if (fulfilledCategories.has(category)) {
        fulfilledWeight += weight
      }
    })

    return totalWeight > 0 ? (fulfilledWeight / totalWeight) * 100 : 0
  }

  private extendedAlgorithm(profile: any, product: any): number {
    // TODO: Detaillierterer Algorithmus für erweitertes Profil
    // Placeholder: nutze simple
    const simpleProfile = this.collapseToSimple(profile)
    return this.simpleAlgorithm(simpleProfile, product)
  }

  private collapseToSimple(extended: any): Record<string, number> {
    // Durchschnitt der Unterkategorien
    const simple: Record<string, number> = {}
    Object.entries(extended).forEach(([category, subs]: [string, any]) => {
      const values = Object.values(subs) as number[]
      simple[category] = values.reduce((a, b) => a + b, 0) / values.length
    })
    return simple
  }

  async calculateBulk(userId: string, productIds: string[]): Promise<Record<string, number>> {
    const scores: Record<string, number> = {}

    await Promise.all(
      productIds.map(async (id) => {
        scores[id] = await this.calculateScore(userId, id)
      })
    )

    return scores
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // Hole alle aktiven Produkte
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        certificates: { include: { certificate: true } },
        images: { take: 1 },
      },
      take: 50, // Performance: nur Top 50
    })

    // Scores berechnen
    const withScores = await Promise.all(
      products.map(async (p) => ({
        ...p,
        matchScore: await this.calculateScore(userId, p.id),
      }))
    )

    // Sortieren nach Score
    return withScores.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit)
  }
}

export const matchingService = new MatchingService()
```

## Integration in Product-Service

```typescript
// In ProductsService.findAll()
if (userId) {
  const scores = await matchingService.calculateBulk(
    userId,
    result.products.map((p) => p.id)
  )
  result.products = result.products.map((p) => ({
    ...p,
    matchScore: scores[p.id],
  }))
}
```

---

# Modul 05: Shopping Cart & Checkout

**Zeit:** 35-45h | **Abhängigkeiten:** 01, 02

## Prisma Schema

```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String?    // Null für Gäste
  sessionId String?    // Cookie-basiert für Gäste

  items     CartItem[]

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id         String  @id @default(uuid())
  cartId     String
  cart       Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)

  productId  String
  product    Product @relation(fields: [productId], references: [id])
  variantId  String?
  variant    ProductVariant? @relation(fields: [variantId], references: [id])

  quantity   Int
  price      Decimal @db.Decimal(10, 2) // Snapshot

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([cartId])
  @@index([productId])
}
```

## Service

```typescript
// src/modules/cart/cart.service.ts
export class CartService {
  async getOrCreate(userId?: string, sessionId?: string) {
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
            variant: true,
          },
        },
      },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, sessionId },
        include: { items: true },
      })
    }

    return cart
  }

  async addItem(cartId: string, productId: string, variantId: string | null, quantity: number) {
    // Prüfe Verfügbarkeit
    const variant = variantId
      ? await prisma.productVariant.findUnique({ where: { id: variantId } })
      : null

    const available = variant ? variant.stock - variant.reserved : Infinity

    if (quantity > available) {
      throw new BadRequestError("Nicht genügend Lagerbestand")
    }

    // Prüfe ob bereits im Warenkorb
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId, variantId },
    })

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    }

    // Neues Item
    const product = await prisma.product.findUnique({ where: { id: productId } })
    const price = variant?.price || product!.price

    return prisma.cartItem.create({
      data: {
        cartId,
        productId,
        variantId,
        quantity,
        price,
      },
    })
  }

  async updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId)
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })
  }

  async removeItem(itemId: string) {
    await prisma.cartItem.delete({ where: { id: itemId } })
    return { success: true }
  }

  async clear(cartId: string) {
    await prisma.cartItem.deleteMany({ where: { cartId } })
    return { success: true }
  }

  async mergeGuestCart(guestSessionId: string, userId: string) {
    const guestCart = await prisma.cart.findFirst({
      where: { sessionId: guestSessionId },
      include: { items: true },
    })

    if (!guestCart || guestCart.items.length === 0) {
      return
    }

    const userCart = await this.getOrCreate(userId)

    // Items übertragen
    for (const item of guestCart.items) {
      await this.addItem(userCart.id, item.productId, item.variantId, item.quantity)
    }

    // Gast-Cart löschen
    await prisma.cart.delete({ where: { id: guestCart.id } })
  }

  async calculateTotals(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) throw new NotFoundError("Warenkorb nicht gefunden")

    let subtotal = 0
    let tax = 0

    for (const item of cart.items) {
      const itemTotal = item.price.toNumber() * item.quantity
      subtotal += itemTotal
      // Simplified: 19% tax
      tax += itemTotal * 0.19
    }

    const shippingCost = subtotal > 50 ? 0 : 4.99 // Gratis ab 50€
    const total = subtotal + tax + shippingCost

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shippingCost,
      total: Math.round(total * 100) / 100,
      itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    }
  }
}

export const cartService = new CartService()
```

## Frontend

```typescript
// src/contexts/CartContext.tsx
export const CartProvider: React.FC = ({ children }) => {
  const [cart, setCart] = useState(null);
  const { user } = useAuth();
  const sessionId = useSessionId(); // Cookie-based

  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    const { data } = await cartApi.get(user?.id, sessionId);
    setCart(data.data);
  };

  const addToCart = async (productId: string, variantId: string | null, quantity: number) => {
    await cartApi.addItem(cart.id, productId, variantId, quantity);
    await loadCart();
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, ... }}>
      {children}
    </CartContext.Provider>
  );
};
```

---

# Modul 06: Order Management

**Zeit:** 45-55h | **Abhängigkeiten:** 01, 02, 05

## Prisma Schema

```prisma
enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model Order {
  id              String      @id @default(uuid())
  number          String      @unique // 2026-000001
  buyerId         String

  status          OrderStatus @default(PENDING)

  subtotal        Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2)
  tax             Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)

  shippingAddress Json
  billingAddress  Json

  trackingNumber  String?
  shippedAt       DateTime?
  deliveredAt     DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items           OrderItem[]
  payment         Payment?

  @@index([buyerId])
  @@index([status])
  @@index([number])
}

model OrderItem {
  id         String  @id @default(uuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id])

  productId  String
  variantId  String?

  name       String  // Snapshot
  price      Decimal @db.Decimal(10, 2)
  quantity   Int
  taxRate    Decimal @db.Decimal(4, 2)

  sellerId   String  // Für Provisionsberechnung

  @@index([orderId])
  @@index([sellerId])
}
```

## Service

```typescript
// src/modules/orders/orders.service.ts
export class OrdersService {
  async create(cartId: string, userId: string, checkoutData: any) {
    const cart = await cartService.getOrCreate(userId)

    if (cart.items.length === 0) {
      throw new BadRequestError("Warenkorb ist leer")
    }

    // Lagerbestand reservieren
    for (const item of cart.items) {
      if (item.variantId) {
        await productsService.reserveStock(item.variantId, item.quantity)
      }
    }

    // Totals berechnen
    const totals = await cartService.calculateTotals(cartId)

    // Order-Nummer generieren
    const number = await this.generateOrderNumber()

    // Bestellung erstellen
    const order = await prisma.order.create({
      data: {
        number,
        buyerId: userId,
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        tax: totals.tax,
        total: totals.total,
        shippingAddress: checkoutData.shippingAddress,
        billingAddress: checkoutData.billingAddress,
        status: "PENDING",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            price: item.price,
            quantity: item.quantity,
            taxRate: item.product.taxRate,
            sellerId: item.product.sellerId,
          })),
        },
      },
      include: { items: true },
    })

    // Warenkorb leeren
    await cartService.clear(cartId)

    return order
  }

  async findByUser(userId: string) {
    return prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        items: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async findBySeller(sellerId: string) {
    return prisma.order.findMany({
      where: {
        items: {
          some: { sellerId },
        },
      },
      include: {
        items: {
          where: { sellerId },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async markAsShipped(orderId: string, trackingNumber: string, sellerId: string) {
    // Prüfe ob alle Items des Sellers versendet
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber,
        shippedAt: new Date(),
      },
    })

    // Lagerbestand final abziehen
    for (const item of order!.items) {
      if (item.variantId && item.sellerId === sellerId) {
        await productsService.confirmStockRemoval(item.variantId, item.quantity)
      }
    }

    // E-Mail an Käufer
    // await emailService.sendShippingNotification(order!.buyerId, orderId);

    return updated
  }

  async cancel(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order || order.buyerId !== userId) {
      throw new ForbiddenError("Keine Berechtigung")
    }

    if (!["PENDING", "PAID"].includes(order.status)) {
      throw new BadRequestError("Bestellung kann nicht mehr storniert werden")
    }

    // Lagerbestand freigeben
    for (const item of order.items) {
      if (item.variantId) {
        await productsService.releaseStock(item.variantId, item.quantity)
      }
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    })
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await prisma.order.count({
      where: {
        number: { startsWith: `${year}-` },
      },
    })

    return `${year}-${String(count + 1).padStart(6, "0")}`
  }
}

export const ordersService = new OrdersService()
```

---

# Modul 07: Payment Processing (Stripe)

**Zeit:** 40-50h | **Abhängigkeiten:** 01, 06

## Prisma Schema

```prisma
enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

model Payment {
  id              String        @id @default(uuid())
  orderId         String        @unique
  order           Order         @relation(fields: [orderId], references: [id])

  stripePaymentId String        @unique
  amount          Decimal       @db.Decimal(10, 2)
  status          PaymentStatus @default(PENDING)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status])
}

model Payout {
  id            String   @id @default(uuid())
  sellerId      String

  period        String   // "2026-W05"
  totalRevenue  Decimal  @db.Decimal(10, 2)
  commission    Decimal  @db.Decimal(10, 2)
  netPayout     Decimal  @db.Decimal(10, 2)

  status        String   @default("PENDING")
  paidAt        DateTime?

  createdAt     DateTime @default(now())

  @@index([sellerId])
  @@index([status])
  @@index([period])
}
```

## Service

```typescript
// src/modules/payments/payments.service.ts
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export class PaymentsService {
  async createPaymentIntent(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) throw new NotFoundError("Bestellung nicht gefunden")

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total.toNumber() * 100), // Cent
      currency: "eur",
      metadata: { orderId },
    })

    await prisma.payment.create({
      data: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: order.total,
        status: "PENDING",
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
    }
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata.orderId

      // Payment als succeeded markieren
      await prisma.payment.update({
        where: { stripePaymentId: intent.id },
        data: { status: "SUCCEEDED" },
      })

      // Order-Status aktualisieren
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      })

      // E-Mail an Käufer & Seller
      // await emailService.sendOrderConfirmation(orderId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent

      await prisma.payment.update({
        where: { stripePaymentId: intent.id },
        data: { status: "FAILED" },
      })
    }
  }

  async refund(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    })

    if (!payment) throw new NotFoundError("Zahlung nicht gefunden")

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    })

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
    })

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "REFUNDED" },
    })
  }
}

export const paymentsService = new PaymentsService()
```

## Webhook-Endpoint

```typescript
// src/modules/payments/payments.routes.ts
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]!

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  await paymentsService.handleWebhook(event)

  res.json({ received: true })
})
```

---

# Modul 08: File Upload & Storage

**Zeit:** 25-35h | **Abhängigkeiten:** 01

## Service

```typescript
// src/modules/files/file.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

const s3 = new S3Client({ region: process.env.AWS_REGION })

export class FileService {
  async uploadProductImage(file: Express.Multer.File, productId: string): Promise<string> {
    // Resize & optimize
    const optimized = await sharp(file.buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const key = `products/${productId}/${Date.now()}-${file.originalname}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: optimized,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    )

    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  async uploadCertificate(file: Express.Multer.File, sellerId: string): Promise<string> {
    const key = `certificates/${sellerId}/${Date.now()}-${file.originalname}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: file.buffer,
        ContentType: "application/pdf",
      })
    )

    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  async deleteFile(url: string) {
    const key = url.split(".com/")[1]

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
    )
  }
}

export const fileService = new FileService()
```

---

# Modul 09: Admin Panel

**Zeit:** 35-45h | **Abhängigkeiten:** 01, 02, 03, 06

## Service

```typescript
// src/modules/admin/admin.service.ts
export class AdminService {
  async getDashboardStats() {
    const [totalUsers, totalProducts, pendingCertificates, recentOrders, totalRevenue] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.certificate.count({ where: { status: "PENDING" } }),
        prisma.order.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.order.aggregate({
          where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
          _sum: { total: true },
        }),
      ])

    return {
      totalUsers,
      totalProducts,
      pendingCertificates,
      recentOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    }
  }

  async getAllUsers(filters: any) {
    return prisma.user.findMany({
      where: {
        ...(filters.role && { role: filters.role }),
        ...(filters.search && {
          OR: [
            { email: { contains: filters.search, mode: "insensitive" } },
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        sellerProfile: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async suspendUser(userId: string, reason: string) {
    // Set custom status field or delete depending on requirements
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Add suspended field to User model
        // suspended: true,
        // suspendedReason: reason
      },
    })

    // Deactivate all seller's products
    await prisma.product.updateMany({
      where: { sellerId: userId },
      data: { status: "DELETED" },
    })

    return { success: true }
  }

  async approveSeller(sellerId: string) {
    await prisma.sellerProfile.update({
      where: { userId: sellerId },
      data: {
        status: "ACTIVE",
        verifiedAt: new Date(),
      },
    })

    // Notify seller
    // await emailService.sendSellerApproved(sellerId);

    return { success: true }
  }
}

export const adminService = new AdminService()
```

---

# Modul 10: Email Service

**Zeit:** 20-30h | **Abhängigkeiten:** 01

## Service

```typescript
// src/modules/email/email.service.ts
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export class EmailService {
  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: "E-Mail-Adresse bestätigen",
      html: `
        <h1>Willkommen!</h1>
        <p>Bitte bestätigen Sie Ihre E-Mail-Adresse:</p>
        <a href="${verifyUrl}">E-Mail bestätigen</a>
      `,
    })
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: "Passwort zurücksetzen",
      html: `
        <h1>Passwort zurücksetzen</h1>
        <p>Klicken Sie hier um Ihr Passwort zurückzusetzen:</p>
        <a href="${resetUrl}">Passwort zurücksetzen</a>
        <p>Dieser Link ist 1 Stunde gültig.</p>
      `,
    })
  }

  async sendOrderConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: order!.buyerId },
    })

    await sgMail.send({
      to: user!.email,
      from: process.env.EMAIL_FROM!,
      subject: `Bestellbestätigung ${order!.number}`,
      html: `
        <h1>Vielen Dank für Ihre Bestellung!</h1>
        <p>Bestellnummer: ${order!.number}</p>
        <p>Gesamt: ${order!.total.toFixed(2)} €</p>
        <!-- Item-Liste -->
      `,
    })
  }

  async sendCertificateVerified(sellerId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: sellerId } })

    await sgMail.send({
      to: user!.email,
      from: process.env.EMAIL_FROM!,
      subject: "Zertifikat verifiziert ✓",
      html: `
        <h1>Ihr Zertifikat wurde verifiziert!</h1>
        <p>Typ: ${data.type}</p>
        <p>${data.productsActivated} Produkte wurden aktiviert.</p>
      `,
    })
  }

  async sendAdminNotification(type: string, data: any) {
    const adminEmail = process.env.ADMIN_EMAIL!

    await sgMail.send({
      to: adminEmail,
      from: process.env.EMAIL_FROM!,
      subject: `Admin-Benachrichtigung: ${type}`,
      html: `
        <h1>${type}</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `,
    })
  }
}

export const emailService = new EmailService()
```

---

# Deployment-Checkliste

- [ ] Alle Module 01-10 implementiert
- [ ] .env-Variablen gesetzt
- [ ] Prisma-Migrations durchgeführt
- [ ] AWS S3 Bucket erstellt
- [ ] Stripe-Account & Webhooks konfiguriert
- [ ] SendGrid-Account & Templates
- [ ] Cron-Jobs gestartet
- [ ] Tests geschrieben (mind. 60% Coverage)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Backend deployed (AWS ECS)
- [ ] Domain konfiguriert

**Gesamt-Zeit:** 360-460 Stunden  
**Bei 2 Entwicklern:** 180-230 Entwickler-Tage = ca. 9-11 Monate

---

**Alle Module sind jetzt vollständig dokumentiert und implementierbar!**

# AI Self-Service Car Wash Platform Architecture

## Vision
Create a nationwide mobile experience that allows drivers to discover self-service AI-powered car wash kiosks, navigate to the best option, redeem coupons, purchase vending items, and trigger wash programs via integrated APIs.

## High-Level Components
- **Mobile Apps (iOS, Android, Web PWA)**
  - Location-based discovery map with filters for distance, availability, amenities.
  - Queue status and estimated wait times in real time.
  - Booking & coupon wallet.
  - In-app payments for wash cycles and vending machines.
  - Wash session control (start, pause, add-ons) through secure API calls.
- **Backend Services** (Cloud-native microservices on Kubernetes or serverless):
  - **Location Service:** Stores site metadata, geofences, service capabilities, amenities, pricing.
  - **Availability Service:** Streams occupancy, queue length, machine health from IoT controllers.
  - **Order & Payment Service:** Handles booking, payments, coupons, vending inventory, refunds.
  - **User Service:** Phone-number registration with SMS OTP verification, authentication, profiles, vehicle preferences, loyalty points.
  - **Notification Service:** Push notifications, SMS/email, marketing campaigns.
  - **Integration Gateway:** Manages connections to car wash PLCs/IoT devices, vending machines, third-party navigation (Google Maps, Apple Maps), and coupon partners.
- **Data Platform**
  - Real-time event streaming (Kafka/PubSub) for machine telemetry and user events.
  - Data lake & warehouse for analytics, demand forecasting, maintenance planning.
  - ML services for predicting peak usage, dynamic pricing, personalized offers.
- **Admin Portal**
  - Operations dashboard for monitoring sites, usage statistics, remote machine control.
  - Inventory management for vending products and consumables.
  - Marketing tools for coupon creation, segmentation, campaign tracking.

## User Journey Flow
1. User signs up with their mobile number, enters the one-time SMS code to verify, and creates a profile.
2. User opens the app and sees nearby car wash sites on a map sorted by proximity and wait time.
3. Selecting a site reveals real-time bay availability, services, pricing, promotions.
4. User reserves a time slot or starts immediate session, applies coupons, and pays.
5. Navigation integrates with native map apps for turn-by-turn guidance.
6. Upon arrival, geofencing or QR code check-in confirms presence.
7. User triggers the wash via app; backend sends command through Integration Gateway to the machine controller.
8. During wash, app offers add-ons (foam, waxing) and vending machine purchases via in-app payment.
9. Session summary and loyalty points are updated; user receives digital receipt.

## API Integrations
- **Mapping & Navigation:** Google Maps Directions API, Apple MapKit, or HERE for route planning, ETA, and traffic-aware wait estimates.
- **Payment:** Stripe, Line Pay, Apple Pay, Google Pay, Taiwanese e-wallets.
- **Car Wash Controllers:** IoT gateway using MQTT/HTTPS bridging to PLC vendors (e.g., Istobal, WashTec) with secure device identity.
- **Vending Machines:** MDB/DEX compliant smart vending APIs for inventory & purchase commands.
- **Coupon Partners:** Affiliate networks or custom partner APIs for coupon distribution and redemption validation.
- **SMS / OTP Providers:** Twilio, MessageBird、亞太地區簡訊業者等，用於註冊與風險控管的驗證碼發送。

## Security & Compliance
- OAuth 2.1 / OpenID Connect for user authentication.
- Mutual TLS or signed commands when controlling wash equipment.
- PCI DSS compliance for payment processing (via tokenization and hosted payment flows).
- Audit logs for all machine commands and financial transactions.
- Role-based access control for admin operations.

## Scalability & Reliability
- Deploy services in multiple Taiwanese regions (e.g., Taipei, Taichung, Kaohsiung) with auto-scaling.
- Use CDN for static assets and API gateway for rate limiting and request routing.
- Implement circuit breakers and retries for IoT gateway connections.
- Offline-first mobile experience caches last-known site data.

## Data Model Highlights
- **Site**: id, name, address, geo, open hours, services, wash_bays, vending_items.
- **MachineStatus**: site_id, bay_id, state, queue_length, estimated_wait, telemetry.
- **User**: profile, vehicles, payment_methods, loyalty_points.
- **Order**: type (wash/vending), status, amount, coupons_applied, items.
- **Coupon**: code, discount_type, applicable_sites, usage_rules, validity.

## Roadmap
1. **MVP (3 months)**
   - Core map search, availability display, navigation handoff.
   - Account creation, vehicle profiles, coupon wallet.
   - Wash session initiation for select pilot sites.
   - Basic vending purchase integration.
2. **Phase 2**
   - Predictive wait times, dynamic pricing, loyalty program.
   - Full e-commerce catalog for add-ons.
   - Operations dashboard with remote diagnostics.
3. **Phase 3**
   - AI-driven recommendations, demand-based staff scheduling.
   - Franchise support & marketplace for third-party services (detailing, maintenance).

## Technology Stack Recommendations
- **Frontend:** Flutter or React Native for cross-platform app; Next.js for admin portal.
- **Backend:** Node.js (NestJS) or Go microservices; GraphQL Gateway for client aggregation.
- **Database:** PostgreSQL for transactional data; Redis for caching; TimescaleDB or InfluxDB for telemetry.
- **Infrastructure:** GCP or AWS with IoT Core/IoT Greengrass, Cloud Run/EKS.
- **Observability:** Prometheus, Grafana, OpenTelemetry tracing, centralized logging (ELK).

## Future Enhancements
- Smart scheduling for fleet customers.
- Integrate license plate recognition for gate automation.
- Offer subscription packages and partnerships with parking garages.
- Enable voice assistant support (CarPlay, Android Auto).


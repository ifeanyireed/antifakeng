### Summary of Slugs Mapped in slugs.md

1. Public & Onboarding Space:
    •  /  — Dynamic landing router.
    •  /login  — Admin & Producer login screen.
    •  /register  — Producer account registration.
    •  /onboarding  — Brand configuration wizard.
2. Consumer Verification Space:
    •  /verify/[token]  — Dynamic QR scan authentication page.
    •  /consumer  — Standalone code verification checker.
3. Producer Space:
    •  /producer/dashboard  — Live brand verification graphs.
    •  /producer/products  — SKU catalog manager & image uploader.
    •  /producer/batches  — Code issue & vector PDF layout exporter.
    •  /producer/alerts  — Threat events.
    •  /producer/history  — Consumer scan logs.
    •  /producer/reports  — Fraud feedback lists.
    •  /producer/notifications  — Notification digests.
    •  /producer/profile  — Brand details & billing metrics.
4. SaaS Administrative Space:
    •  /admin/dashboard  — Global platform metrics.
    •  /admin/producers  — Tenant account statuses.
    •  /admin/fraud  — Cross-tenant security flags.
    •  /admin/logs  — Comprehensive system audit trails.
    •  /admin/notifications  — Global SaaS synchronization alerts.

      Here is the details on how they work and how to pair your
  WhatsApp session:
  ──────
  ### 1. How to Authenticate the WhatsApp Session

  When the  auth-service  boots, it starts the  whatsmeow 
  WhatsApp client. If it doesn't find an existing session in
  the local SQLite database ( wameow_session.db ), it generates
  a raw QR pairing string and logs it.

  To link your WhatsApp account:

  1. Open the auth-service terminal logs (located at
  backend/logs/auth.log).
  2. Look for the pairing box output:
    ==================================================
      WhatsApp Pairing Link Required (AntiFakeNG)
      Pairing code: 2@xxxxxxxxxxxx,xxxxxxxxxxxxxxxxxxxx...
      Paste code into a QR scanner or link in WhatsApp.
    ==================================================
    
  3. Copy the raw  Pairing code  string (e.g.  2@... ).
  4. Paste it into any free online QR code generator (such as
  QR Code Generator https://www.qr-code-generator.com/ or
  similar tools) to display the QR image.
  5. Open WhatsApp on your phone:
      • Go to Settings ➡️ Linked Devices ➡️ Link a Device.
      • Scan the generated QR code with your phone.
  6. Once paired,  whatsmeow  automatically saves the session
  token inside  wameow_session.db . It will reconnect
  automatically on all future restarts without requiring
  pairing again.

    To compile and run all services in the background together,
  you should run:

    ./run.sh
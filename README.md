# Jeewaka - Unified Healthcare System

**Architecture Diagram**

![System Architecture](https://raw.githubusercontent.com/Jeewaka-MediCare/Jeewaka-Medical-Platform/refs/heads/main/Assests/Architecture_Diagram.png)

---

## 1. Overview

**Jeewaka** is a modular monolith healthcare platform that integrates AI-driven insights, real-time video communication, and cloud-based data management.
It unifies mobile, web, and backend services within a single, scalable architecture built around an **Express.js monolithic backend**.

The platform supports medical professionals and patients by streamlining appointments, consultations, and record management through intelligent automation and seamless communication.

---

## 2. System Architecture

The system follows a modular monolithic architecture pattern, ensuring clear module boundaries while maintaining a single deployable backend.
The **Express.js monolith** coordinates all operations between the frontends, databases, AI services, and external APIs.

### 2.1 Frontends

* **Mobile Application:** Provides real-time video consultations, appointment booking, and access to patient records.
* **Web Application:** Used by doctors, administrators, and staff for managing schedules, medical data, and performance analytics.

Both clients interact with the backend via secured RESTful APIs.

### 2.2 Backend

* **Express.js Monolith**
  Central component managing authentication, authorization, business logic, and service integrations.
  The backend is modularized by domains (e.g., appointments, users, payments) for maintainability and scalability.

### 2.3 Databases

* **MongoDB:** Primary transactional database storing user data, appointments, and medical records.
* **Vector Database:** Stores embeddings for semantic search and context-based retrieval, used in conjunction with the AI module.

### 2.4 AI Services

* **Gemini (Google AI):**
  Powers intelligent features such as:

  * Medical text summarization and reasoning
  * AI-assisted chat support for patients and doctors
  * Semantic embedding generation for retrieval
    Generated embeddings are persisted in the Vector Database.

### 2.5 External Services

* **Email Service:** Handles notifications and automated correspondence.
* **S3 Storage:** Stores files, media assets, and medical reports in a secure, scalable cloud environment.
* **VideoSDK:** Enables low-latency, real-time video sessions and WebSocket-based communication.
* **Stripe:** Handles payment gateway
---

## 3. Technology Stack

| Layer             | Technologies                       |
| ----------------- | ---------------------------------- |
| Frontend          | React (Web), React Native (Mobile) |
| Backend           | Node.js, Express.js                |
| Databases         | MongoDB, Vector Database           |
| AI                | Google Gemini                      |
| External Services | Email Service, AWS S3, VideoSDK    |

---

## 4. Development Environment Setup

### 4.1 Prerequisites

Ensure the following are installed:

* Node.js (v18 or higher)
* npm
* MongoDB (local instance or cloud connection)
* Access credentials for AI, storage, and email services

### 4.2 Clone the Repository

```bash
git clone https://github.com/Jeewaka-MediCare/Jeewaka-Medical-Platform.git
cd Jeewaka-Medical-Platform
```

### 4.3 Install Dependencies

```bash
npm install
```

### 4.4 Environment Variables

Create a `.env` file in the root directory and configure.

### 4.5 Start the Development Server

```bash
npm run dev
```

The backend will run on `http://localhost:5000`.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

This starts the web client on a separate development port (`http://localhost:3000`).

---

## 5. Architecture Summary

The Jeewaka platform operates as a **hub-and-spoke system**, where the **Express.js monolith** acts as the core hub managing communication with all connected services.
This approach allows for centralized control while maintaining the flexibility to modularize or scale components independently in the future.

---

## 6. Future Enhancements

* Modular decomposition of AI and analytics modules into standalone services
* Introduction of event-driven message queues (e.g., RabbitMQ, Kafka) for asynchronous operations
* Integration of real-time monitoring and analytics dashboards
* Enhanced CI/CD automation and deployment pipelines

Group 30 - SEP
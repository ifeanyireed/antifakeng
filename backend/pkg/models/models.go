package models

import "time"

// Role represents a user's authorization level
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleProducer Role = "producer"
	RoleQA       Role = "qa"
	RoleSupport  Role = "support"
)

// Status types
const (
	StatusActive    = "active"
	StatusSuspended = "suspended"
	StatusDraft     = "draft"
	StatusRecalled  = "recalled"
)

// Producer represents a tenant brand
type Producer struct {
	ID             int       `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Slug           string    `json:"slug" db:"slug"`
	PlanTier       string    `json:"plan_tier" db:"plan_tier"`
	ContactEmail   string    `json:"contact_email" db:"contact_email"`
	BrandLogoURL   string    `json:"brand_logo_url" db:"brand_logo_url"`
	Status         string    `json:"status" db:"status"` // active, suspended
	IDCardURL      string    `json:"id_card_url" db:"id_card_url"`
	SelfieURL      string    `json:"selfie_url" db:"selfie_url"`
	UtilityBillURL string    `json:"utility_bill_url" db:"utility_bill_url"`
	APIKey         string    `json:"api_key" db:"api_key"`
	APISecret      string    `json:"api_secret" db:"api_secret"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	AllowedQRLimit int       `json:"allowed_qr_limit" db:"allowed_qr_limit"`
	CodesGenerated int       `json:"codes_generated" db:"codes_generated"`
}

// User represents a staff member or administrator
type User struct {
	ID           int       `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         Role      `json:"role" db:"role"` // admin, producer, qa, support
	ProducerID   *int      `json:"producer_id" db:"producer_id"` // null for platform admins
	Status       string    `json:"status" db:"status"` // active, suspended
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// Product represents a SKU registered under a tenant
type Product struct {
	ID          int       `json:"id" db:"id"`
	ProducerID  int       `json:"producer_id" db:"producer_id"`
	Name        string    `json:"name" db:"name"`
	SKU         string    `json:"sku" db:"sku"`
	Category    string    `json:"category" db:"category"`
	Description string    `json:"description" db:"description"`
	ImageURL    string    `json:"image_url" db:"image_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Batch represents a production run
type Batch struct {
	ID              int       `json:"id" db:"id"`
	ProductID       int       `json:"product_id" db:"product_id"`
	BatchCode       string    `json:"batch_code" db:"batch_code"`
	Quantity        int       `json:"quantity" db:"quantity"`
	ManufactureDate time.Time `json:"manufacture_date" db:"manufacture_date"`
	ExpiryDate      time.Time `json:"expiry_date" db:"expiry_date"`
	Status          string    `json:"status" db:"status"` // draft, active, recalled
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	LabelImageURL   string    `json:"label_image_url" db:"label_image_url"`
	LabelRotation   int       `json:"label_rotation" db:"label_rotation"`
	QRPosition      string    `json:"qr_position" db:"qr_position"`
}

// QRCode represents an individual product's verification token
type QRCode struct {
	ID        int       `json:"id" db:"id"`
	BatchID   int       `json:"batch_id" db:"batch_id"`
	Token     string    `json:"token" db:"token"`
	Signature string    `json:"signature" db:"signature"`
	Status    string    `json:"status" db:"status"` // active, recalled
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Consumer represents a verified buyer
type Consumer struct {
	ID               int       `json:"id" db:"id"`
	PhoneNumberHash  string    `json:"-" db:"phone_number_hash"` // phone stored hashed for privacy
	VerificationCount int      `json:"verification_count" db:"verification_count"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// VerificationSession represents a scan attempt
type VerificationSession struct {
	ID        int       `json:"id" db:"id"`
	QRCodeID  int       `json:"qr_code_id" db:"qr_code_id"`
	ConsumerID *int     `json:"consumer_id,omitempty" db:"consumer_id"` // nullable until OTP verified
	DeviceID  string    `json:"device_id" db:"device_id"`
	IPCountry string    `json:"ip_country" db:"ip_country"`
	Result    string    `json:"result" db:"result"` // genuine, previously_verified, suspicious, high_risk, invalid, recalled
	RiskScore float64   `json:"risk_score" db:"risk_score"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Report represents a consumer complaint
type Report struct {
	ID               int       `json:"id" db:"id"`
	QRCodeID         int       `json:"qr_code_id" db:"qr_code_id"`
	ConsumerID       int       `json:"consumer_id" db:"consumer_id"`
	Description      string    `json:"description" db:"description"`
	RetailerName     string    `json:"retailer_name" db:"retailer_name"`
	RetailerLocation string    `json:"retailer_location" db:"retailer_location"`
	PhotoURL         string    `json:"photo_url" db:"photo_url"`
	Status           string    `json:"status" db:"status"` // pending, investigating, resolved
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// FraudEvent represents details flagged by the risk engine
type FraudEvent struct {
	ID                    int        `json:"id" db:"id"`
	VerificationSessionID int        `json:"verification_session_id" db:"verification_session_id"`
	SignalType            string     `json:"signal_type" db:"signal_type"` // e.g. "tampered_token", "impossible_travel", "device_mismatch"
	Severity              string     `json:"severity" db:"severity"`       // low, medium, high, critical
	ResolvedBy            *int       `json:"resolved_by,omitempty" db:"resolved_by"`
	ResolvedAt            *time.Time `json:"resolved_at,omitempty" db:"resolved_at"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
}

// AuditLog captures admin or producer user actions
type AuditLog struct {
	ID           int       `json:"id" db:"id"`
	ActorUserID  *int      `json:"actor_user_id,omitempty" db:"actor_user_id"`
	Action       string    `json:"action" db:"action"`
	TargetEntity string    `json:"target_entity" db:"target_entity"`
	TargetID     int       `json:"target_id" db:"target_id"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

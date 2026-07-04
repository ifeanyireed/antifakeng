package crypto

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	JWTSecret       = []byte("antifakeng-super-secret-key-change-in-prod")
	SignatureSecret = "antifakeng-signature-salt-key"
)

type Claims struct {
	UserID     int    `json:"user_id"`
	Role       string `json:"role"`
	ProducerID *int   `json:"producer_id,omitempty"`
	jwt.RegisteredClaims
}

// HashPassword hashes a plain text password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with its hashed version
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateJWT creates a new JWT for staff/admins
func GenerateJWT(userID int, role string, producerID *int) (string, error) {
	claims := Claims{
		UserID:     userID,
		Role:       role,
		ProducerID: producerID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

// ValidateJWT verifies the JWT and returns claims
func ValidateJWT(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return JWTSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token claims")
}

// SignToken generates an HMAC signature for a QR code token
func SignToken(token string) string {
	mac := hmac.New(sha256.New, []byte(SignatureSecret))
	mac.Write([]byte(token))
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifyTokenSignature checks if the signature matches the token
func VerifyTokenSignature(token, signature string) bool {
	expectedSig := SignToken(token)
	return hmac.Equal([]byte(signature), []byte(expectedSig))
}

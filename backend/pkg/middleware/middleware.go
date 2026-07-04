package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/ahnara/antifake/backend/pkg/crypto"
)

type contextKey string

const (
	UserKey       contextKey = "user_claims"
	ClaimsUserID  contextKey = "claims_user_id"
	ClaimsRole    contextKey = "claims_role"
	ClaimsProdID  contextKey = "claims_producer_id"
)

// CORS is a middleware that handles Cross-Origin Resource Sharing
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RequireAuth extracts and validates the JWT from Authorization header
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header required"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Authorization header must be in format 'Bearer <token>'"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := parts[1]
		claims, err := crypto.ValidateJWT(tokenStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		// Inject claims into context
		ctx := context.WithValue(r.Context(), UserKey, claims)
		ctx = context.WithValue(ctx, ClaimsUserID, claims.UserID)
		ctx = context.WithValue(ctx, ClaimsRole, claims.Role)
		if claims.ProducerID != nil {
			ctx = context.WithValue(ctx, ClaimsProdID, *claims.ProducerID)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole enforces specific roles on authenticated endpoints
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roleVal := r.Context().Value(ClaimsRole)
			if roleVal == nil {
				http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
				return
			}

			userRole := roleVal.(string)
			allowed := false
			for _, r := range roles {
				if r == userRole {
					allowed = true
					break
				}
			}

			if !allowed {
				http.Error(w, `{"error": "Forbidden: insufficient permissions"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetProducerID retrieves the producer ID from context (returns -1 and ok=false if not present/admin)
func GetProducerID(ctx context.Context) (int, bool) {
	val := ctx.Value(ClaimsProdID)
	if val == nil {
		return -1, false
	}
	return val.(int), true
}

// GetUserID retrieves user ID from context
func GetUserID(ctx context.Context) (int, bool) {
	val := ctx.Value(ClaimsUserID)
	if val == nil {
		return -1, false
	}
	return val.(int), true
}

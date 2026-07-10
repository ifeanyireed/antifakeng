package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/ahnara/antifake/backend/pkg/middleware"
)

type Route struct {
	Prefix string
	Target string
}

func main() {
	// Microservice host mappings
	routes := []Route{
		{Prefix: "/api/auth", Target: "http://localhost:8081"},
		{Prefix: "/api/producer", Target: "http://localhost:8082"},
		{Prefix: "/api/verify", Target: "http://localhost:8083"},
		{Prefix: "/api/analytics", Target: "http://localhost:8084"},
		{Prefix: "/uploads", Target: "http://localhost:8082"},
	}

	proxies := make(map[string]*httputil.ReverseProxy)

	for _, r := range routes {
		targetURL, err := url.Parse(r.Target)
		if err != nil {
			log.Fatalf("Failed to parse target URL %s: %v", r.Target, err)
		}
		proxy := httputil.NewSingleHostReverseProxy(targetURL)
		proxy.ModifyResponse = func(resp *http.Response) error {
			resp.Header.Set("Access-Control-Allow-Origin", "*")
			resp.Header.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			resp.Header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			return nil
		}
		proxies[r.Prefix] = proxy
	}

	gatewayHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log incoming request
		log.Printf("Gateway: %s %s", r.Method, r.URL.Path)

		// Find matching route
		var matchedProxy *httputil.ReverseProxy
		for prefix, proxy := range proxies {
			if strings.HasPrefix(r.URL.Path, prefix) {
				matchedProxy = proxy
				break
			}
		}

		if matchedProxy == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error": "API route not found at gateway"}`))
			return
		}

		// Proxy request
		matchedProxy.ServeHTTP(w, r)
	})

	// Wrap in CORS middleware to allow local frontend access
	log.Println("API Gateway starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORS(gatewayHandler)))
}

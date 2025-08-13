package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"strings"
	"time"

	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
)

const sessionCookieName = "rd_session"

func MakeSessionCookie(cfg config.Config, userID string) *http.Cookie {
	sig := sign(cfg.SessionSecret, userID)
	val := base64.RawURLEncoding.EncodeToString([]byte(userID + "." + sig))
	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    val,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
	}
}

func ClearSessionCookie() *http.Cookie {
	return &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", Expires: time.Unix(0, 0), MaxAge: -1}
}

func SessionMiddleware(cfg config.Config) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(sessionCookieName)
			if err == nil {
				if uid, ok := parse(cfg.SessionSecret, c.Value); ok {
					r = r.WithContext(app.WithUserID(r.Context(), uid))
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func sign(secret, msg string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(msg))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func parse(secret, val string) (string, bool) {
	b, err := base64.RawURLEncoding.DecodeString(val)
	if err != nil {
		return "", false
	}
	parts := strings.SplitN(string(b), ".", 2)
	if len(parts) != 2 {
		return "", false
	}
	uid, sig := parts[0], parts[1]
	if sign(secret, uid) != sig {
		return "", false
	}
	return uid, true
}

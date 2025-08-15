package main

import (
	"log/slog"
	"os"
	"strings"

	"redrawn/api/internal/config"
)

// setupDefaultLogger initializes slog default logger based on config and mode.
func setupDefaultLogger(cfg config.Config, openapiOnly bool) {
	levelVar := new(slog.LevelVar)
	switch strings.ToLower(cfg.LogLevel) {
	case "debug":
		levelVar.Set(slog.LevelDebug)
	case "info":
		levelVar.Set(slog.LevelInfo)
	case "warn", "warning":
		levelVar.Set(slog.LevelWarn)
	case "error":
		levelVar.Set(slog.LevelError)
	default:
		levelVar.Set(slog.LevelInfo)
	}
	// When generating OpenAPI to stdout, redirect logs to stderr to avoid corrupting JSON output
	logOutput := os.Stdout
	if openapiOnly {
		logOutput = os.Stderr
	}
	var handler slog.Handler
	if cfg.LogFormat == "text" {
		handler = slog.NewTextHandler(logOutput, &slog.HandlerOptions{Level: levelVar})
	} else {
		handler = slog.NewJSONHandler(logOutput, &slog.HandlerOptions{Level: levelVar})
	}
	slog.SetDefault(slog.New(handler))
}

//go:build ignore

package main

import (
	"log"

	"entgo.io/ent/entc"
	"entgo.io/ent/entc/gen"
)

func main() {
	// Generate Ent code into this directory, using schema from ../schema
	cfg := &gen.Config{
		Target:  ".",
		Package: "redrawn/api/internal/generated",
	}
	if err := entc.Generate("../schema", cfg); err != nil {
		log.Fatalf("running ent codegen: %v", err)
	}
}

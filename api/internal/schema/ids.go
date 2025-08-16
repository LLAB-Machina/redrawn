package schema

import (
	gonanoid "github.com/matoous/go-nanoid/v2"
)

// newID generates a short, URL-safe ID for primary keys.
// Ent calls this function as a Default() provider for string IDs.
func newID() string {
	id, err := gonanoid.New(14)
	if err != nil {
		// only panics on invalid size (14 is valid)
		panic(err)
	}
	return id
}

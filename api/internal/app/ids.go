package app

import gonanoid "github.com/matoous/go-nanoid/v2"

// NewID returns a short, URL-safe ID (NanoID) of length 14.
// 200 years at 100 IDs/second gives 1% chance of collision.
// https://alex7kom.github.io/nano-nanoid-cc/?alphabet=_-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz&size=14&speed=100&speedUnit=second
func NewID() string {
	id, err := gonanoid.New(14)
	if err != nil {
		// only panics on invalid size (14 is valid)
		panic(err)
	}
	return id
}

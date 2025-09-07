package testutil

import (
	"context"
	"sync"
	"time"

	"redrawn/api/internal/api"
)

// FakeStorage implements storage.Client with in-memory no-op behavior.
type FakeStorage struct{}

func (f *FakeStorage) Download(_ context.Context, key string) ([]byte, string, error) {
	return []byte("data:" + key), "application/octet-stream", nil
}

func (f *FakeStorage) Upload(_ context.Context, _ string, _ []byte, _ string) error { return nil }

func (f *FakeStorage) PresignPut(_ context.Context, key string, _ string, _ time.Duration) (string, error) {
	return "https://upload.local/put/" + key, nil
}

func (f *FakeStorage) PresignGet(_ context.Context, key string, _ time.Duration) (string, error) {
	return "https://cdn.local/get/" + key, nil
}

// FakeQueue is a simple in-memory TaskQueue implementation for tests.
type FakeQueue struct {
	mu     sync.Mutex
	next   int
	status map[string]string
}

func NewFakeQueue() *FakeQueue {
	return &FakeQueue{status: map[string]string{}}
}

func (q *FakeQueue) EnqueueGenerate(_ context.Context, _ api.GenerateJobPayload) (string, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.next++
	id := "task-" + itoa(q.next)
	q.status[id] = "queued"
	return id, nil
}

func (q *FakeQueue) GetStatus(taskID string) (string, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()
	s, ok := q.status[taskID]
	return s, ok
}

func itoa(v int) string {
	// small, dependency-free integer to string conversion
	if v == 0 {
		return "0"
	}
	n := v
	buf := [20]byte{}
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + (n % 10))
		n /= 10
	}
	return string(buf[i:])
}

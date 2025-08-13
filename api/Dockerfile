# syntax=docker/dockerfile:1

FROM golang:1.25-alpine AS base
RUN apk add --no-cache git build-base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /api ./cmd/api

FROM gcr.io/distroless/base-debian12
WORKDIR /
COPY --from=base /api /api
EXPOSE 8080
USER 65532:65532
ENTRYPOINT ["/api"]


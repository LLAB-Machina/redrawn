package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"

	"redrawn/api/ent"
	"redrawn/api/ent/theme"
	"redrawn/api/internal/config"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func main() {
	var (
		name              = flag.String("name", "", "Price name (e.g., 'Basic Package')")
		stripePriceID     = flag.String("stripe-price-id", "", "Stripe price ID (e.g., 'price_1ABC123')")
		credits           = flag.Int("credits", 1, "Number of credits this price grants")
		active            = flag.Bool("active", true, "Whether this price is active")
		list              = flag.Bool("list", false, "List all prices")
		deleteID          = flag.String("delete", "", "Delete price by ID")
		seedDefaultThemes = flag.Bool("seed-default-themes", false, "Seed default themes (e.g., 'Ghibli')")
		// Admin/utility flags
		listUsers    = flag.Bool("list-users", false, "List all users (for fzf usage)")
		giveCredits  = flag.Bool("give-credits", false, "Give credits to a user (requires -user-id and -amount)")
		targetUserID = flag.String("user-id", "", "Target user ID (UUID)")
		amount       = flag.Int("amount", 0, "Amount of credits to give")
	)
	flag.Parse()

	cfg := config.FromEnv()

	// Initialize slog default logger for the CLI
	{
		levelVar := new(slog.LevelVar)
		switch cfg.LogLevel {
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
		var handler slog.Handler
		if cfg.LogFormat == "text" {
			handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: levelVar})
		} else {
			handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: levelVar})
		}
		slog.SetDefault(slog.New(handler))
	}
	if cfg.DatabaseURL == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	client, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", slog.String("err", err.Error()))
		os.Exit(1)
	}
	defer func() {
		if cerr := client.Close(); cerr != nil {
			slog.Warn("failed to close ent client", slog.String("err", cerr.Error()))
		}
	}()

	ctx := context.Background()

	switch {
	case *list:
		listPrices(ctx, client)
	case *listUsers:
		listAllUsers(ctx, client)
	case *deleteID != "":
		deletePriceByID(ctx, client, *deleteID)
	case *name != "" && *stripePriceID != "":
		createPrice(ctx, client, *name, *stripePriceID, *credits, *active)
	case *seedDefaultThemes:
		if err := seedThemes(ctx, client); err != nil {
			slog.Error("failed to seed themes", slog.String("err", err.Error()))
			os.Exit(1)
		}
		fmt.Println("Seeded default themes (no-op for existing)")
	case *giveCredits:
		if *targetUserID == "" || *amount <= 0 {
			slog.Error("-give-credits requires -user-id and -amount (>0)")
			os.Exit(1)
		}
		if err := addCreditsToUser(ctx, client, *targetUserID, *amount); err != nil {
			slog.Error("failed to give credits", slog.String("err", err.Error()))
			os.Exit(1)
		}
	default:
		fmt.Println("Usage:")
		fmt.Println("  # List all prices")
		fmt.Println("  go run ./cmd/seed -list")
		fmt.Println()
		fmt.Println("  # Create a new price")
		fmt.Println("  go run ./cmd/seed -name 'Basic Package' -stripe-price-id 'price_1ABC123' -credits 10")
		fmt.Println()
		fmt.Println("  # Delete a price")
		fmt.Println("  go run ./cmd/seed -delete 'price-uuid'")
		fmt.Println()
		fmt.Println("  # Seed default themes (idempotent)")
		fmt.Println("  go run ./cmd/seed -seed-default-themes")
		fmt.Println()
		fmt.Println("  # List users (for fzf)")
		fmt.Println("  go run ./cmd/seed -list-users")
		fmt.Println()
		fmt.Println("  # Give a user credits")
		fmt.Println("  go run ./cmd/seed -give-credits -user-id 'user-uuid' -amount 10")
		os.Exit(1)
	}
}

func listPrices(ctx context.Context, client *ent.Client) {
	prices, err := client.Price.Query().All(ctx)
	if err != nil {
		slog.Error("failed to list prices", slog.String("err", err.Error()))
		os.Exit(1)
	}

	if len(prices) == 0 {
		fmt.Println("No prices found.")
		return
	}

	fmt.Printf("%-36s %-20s %-20s %-8s %-8s\n", "ID", "Name", "Stripe Price ID", "Credits", "Active")
	fmt.Println("--------------------------------------------------------------------------------------------------------")
	for _, p := range prices {
		fmt.Printf("%-36s %-20s %-20s %-8d %-8t\n",
			p.ID.String(), p.Name, p.StripePriceID, p.Credits, p.Active)
	}
}

func createPrice(ctx context.Context, client *ent.Client, name, stripePriceID string, credits int, active bool) {
	price, err := client.Price.Create().
		SetName(name).
		SetStripePriceID(stripePriceID).
		SetCredits(credits).
		SetActive(active).
		Save(ctx)
	if err != nil {
		slog.Error("failed to create price", slog.String("err", err.Error()))
		os.Exit(1)
	}

	fmt.Printf("Created price: %s (ID: %s)\n", price.Name, price.ID.String())
}

func deletePriceByID(ctx context.Context, client *ent.Client, idStr string) {
	// Parse UUID
	id, err := uuid.Parse(idStr)
	if err != nil {
		slog.Error("invalid uuid", slog.String("err", err.Error()))
		os.Exit(1)
	}

	price, err := client.Price.Get(ctx, id)
	if err != nil {
		slog.Error("failed to find price", slog.String("id", idStr), slog.String("err", err.Error()))
		os.Exit(1)
	}

	err = client.Price.DeleteOne(price).Exec(ctx)
	if err != nil {
		slog.Error("failed to delete price", slog.String("err", err.Error()))
		os.Exit(1)
	}
	fmt.Printf("Deleted price: %s\n", price.Name)
}

func listAllUsers(ctx context.Context, client *ent.Client) {
	users, err := client.User.Query().All(ctx)
	if err != nil {
		slog.Error("failed to list users", slog.String("err", err.Error()))
		os.Exit(1)
	}
	if len(users) == 0 {
		fmt.Println("No users found.")
		return
	}
	// Print in a simple, whitespace-delimited format suitable for `fzf | awk '{print $1}'`
	// Columns: ID  Email  Name  Credits
	for _, u := range users {
		fmt.Printf("%s\t%s\t%s\t%d\n", u.ID.String(), u.Email, u.Name, u.Credits)
	}
}

func addCreditsToUser(ctx context.Context, client *ent.Client, idStr string, amount int) error {
	uid, err := uuid.Parse(idStr)
	if err != nil {
		return fmt.Errorf("invalid user id: %w", err)
	}
	if err := client.User.UpdateOneID(uid).AddCredits(int64(amount)).Exec(ctx); err != nil {
		return err
	}
	u, err := client.User.Get(ctx, uid)
	if err != nil {
		return err
	}
	fmt.Printf("Granted %d credits to %s (%s). New balance: %d\n", amount, u.Email, u.ID.String(), u.Credits)
	return nil
}

// seedThemes inserts default themes if they do not already exist.
// Currently seeds a single "Ghibli" style theme suitable for image generation.
func seedThemes(ctx context.Context, client *ent.Client) error {
	// Desired defaults
	defaults := []struct {
		Name   string
		Slug   string
		Prompt string
	}{
		{
			Name:   "Ghibli",
			Slug:   "ghibli",
			Prompt: "Studio Ghibli style, soft watercolor backgrounds, warm pastel palette, whimsical, gentle lighting, delicate linework, film-grain, storybook aesthetic, keep facial expressions and details",
		},
	}

	for _, d := range defaults {
		exists, err := client.Theme.Query().Where(theme.Slug(d.Slug)).Exist(ctx)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := client.Theme.Create().
			SetName(d.Name).
			SetSlug(d.Slug).
			SetPrompt(d.Prompt).
			Save(ctx); err != nil {
			return err
		}
		fmt.Printf("Created theme: %s (%s)\n", d.Name, d.Slug)
	}
	return nil
}

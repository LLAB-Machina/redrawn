package schema

// Centralized enum values shared across schema fields

// Roles within an album
const (
	RoleViewer      = "viewer"
	RoleContributor = "contributor"
	RoleEditor      = "editor"
)

var RoleValues = []string{RoleViewer, RoleContributor, RoleEditor}

// Album visibility
const (
	VisibilityPublic     = "public"
	VisibilityUnlisted   = "unlisted"
	VisibilityInviteOnly = "invite-only"
)

var VisibilityValues = []string{VisibilityPublic, VisibilityUnlisted, VisibilityInviteOnly}

// Who can see original photos within an album
const (
	OriginalsVisibleToEveryone     = "everyone"
	OriginalsVisibleToViewers      = "viewers"
	OriginalsVisibleToContributors = "contributors"
	OriginalsVisibleToEditors      = "editors"
)

var OriginalsVisibleToValues = []string{
	OriginalsVisibleToEveryone,
	OriginalsVisibleToViewers,
	OriginalsVisibleToContributors,
	OriginalsVisibleToEditors,
}

// Invite status for email-based invites
const (
	InviteStatusPending  = "pending"
	InviteStatusAccepted = "accepted"
	InviteStatusRevoked  = "revoked"
	InviteStatusExpired  = "expired"
)

var InviteStatusValues = []string{
	InviteStatusPending,
	InviteStatusAccepted,
	InviteStatusRevoked,
	InviteStatusExpired,
}

// Generated photo processing status
const (
	GeneratedStatusQueued     = "queued"
	GeneratedStatusProcessing = "processing"
	GeneratedStatusFinished   = "finished"
	GeneratedStatusFailed     = "failed"
)

var GeneratedStatusValues = []string{
	GeneratedStatusQueued,
	GeneratedStatusProcessing,
	GeneratedStatusFinished,
	GeneratedStatusFailed,
}

// Purchase status (Stripe lifecycle)
const (
	PurchaseStatusRequiresPayment = "requires_payment"
	PurchaseStatusSucceeded       = "succeeded"
	PurchaseStatusFailed          = "failed"
	PurchaseStatusRefunded        = "refunded"
)

var PurchaseStatusValues = []string{
	PurchaseStatusRequiresPayment,
	PurchaseStatusSucceeded,
	PurchaseStatusFailed,
	PurchaseStatusRefunded,
}
